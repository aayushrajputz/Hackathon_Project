package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"brainy-pdf/internal/config"
	"brainy-pdf/internal/handlers"
	"brainy-pdf/internal/middleware"
	"brainy-pdf/internal/services"
	"brainy-pdf/pkg/firebase"
	minioPkg "brainy-pdf/pkg/minio"
	"brainy-pdf/pkg/mongodb"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()
	
	log.Printf("🚀 Starting Server...")
	log.Printf("DEBUG: Loaded CORS Allowed Origins: %v", cfg.CORSAllowedOrigins)


	// Set Gin mode
	gin.SetMode(cfg.GinMode)

	// Initialize MongoDB
	mongoClient, err := mongodb.NewClient(cfg.MongoDBURI, cfg.MongoDBDatabase)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer mongoClient.Close(context.Background())

	// Initialize MinIO
	minioClient, err := minioPkg.NewClient(
		cfg.MinIOEndpoint,
		cfg.MinIOAccessKey,
		cfg.MinIOSecretKey,
		cfg.MinIOUseSSL,
		cfg.MinIOBucketTemp,
		cfg.MinIOBucketUserFiles,
	)
	if err != nil {
		log.Fatalf("Failed to connect to MinIO: %v", err)
	}

	// Initialize Firebase
	firebaseClient, err := firebase.NewClient(cfg.FirebaseCredentialsFile)
	if err != nil {
		log.Printf("Warning: Firebase not configured: %v", err)
		log.Println("Authentication will not work without Firebase credentials")
	}

	// Services
	pdfService, err := services.NewPDFService()
	if err != nil {
		log.Fatalf("Failed to create PDF service: %v", err)
	}
	aiService, err := services.NewAIService(context.Background(), cfg.OpenRouterAPIKey)
	if err != nil {
		log.Printf("Warning: Failed to initialize AI service: %v", err)
	}
	notificationService := services.NewNotificationService(mongoClient) // Correct signature
	userService := services.NewUserService(mongoClient)
	conversionService, err := services.NewConversionService(4) // Correct signature
	if err != nil {
		log.Printf("Warning: Conversion service not available: %v", err)
	}

	// Handlers
	authHandler := handlers.NewAuthHandler(userService, firebaseClient) // Assuming firebaseClient is authClient
	storageService := services.NewStorageService(minioClient, mongoClient, pdfService, userService, cfg.TempFileTTLHours)
	corePDFHandler := handlers.NewCorePDFHandler(pdfService, storageService, userService, mongoClient) // Original corePDFHandler
	aiHandler := handlers.NewAIHandler(aiService, pdfService, storageService) // Original aiHandler
	shareHandler := handlers.NewShareHandler(minioClient, mongoClient.MongoClient(), cfg.MongoDBDatabase, cfg.ServerHost, notificationService, conversionService)
	conversionHandler := handlers.NewConversionHandler(conversionService) // Original conversionHandler
	paymentHandler := handlers.NewPaymentHandler(cfg, userService, notificationService)
	
	// Original handlers that were not explicitly in the provided snippet but are needed
	pdfHandler := handlers.NewPDFHandler(pdfService, storageService, userService)
	storageHandler := handlers.NewStorageHandler(storageService)
	libraryHandler := handlers.NewLibraryHandler(minioClient, mongoClient, pdfService, userService)
	notificationHandler := handlers.NewNotificationHandler(notificationService, userService)
	adminHandler := handlers.NewAdminHandler(mongoClient, userService)


	// Create Gin router
	router := gin.Default()

	// Add middleware
	router.Use(middleware.CORSMiddleware(cfg.CORSAllowedOrigins))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().UTC(),
			"version":   "2.0.0",
			"features":  []string{"merge", "split", "organize", "ai-features", "ocr", "library", "convert", "admin"},
		})
	})

	// Auth middleware (defined at outer scope for use in multiple route groups)
	var authMiddleware gin.HandlerFunc = func(c *gin.Context) {
		c.Next() // No-op if Firebase not configured
	}
	var optionalAuthMiddleware gin.HandlerFunc = func(c *gin.Context) {
		c.Next()
	}
	var adminMiddleware gin.HandlerFunc = func(c *gin.Context) {
		c.Next()
	}

	if firebaseClient != nil {
		authMiddleware = middleware.AuthMiddleware(firebaseClient)
		optionalAuthMiddleware = middleware.OptionalAuthMiddleware(firebaseClient)
		adminMiddleware = middleware.AdminMiddleware(userService)
	}

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Register routes
		authHandler.RegisterRoutes(v1, authMiddleware)
		pdfHandler.RegisterRoutes(v1, authMiddleware)
		aiHandler.RegisterRoutes(v1, authMiddleware)
		storageHandler.RegisterRoutes(v1, authMiddleware, optionalAuthMiddleware)
		libraryHandler.RegisterRoutes(v1, authMiddleware)
		log.Println("📤 Registering Share routes...")
		shareHandler.RegisterRoutes(v1, authMiddleware)
		conversionHandler.RegisterRoutes(v1, optionalAuthMiddleware)
		notificationHandler.RegisterRoutes(v1, authMiddleware) // Register notification routes with auth
		paymentHandler.RegisterRoutes(v1, authMiddleware)
		adminHandler.RegisterRoutes(v1, authMiddleware, adminMiddleware)
	}

	// API routes (Phase 3 - /api/pdf/*)
	apiGroup := router.Group("/api")
	apiGroup.Use(optionalAuthMiddleware)
	{
		corePDFHandler.RegisterRoutes(apiGroup)
	}

	// Start cleanup goroutine for expired files
	go startCleanupJob(storageService)

	// Create server
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Graceful shutdown
	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit

		log.Println("Shutting down server...")

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := server.Shutdown(ctx); err != nil {
			log.Fatalf("Server forced to shutdown: %v", err)
		}

		log.Println("Server exited properly")
	}()

	// Start server
	log.Printf("🚀 BrainyPDF API server starting on port %s", cfg.Port)
	log.Printf("📄 API documentation available at http://localhost:%s/health", cfg.Port)

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// startCleanupJob runs periodic cleanup of expired temporary files
func startCleanupJob(storageService *services.StorageService) {
	ticker := time.NewTicker(30 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		deleted, err := storageService.CleanupExpiredFiles(ctx)
		cancel()

		if err != nil {
			log.Printf("Cleanup job error: %v", err)
		} else if deleted > 0 {
			log.Printf("Cleanup job: removed %d expired files", deleted)
		}
	}
}
