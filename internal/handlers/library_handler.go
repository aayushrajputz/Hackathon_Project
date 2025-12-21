package handlers

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"brainy-pdf/internal/middleware"
	"brainy-pdf/internal/services"
	"brainy-pdf/internal/utils"
	"brainy-pdf/pkg/minio"
	"brainy-pdf/pkg/mongodb"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// LibraryItem represents a user's stored PDF in the library
type LibraryItem struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    string             `bson:"userId" json:"userId"`
	FileName  string             `bson:"fileName" json:"fileName"`
	FileKey   string             `bson:"fileKey" json:"fileKey"`
	FileURL   string             `bson:"fileUrl" json:"fileUrl"`
	Size      int64              `bson:"size" json:"size"`
	PageCount int                `bson:"pageCount" json:"pageCount"`
	MimeType  string             `bson:"mimeType" json:"mimeType"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// LibraryHandler handles user library operations
type LibraryHandler struct {
	minioClient  *minio.Client
	mongoClient  *mongodb.Client
	pdfService   *services.PDFService
	userService  *services.UserService
}

// NewLibraryHandler creates a new library handler
func NewLibraryHandler(minioClient *minio.Client, mongoClient *mongodb.Client, pdfService *services.PDFService, userService *services.UserService) *LibraryHandler {
	return &LibraryHandler{
		minioClient: minioClient,
		mongoClient: mongoClient,
		pdfService:  pdfService,
		userService: userService,
	}
}

// Upload handles POST /library/upload
// Uploads a PDF to user's library
func (h *LibraryHandler) Upload(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists || userID == "" {
		utils.Unauthorized(c, "Authentication required")
		return
	}

	// Get uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		utils.BadRequest(c, "No file provided")
		return
	}
	defer file.Close()

	// Validate file type
	if !strings.HasSuffix(strings.ToLower(header.Filename), ".pdf") {
		utils.BadRequest(c, "Only PDF files are allowed")
		return
	}

	// Check file size (50MB limit)
	if header.Size > 50*1024*1024 {
		utils.BadRequest(c, "File size must be less than 50MB")
		return
	}

	// Check user storage limit
	ok, err := h.userService.CheckStorageLimit(c.Request.Context(), userID, header.Size)
	if err != nil {
		utils.InternalServerError(c, "Failed to check storage limit")
		return
	}
	if !ok {
		utils.BadRequest(c, "Storage limit exceeded. Please upgrade your plan.")
		return
	}

	// Read file data
	data, err := io.ReadAll(file)
	if err != nil {
		utils.BadRequest(c, "Failed to read file")
		return
	}

	// Validate PDF
	if err := h.pdfService.ValidatePDF(data); err != nil {
		utils.BadRequest(c, "Invalid PDF file: "+err.Error())
		return
	}

	// Get page count
	pageCount, err := h.pdfService.GetPageCount(data)
	if err != nil {
		fmt.Printf("Warning: Failed to get page count for %s: %v\n", header.Filename, err)
        // Keep pageCount as 0 or set to 1 as fallback? 
        // 0 is technically correct if we don't know, but 1 is safer for UI.
        // Let's keep 0 but log it.
	}

	// Generate unique file key
	fileID := primitive.NewObjectID()
	fileKey := fmt.Sprintf("library/%s/%s_%s", userID, fileID.Hex(), header.Filename)

	// Upload to MinIO
	_, err = h.minioClient.UploadBytes(c.Request.Context(), h.minioClient.GetBucketUserFiles(), fileKey, data, "application/pdf")
	if err != nil {
		utils.InternalServerError(c, "Failed to upload file: "+err.Error())
		return
	}

	// Get file URL
	fileURL, err := h.minioClient.GetPresignedURL(c.Request.Context(), h.minioClient.GetBucketUserFiles(), fileKey, 7*24*time.Hour)
	if err != nil {
		fileURL = "" // Non-critical, can regenerate later
	}

	// Save metadata to MongoDB
	item := LibraryItem{
		ID:        fileID,
		UserID:    userID,
		FileName:  header.Filename,
		FileKey:   fileKey,
		FileURL:   fileURL,
		Size:      header.Size,
		PageCount: pageCount,
		MimeType:  "application/pdf",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	_, err = h.mongoClient.Collection("library").InsertOne(c.Request.Context(), item)
	if err != nil {
		// Rollback MinIO upload
		h.minioClient.DeleteFile(context.Background(), h.minioClient.GetBucketUserFiles(), fileKey)
		utils.InternalServerError(c, "Failed to save file metadata")
		return
	}

	// Update user storage usage
	if err := h.userService.UpdateStorageUsed(context.Background(), userID, header.Size); err != nil {
		// Log error but don't fail the request (storage usage might be slightly off but file is saved)
		fmt.Printf("Failed to update storage usage for user %s: %v\n", userID, err)
	}

	utils.Success(c, gin.H{
		"id":        item.ID.Hex(),
		"fileName":  item.FileName,
		"fileUrl":   item.FileURL,
		"size":      item.Size,
		"pageCount": item.PageCount,
		"createdAt": item.CreatedAt,
	})
}

// List handles GET /library/list
// Returns all PDFs for the authenticated user
func (h *LibraryHandler) List(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists || userID == "" {
		utils.Unauthorized(c, "Authentication required")
		return
	}

	// Query parameters
	sortBy := c.DefaultQuery("sortBy", "createdAt")
	sortOrder := c.DefaultQuery("sortOrder", "desc")
	search := c.Query("search")

	// Build filter
	filter := bson.M{"userId": userID}
	if search != "" {
		filter["fileName"] = bson.M{"$regex": search, "$options": "i"}
	}

	// Build sort
	sortDirection := -1
	if sortOrder == "asc" {
		sortDirection = 1
	}
	sortField := "createdAt"
	switch sortBy {
	case "name":
		sortField = "fileName"
	case "size":
		sortField = "size"
	case "pages":
		sortField = "pageCount"
	}

	opts := options.Find().SetSort(bson.D{{Key: sortField, Value: sortDirection}})

	cursor, err := h.mongoClient.Collection("library").Find(c.Request.Context(), filter, opts)
	if err != nil {
		utils.InternalServerError(c, "Failed to fetch library")
		return
	}
	defer cursor.Close(c.Request.Context())

	var items []LibraryItem
	if err := cursor.All(c.Request.Context(), &items); err != nil {
		utils.InternalServerError(c, "Failed to decode library items")
		return
	}

	// Refresh URLs if expired (optional, can regenerate on-demand)
	for i, item := range items {
		if item.FileURL == "" || time.Since(item.UpdatedAt) > 6*24*time.Hour {
			newURL, err := h.minioClient.GetPresignedURL(c.Request.Context(), h.minioClient.GetBucketUserFiles(), item.FileKey, 7*24*time.Hour)
			if err == nil {
				items[i].FileURL = newURL
			}
		}
	}

	// Build response
	response := make([]gin.H, len(items))
	for i, item := range items {
		response[i] = gin.H{
			"id":        item.ID.Hex(),
			"fileName":  item.FileName,
			"fileUrl":   item.FileURL,
			"size":      item.Size,
			"pageCount": item.PageCount,
			"createdAt": item.CreatedAt,
		}
	}

	utils.Success(c, response)
}

// Download handles GET /library/download/:id
// Returns file stream from MinIO
func (h *LibraryHandler) Download(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists || userID == "" {
		utils.Unauthorized(c, "Authentication required")
		return
	}

	fileID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(fileID)
	if err != nil {
		utils.BadRequest(c, "Invalid file ID")
		return
	}

	// Find file in MongoDB
	var item LibraryItem
	err = h.mongoClient.Collection("library").FindOne(
		c.Request.Context(),
		bson.M{"_id": objectID, "userId": userID},
	).Decode(&item)
	if err != nil {
		utils.NotFound(c, "File not found")
		return
	}

	// Stream file from MinIO
	data, err := h.minioClient.DownloadFile(c.Request.Context(), h.minioClient.GetBucketUserFiles(), item.FileKey)
	if err != nil {
		utils.InternalServerError(c, "Failed to download file")
		return
	}

	// Set headers for download
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, item.FileName))
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Length", fmt.Sprintf("%d", item.Size))

	// Send response
	c.Data(http.StatusOK, "application/pdf", data)
}

// Delete handles DELETE /library/:id
// Deletes file from MinIO and MongoDB
func (h *LibraryHandler) Delete(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists || userID == "" {
		utils.Unauthorized(c, "Authentication required")
		return
	}

	fileID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(fileID)
	if err != nil {
		utils.BadRequest(c, "Invalid file ID")
		return
	}

	// Find file in MongoDB
	var item LibraryItem
	err = h.mongoClient.Collection("library").FindOne(
		c.Request.Context(),
		bson.M{"_id": objectID, "userId": userID},
	).Decode(&item)
	if err != nil {
		utils.NotFound(c, "File not found")
		return
	}

	// Delete from MinIO
	err = h.minioClient.DeleteFile(c.Request.Context(), h.minioClient.GetBucketUserFiles(), item.FileKey)
	if err != nil {
		// Log but continue - file might already be deleted
		fmt.Printf("Warning: Failed to delete file from MinIO: %v\n", err)
	}

	// Delete from MongoDB
	_, err = h.mongoClient.Collection("library").DeleteOne(
		c.Request.Context(),
		bson.M{"_id": objectID, "userId": userID},
	)
	if err != nil {
		utils.InternalServerError(c, "Failed to delete file metadata")
		return
	}

	// Update user storage usage (decrement)
	if err := h.userService.UpdateStorageUsed(context.Background(), userID, -item.Size); err != nil {
		fmt.Printf("Failed to update storage usage for user %s: %v\n", userID, err)
	}

	utils.Success(c, gin.H{
		"success": true,
		"message": "File deleted successfully",
		"data": gin.H{
			"id":       fileID,
			"fileName": item.FileName,
		},
	})
}

// GetPresignedURL handles GET /library/url/:id
// Returns a fresh presigned URL for viewing
func (h *LibraryHandler) GetPresignedURL(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists || userID == "" {
		utils.Unauthorized(c, "Authentication required")
		return
	}

	fileID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(fileID)
	if err != nil {
		utils.BadRequest(c, "Invalid file ID")
		return
	}

	// Find file in MongoDB
	var item LibraryItem
	err = h.mongoClient.Collection("library").FindOne(
		c.Request.Context(),
		bson.M{"_id": objectID, "userId": userID},
	).Decode(&item)
	if err != nil {
		utils.NotFound(c, "File not found")
		return
	}

	// Generate fresh URL
	url, err := h.minioClient.GetPresignedURL(c.Request.Context(), h.minioClient.GetBucketUserFiles(), item.FileKey, 1*time.Hour)
	if err != nil {
		utils.InternalServerError(c, "Failed to generate URL")
		return
	}

	utils.Success(c, gin.H{
		"success": true,
		"data": gin.H{
			"id":       fileID,
			"fileName": item.FileName,
			"url":      url,
			"expiresIn": "1 hour",
		},
	})
}

// RegisterRoutes registers library routes
func (h *LibraryHandler) RegisterRoutes(r *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	library := r.Group("/library")
	library.Use(authMiddleware)
	{
		library.POST("/upload", h.Upload)
		library.GET("/list", h.List)
		library.GET("/download/:id", h.Download)
		library.GET("/url/:id", h.GetPresignedURL)
		library.DELETE("/:id", h.Delete)
	}
}
