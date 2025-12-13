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

	// Initialize services
	pdfService, err := services.NewPDFService()
	if err != nil {
		log.Fatalf("Failed to create PDF service: %v", err)
	}

	// Legacy AI Service (kept for compilation, though unused in PDF tools)
	aiService, err := services.NewAIService(context.Background(), cfg.OpenRouterAPIKey)
	if err != nil {
		log.Printf("Warning: AI service not fully configured: %v", err)
	}

	userService := services.NewUserService(mongoClient)
	notificationService := services.NewNotificationService(mongoClient) // Initialize NotificationService
	storageService := services.NewStorageService(minioClient, mongoClient, pdfService, userService, cfg.TempFileTTLHours)

	// Initialize conversion service (4 workers for concurrent conversions)
	conversionService, err := services.NewConversionService(4)
	if err != nil {
		log.Printf("Warning: Conversion service not available: %v", err)
	}

	// Initialize handlers
	pdfHandler := handlers.NewPDFHandler(pdfService, storageService)
	aiHandler := handlers.NewAIHandler(aiService, pdfService, storageService)
	storageHandler := handlers.NewStorageHandler(storageService)
	authHandler := handlers.NewAuthHandler(userService, firebaseClient)
	corePDFHandler := handlers.NewCorePDFHandler(pdfService, storageService, mongoClient)
	libraryHandler := handlers.NewLibraryHandler(minioClient, mongoClient, pdfService, userService)
	notificationHandler := handlers.NewNotificationHandler(notificationService) // Initialize NotificationHandler
	shareHandler := handlers.NewShareHandler(minioClient, mongoClient.MongoClient(), cfg.MongoDBDatabase, cfg.ServerHost, notificationService, conversionService) // Pass notificationService and conversionService
	conversionHandler := handlers.NewConversionHandler(conversionService)


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
			"features":  []string{"merge", "split", "organize", "ai-features", "ocr", "library", "convert"},
		})
	})

	// Auth middleware (defined at outer scope for use in multiple route groups)
	var authMiddleware gin.HandlerFunc = func(c *gin.Context) {
		c.Next() // No-op if Firebase not configured
	}
	var optionalAuthMiddleware gin.HandlerFunc = func(c *gin.Context) {
		c.Next()
	}

	if firebaseClient != nil {
		authMiddleware = middleware.AuthMiddleware(firebaseClient)
		optionalAuthMiddleware = middleware.OptionalAuthMiddleware(firebaseClient)
	}

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Register routes
		authHandler.RegisterRoutes(v1, authMiddleware)
		pdfHandler.RegisterRoutes(v1)
		aiHandler.RegisterRoutes(v1)
		storageHandler.RegisterRoutes(v1, authMiddleware, optionalAuthMiddleware)
		libraryHandler.RegisterRoutes(v1, authMiddleware)
		log.Println("📤 Registering Share routes...")
		shareHandler.RegisterRoutes(v1, authMiddleware)
		conversionHandler.RegisterRoutes(v1)
		notificationHandler.RegisterRoutes(v1) // Register notification routes
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
