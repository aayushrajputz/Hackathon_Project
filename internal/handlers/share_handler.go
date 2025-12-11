package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"brainy-pdf/internal/models"
	"brainy-pdf/internal/middleware"
	"brainy-pdf/internal/services"
	minioPkg "brainy-pdf/pkg/minio"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type ShareHandler struct {
	minioClient       *minioPkg.Client
	db                *mongo.Database
	serverHost        string // e.g., "http://localhost:3000"
	notificationService *services.NotificationService
}

func NewShareHandler(minioClient *minioPkg.Client, mongoClient *mongo.Client, dbName, serverHost string, notifService *services.NotificationService) *ShareHandler {
	return &ShareHandler{
		minioClient:         minioClient,
		db:                  mongoClient.Database(dbName),
		serverHost:          serverHost,
		notificationService: notifService,
	}
}

// CreateShareRequest
type CreateShareRequest struct {
	FileID           string `json:"fileId" binding:"required"`
	FileType         string `json:"fileType" binding:"required,oneof=library temp"`
	Filename         string `json:"filename"` // Optional filename for display
	ExpiresInMinutes int    `json:"expiresInMinutes"` // Minutes, default 1440 (24h)
}

// generateCode creates a random 8-char hex string
func generateCode() string {
	bytes := make([]byte, 4)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// CreateShare generates a public link
func (h *ShareHandler) CreateShare(c *gin.Context) {
	var req CreateShareRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userId, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Default expiration: 24h (1440 mins)
	if req.ExpiresInMinutes <= 0 {
		req.ExpiresInMinutes = 1440
	}
	// Max limit checks (e.g. max 7 days = 10080 mins)
	if req.ExpiresInMinutes > 10080 {
		req.ExpiresInMinutes = 1440
	}

	code := generateCode()
	expiresAt := time.Now().Add(time.Duration(req.ExpiresInMinutes) * time.Minute)

	// Fetch filename if not provided
	filename := req.Filename
	if filename == "" {
		// Try to look up the original document filename
		var doc models.Document
		if fileObjID, err := primitive.ObjectIDFromHex(req.FileID); err == nil {
			if err := h.db.Collection("documents").FindOne(context.Background(), bson.M{"_id": fileObjID}).Decode(&doc); err == nil && doc.OriginalName != "" {
				filename = doc.OriginalName
			}
		}
		
		// Fallback defaults if lookup fails
		if filename == "" {
			if req.FileType == "temp" {
				filename = "converted_document.pdf"
			} else {
				filename = "shared_file.pdf" // Added extension
			}
		}
	}

	share := models.Share{
		Code:      code,
		FileID:    req.FileID,
		FileType:  req.FileType,
		CreatorID: userId,
		Filename:  filename,
		ExpiresAt: expiresAt,
		CreatedAt: time.Now(),
		Stats: models.ShareStats{
			Views:     0,
			Downloads: 0,
		},
	}

	_, err := h.db.Collection("shares").InsertOne(context.Background(), share)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create share link"})
		return
	}

	shareUrl := fmt.Sprintf("%s/s/%s", h.serverHost, code)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"code":      code,
			"url":       shareUrl,
			"expiresAt": expiresAt,
		},
	})
}

