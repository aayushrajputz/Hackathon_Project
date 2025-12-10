package handlers

import (
	"io"
	"strconv"

	"brainy-pdf/internal/middleware"
	"brainy-pdf/internal/services"
	"brainy-pdf/internal/utils"
	"github.com/gin-gonic/gin"
)

// StorageHandler handles file storage endpoints
type StorageHandler struct {
	storageService *services.StorageService
}

// NewStorageHandler creates a new storage handler
func NewStorageHandler(storageService *services.StorageService) *StorageHandler {
	return &StorageHandler{storageService: storageService}
}

// Upload handles POST /api/v1/files/upload
func (h *StorageHandler) Upload(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		utils.BadRequest(c, "No file provided")
		return
	}
	defer file.Close()

	// Get user ID if authenticated
	userID, _ := middleware.GetUserID(c)
	
	// Check if file should be temporary
	isTemporary := c.DefaultPostForm("temporary", "false") == "true"
	if userID == "" {
		isTemporary = true
	}

	// Get content type
	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	result, err := h.storageService.UploadFile(
		c.Request.Context(),
		userID,
		header.Filename,
		contentType,
		file,
		header.Size,
		isTemporary,
	)
	if err != nil {
		utils.InternalServerError(c, "Upload failed: "+err.Error())
		return
	}

	utils.Success(c, result)
}

// GetFile handles GET /api/v1/files/:id
func (h *StorageHandler) GetFile(c *gin.Context) {
	fileID := c.Param("id")
	if fileID == "" {
		utils.BadRequest(c, "File ID required")
		return
	}

	doc, err := h.storageService.GetFileMetadata(c.Request.Context(), fileID)
	if err != nil {
		utils.NotFound(c, "File not found")
		return
	}

	// Get download URL
	url, _ := h.storageService.GetDownloadURL(c.Request.Context(), fileID)

	utils.Success(c, gin.H{
		"id":           doc.ID.Hex(),
		"filename":     doc.Filename,
		"originalName": doc.OriginalName,
		"mimeType":     doc.MimeType,
		"size":         doc.Size,
		"metadata":     doc.Metadata,
		"isTemporary":  doc.IsTemporary,
		"expiresAt":    doc.ExpiresAt,
		"createdAt":    doc.CreatedAt,
		"url":          url,
	})
}

// Download handles GET /api/v1/files/:id/download
func (h *StorageHandler) Download(c *gin.Context) {
	fileID := c.Param("id")
	if fileID == "" {
		utils.BadRequest(c, "File ID required")
		return
	}

	doc, data, err := h.storageService.GetFile(c.Request.Context(), fileID)
	if err != nil {
		utils.NotFound(c, "File not found")
		return
	}

	// Set headers for download
	c.Header("Content-Disposition", "attachment; filename=\""+doc.OriginalName+"\"")
	c.Header("Content-Type", doc.MimeType)
	c.Header("Content-Length", strconv.FormatInt(int64(len(data)), 10))

	c.Data(200, doc.MimeType, data)
}

// Delete handles DELETE /api/v1/files/:id
func (h *StorageHandler) Delete(c *gin.Context) {
	fileID := c.Param("id")
	if fileID == "" {
		utils.BadRequest(c, "File ID required")
		return
	}

	userID, _ := middleware.GetUserID(c)

	err := h.storageService.DeleteFile(c.Request.Context(), fileID, userID)
	if err != nil {
		utils.NotFound(c, "File not found or unauthorized")
		return
	}

	utils.Success(c, gin.H{
		"message": "File deleted successfully",
	})
}