// GetShare retrieves the file info and a download URL
func (h *ShareHandler) GetShare(c *gin.Context) {
	code := c.Param("code")

	var share models.Share
	err := h.db.Collection("shares").FindOne(context.Background(), bson.M{"code": code}).Decode(&share)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Share link not found or expired"})
		return
	}

	if time.Now().After(share.ExpiresAt) {
		c.JSON(http.StatusGone, gin.H{"error": "Share link expired"})
		return
	}

	// Update stats (async)
	// Update stats (async)
	go func() {
		h.db.Collection("shares").UpdateOne(context.Background(), 
			bson.M{"code": code}, 
			bson.M{"$inc": bson.M{"stats.views": 1}, "$set": bson.M{"stats.lastAccess": time.Now()}},
		)

		// Notify owner (avoid self-notification would require checking creatorID vs current user, 
		// but this is public link so usually anonymous viewer)
		if share.CreatorID != "" {
			h.notificationService.CreateNotification(
				context.Background(),
				share.CreatorID,
				"File Viewed",
				fmt.Sprintf("Your shared file '%s' was viewed.", share.Filename),
				models.NotificationTypeInfo,
			)
		}
	}()

	var downloadURL string

	// Unified download URL pointing to our backend endpoint
	// Use the current request's host to construct the download URL dynamically
	scheme := "http"
	if c.Request.TLS != nil || c.Request.Header.Get("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}
	downloadURL = fmt.Sprintf("%s://%s/api/v1/share/download/%s", scheme, c.Request.Host, code)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"filename": share.Filename,
			"url":      downloadURL,
			"expiresAt": share.ExpiresAt,
		},
	})
}

func (h *ShareHandler) RegisterRoutes(router *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	fmt.Println("[Share] Registering /share routes")
	// Protected: Create share
	router.POST("/share", authMiddleware, h.CreateShare)
	
	// Public: Access share
	router.GET("/share/:code", h.GetShare)
	
	// Public: Download shared file (streaming)
	router.GET("/share/download/:code", h.Download)
}

// Download handles the actual file streaming for shared files
func (h *ShareHandler) Download(c *gin.Context) {
	code := c.Param("code")

	var share models.Share
	err := h.db.Collection("shares").FindOne(context.Background(), bson.M{"code": code}).Decode(&share)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Share link not found or expired"})
		return
	}

	if time.Now().After(share.ExpiresAt) {
		c.JSON(http.StatusGone, gin.H{"error": "Share link expired"})
		return
	}

	// Increment download count (async)
	go func() {
		h.db.Collection("shares").UpdateOne(context.Background(),
			bson.M{"code": code},
			bson.M{"$inc": bson.M{"stats.downloads": 1}},
		)

		// Notify owner
		if share.CreatorID != "" {
			h.notificationService.CreateNotification(
				context.Background(),
				share.CreatorID,
				"File Downloaded",
				fmt.Sprintf("Your shared file '%s' was downloaded.", share.Filename),
				models.NotificationTypeSuccess,
			)
		}
	}()

	// Fetch actual document record to get MinIO path
	var doc models.Document
	objID, err := primitive.ObjectIDFromHex(share.FileID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid file ID"})
		return
	}

	err = h.db.Collection("documents").FindOne(context.Background(), bson.M{"_id": objID}).Decode(&doc)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Original file not found"})
		return
	}

	// Parse bucket and object path from doc.MinIOPath (format: bucket/path/to/file)
	parts := strings.SplitN(doc.MinIOPath, "/", 2)
	if len(parts) != 2 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid file path in storage"})
		return
	}
	bucketName := parts[0]
	objectName := parts[1]

	// Get file info for size
	info, err := h.minioClient.GetFileInfo(context.Background(), bucketName, objectName)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found in storage"})
		return
	}

	// Get object stream
	object, err := h.minioClient.GetObject(context.Background(), bucketName, objectName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve file"})
		return
	}
	defer object.Close()

	// Set headers
	contentType := doc.MimeType
	if contentType == "" {
		contentType = "application/pdf"
	}
	
	// Determine filename for download
	downloadFilename := share.Filename
	// If share filename is generic "shared_file" or lacks extension, try to use original filename
	if (downloadFilename == "shared_file" || filepath.Ext(downloadFilename) == "") && doc.OriginalName != "" {
		downloadFilename = doc.OriginalName
	}
	// Ultimate fallback
	if filepath.Ext(downloadFilename) == "" {
		downloadFilename += ".pdf"
	}
	
	// Force download
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", downloadFilename))
	c.Header("Content-Type", contentType)
	c.Header("Content-Length", fmt.Sprintf("%d", info.Size))

	// Stream
	io.Copy(c.Writer, object)
}