// ListLibrary handles GET /api/v1/library
func (h *StorageHandler) ListLibrary(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		utils.Unauthorized(c, "Authentication required")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	folderID := c.Query("folderId")

	var folderPtr *string
	if folderID != "" {
		folderPtr = &folderID
	}

	docs, total, err := h.storageService.ListUserFiles(c.Request.Context(), userID, folderPtr, page, limit)
	if err != nil {
		utils.InternalServerError(c, "Failed to list files")
		return
	}

	// Convert to response format
	var files []gin.H
	for _, doc := range docs {
		url, _ := h.storageService.GetDownloadURL(c.Request.Context(), doc.ID.Hex())
		files = append(files, gin.H{
			"id":           doc.ID.Hex(),
			"filename":     doc.Filename,
			"originalName": doc.OriginalName,
			"mimeType":     doc.MimeType,
			"size":         doc.Size,
			"metadata":     doc.Metadata,
			"createdAt":    doc.CreatedAt,
			"url":          url,
		})
	}

	utils.Success(c, gin.H{
		"files": files,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// RegisterRoutes registers all storage routes
func (h *StorageHandler) RegisterRoutes(r *gin.RouterGroup, authMiddleware gin.HandlerFunc, optionalAuth gin.HandlerFunc) {
	// Public routes (with optional auth)
	files := r.Group("/files")
	files.Use(optionalAuth)
	{
		files.POST("/upload", h.Upload)
		files.GET("/:id", h.GetFile)
		files.GET("/:id/download", h.Download)
	}

	// Protected routes
	filesProtected := r.Group("/files")
	filesProtected.Use(authMiddleware)
	{
		filesProtected.DELETE("/:id", h.Delete)
	}

	// Library routes (protected)
	library := r.Group("/library")
	library.Use(authMiddleware)
	{
		library.GET("", h.ListLibrary)
	}
}

// UploadMultiple handles POST /api/v1/files/upload-multiple
func (h *StorageHandler) UploadMultiple(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		utils.BadRequest(c, "Invalid form data")
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		utils.BadRequest(c, "No files provided")
		return
	}

	userID, _ := middleware.GetUserID(c)
	isTemporary := userID == ""

	var results []gin.H
	for _, fileHeader := range files {
		file, err := fileHeader.Open()
		if err != nil {
			continue
		}

		contentType := fileHeader.Header.Get("Content-Type")
		if contentType == "" {
			contentType = "application/octet-stream"
		}

		result, err := h.storageService.UploadFile(
			c.Request.Context(),
			userID,
			fileHeader.Filename,
			contentType,
			file,
			fileHeader.Size,
			isTemporary,
		)
		file.Close()

		if err != nil {
			continue
		}

		results = append(results, gin.H{
			"fileId":   result.FileID,
			"filename": result.Filename,
			"url":      result.URL,
			"size":     result.Size,
		})
	}

	utils.Success(c, gin.H{
		"files":    results,
		"uploaded": len(results),
		"total":    len(files),
	})
}

// GetPresignedURL handles GET /api/v1/files/:id/presigned
func (h *StorageHandler) GetPresignedURL(c *gin.Context) {
	fileID := c.Param("id")
	if fileID == "" {
		utils.BadRequest(c, "File ID required")
		return
	}

	url, err := h.storageService.GetDownloadURL(c.Request.Context(), fileID)
	if err != nil {
		utils.NotFound(c, "File not found")
		return
	}

	utils.Success(c, gin.H{
		"url": url,
	})
}

// StreamFile handles GET /api/v1/files/:id/stream
func (h *StorageHandler) StreamFile(c *gin.Context) {
	fileID := c.Param("id")
	if fileID == "" {
		utils.BadRequest(c, "File ID required")
		return
	}

	doc, data, err := h.storageService.GetFile(c.Request.Context(), fileID)
	if err != nil {
		utils.NotFound(c, "File not found")
		return
	}

	c.Header("Content-Type", doc.MimeType)
	c.Header("Content-Length", strconv.FormatInt(int64(len(data)), 10))
	
	c.Writer.Write(data)
}

// Preview handles GET /api/v1/files/:id/preview for PDF preview
func (h *StorageHandler) Preview(c *gin.Context) {
	fileID := c.Param("id")
	if fileID == "" {
		utils.BadRequest(c, "File ID required")
		return
	}

	doc, data, err := h.storageService.GetFile(c.Request.Context(), fileID)
	if err != nil {
		utils.NotFound(c, "File not found")
		return
	}

	// For PDFs, serve directly for browser preview
	if doc.MimeType == "application/pdf" {
		c.Header("Content-Type", "application/pdf")
		c.Header("Content-Disposition", "inline; filename=\""+doc.OriginalName+"\"")
		c.Header("Content-Length", strconv.FormatInt(int64(len(data)), 10))
		
		c.Writer.WriteHeader(200)
		io.Copy(c.Writer, io.NopCloser(io.Reader(nil)))
		c.Writer.Write(data)
		return
	}

	// For other files, redirect to download
	c.Redirect(302, "/api/v1/files/"+fileID+"/download")
}
