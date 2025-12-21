package handlers

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"

	"brainy-pdf/internal/config"
	"brainy-pdf/internal/middleware"
	"brainy-pdf/internal/services"
	"brainy-pdf/internal/utils"
	"github.com/gin-gonic/gin"
)

// PDFHandler handles PDF operation endpoints
type PDFHandler struct {
	pdfService     *services.PDFService
	storageService *services.StorageService
	userService    *services.UserService
}

// NewPDFHandler creates a new PDF handler
func NewPDFHandler(pdfService *services.PDFService, storageService *services.StorageService, userService *services.UserService) *PDFHandler {
	return &PDFHandler{
		pdfService:     pdfService,
		storageService: storageService,
		userService:    userService,
	}
}

func (h *PDFHandler) checkFileSize(c *gin.Context, size int64) bool {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		utils.Unauthorized(c, "Unauthorized")
		return false
	}

	user, err := h.userService.GetUserByFirebaseUID(context.Background(), userID)
	if err != nil {
		utils.InternalServerError(c, "Failed to fetch user limits")
		return false
	}

	limits, ok := config.Plans[user.Plan]
	if !ok {
		limits = config.Plans["free"]
	}

	if size > limits.MaxFileSize {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "File too large",
			"message": fmt.Sprintf("Your current plan (%s) allows files up to %d MB. Please upgrade to process larger files.", user.Plan, limits.MaxFileSize/(1024*1024)),
			"code":    "PLAN_LIMIT_EXCEEDED",
		})
		return false
	}
	return true
}

// Merge handles POST /api/v1/pdf/merge
func (h *PDFHandler) Merge(c *gin.Context) {
	// Get multipart form
	form, err := c.MultipartForm()
	if err != nil {
		utils.BadRequest(c, "Invalid form data")
		return
	}

	files := form.File["files"]
	if len(files) < 2 {
		utils.BadRequest(c, "At least 2 PDF files required")
		return
	}

	// Calculate total size
	var totalSize int64
	for _, file := range files {
		totalSize += file.Size
	}

	if !h.checkFileSize(c, totalSize) {
		return
	}

	// Read all files
	var pdfData [][]byte
	for _, file := range files {
		f, err := file.Open()
		if err != nil {
			utils.BadRequest(c, "Failed to read file: "+file.Filename)
			return
		}
		defer f.Close()

		data, err := io.ReadAll(f)
		if err != nil {
			utils.BadRequest(c, "Failed to read file: "+file.Filename)
			return
		}

		// Validate PDF
		if err := h.pdfService.ValidatePDF(data); err != nil {
			utils.BadRequest(c, fmt.Sprintf("Invalid PDF file: %s", file.Filename))
			return
		}

		pdfData = append(pdfData, data)
	}

	// Merge PDFs
	result, err := h.pdfService.Merge(c.Request.Context(), pdfData)
	if err != nil {
		utils.InternalServerError(c, "Failed to merge PDFs: "+err.Error())
		return
	}

	// Upload result
	userID, _ := middleware.GetUserID(c)
	uploadResult, err := h.storageService.UploadProcessedFile(
		c.Request.Context(),
		userID,
		"merged.pdf",
		result.Data,
		"",
	)
	if err != nil {
		utils.InternalServerError(c, "Failed to save merged PDF")
		return
	}

	utils.Success(c, gin.H{
		"fileId":    uploadResult.FileID,
		"url":       uploadResult.URL,
		"filename":  uploadResult.Filename,
		"size":      uploadResult.Size,
		"pageCount": result.PageCount,
	})
}

// Split handles POST /api/v1/pdf/split
func (h *PDFHandler) Split(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		utils.BadRequest(c, "No file provided")
		return
	}
	defer file.Close()

	if !h.checkFileSize(c, header.Size) {
		return
	}

	pages := c.PostForm("pages")
	if pages == "" {
		utils.BadRequest(c, "Pages parameter required (e.g., '1-3,5,7-9')")
		return
	}

	data, err := io.ReadAll(file)
	if err != nil {
		utils.BadRequest(c, "Failed to read file")
		return
	}

	if err := h.pdfService.ValidatePDF(data); err != nil {
		utils.BadRequest(c, "Invalid PDF file")
		return
	}

	result, err := h.pdfService.Split(c.Request.Context(), data, pages)
	if err != nil {
		utils.InternalServerError(c, "Failed to split PDF: "+err.Error())
		return
	}

	userID, _ := middleware.GetUserID(c)
	var urls []gin.H

	for i, splitData := range result.Files {
		baseName := strings.TrimSuffix(header.Filename, ".pdf")
		uploadResult, err := h.storageService.UploadProcessedFile(
			c.Request.Context(),
			userID,
			fmt.Sprintf("%s_part%d.pdf", baseName, i+1),
			splitData,
			"",
		)
		if err != nil {
			continue
		}
		urls = append(urls, gin.H{
			"fileId":   uploadResult.FileID,
			"url":      uploadResult.URL,
			"filename": uploadResult.Filename,
			"size":     uploadResult.Size,
		})
	}

	utils.Success(c, gin.H{
		"files": urls,
		"total": len(urls),
	})
}


// Rotate handles POST /api/v1/pdf/rotate
func (h *PDFHandler) Rotate(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		utils.BadRequest(c, "No file provided")
		return
	}
	defer file.Close()

	if !h.checkFileSize(c, header.Size) {
		return
	}

	pages := c.PostForm("pages")
	if pages == "" {
		pages = "1-" // All pages
	}

	angleStr := c.PostForm("angle")
	angle, err := strconv.Atoi(angleStr)
	if err != nil || (angle != 90 && angle != 180 && angle != 270) {
		utils.BadRequest(c, "Angle must be 90, 180, or 270")
		return
	}

	data, err := io.ReadAll(file)
	if err != nil {
		utils.BadRequest(c, "Failed to read file")
		return
	}

	result, err := h.pdfService.Rotate(c.Request.Context(), data, pages, angle)
	if err != nil {
		utils.InternalServerError(c, "Failed to rotate PDF: "+err.Error())
		return
	}

	userID, _ := middleware.GetUserID(c)
	uploadResult, err := h.storageService.UploadProcessedFile(
		c.Request.Context(),
		userID,
		"rotated.pdf",
		result.Data,
		"",
	)
	if err != nil {
		utils.InternalServerError(c, "Failed to save rotated PDF")
		return
	}

	utils.Success(c, gin.H{
		"fileId":    uploadResult.FileID,
		"url":       uploadResult.URL,
		"filename":  uploadResult.Filename,
		"pageCount": result.PageCount,
	})
}

// Compress handles POST /api/v1/pdf/compress
func (h *PDFHandler) Compress(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		utils.BadRequest(c, "No file provided")
		return
	}
	defer file.Close()

	if !h.checkFileSize(c, header.Size) {
		return
	}

	quality := c.DefaultPostForm("quality", "medium")

	data, err := io.ReadAll(file)
	if err != nil {
		utils.BadRequest(c, "Failed to read file")
		return
	}

	// Validate PDF before processing
	if err := h.pdfService.ValidatePDF(data); err != nil {
		utils.BadRequest(c, "Invalid PDF file: "+err.Error())
		return
	}

	// Get page count before compression
	pageCount, _ := h.pdfService.GetPageCount(data)

	result, err := h.pdfService.Compress(c.Request.Context(), data, quality)
	if err != nil {
		utils.InternalServerError(c, "Failed to compress PDF: "+err.Error())
		return
	}

	userID, _ := middleware.GetUserID(c)
	uploadResult, err := h.storageService.UploadProcessedFile(
		c.Request.Context(),
		userID,
		"compressed.pdf",
		result.Data,
		"",
	)
	if err != nil {
		utils.InternalServerError(c, "Failed to save compressed PDF")
		return
	}

	utils.Success(c, gin.H{
		"fileId":         uploadResult.FileID,
		"url":            uploadResult.URL,
		"filename":       uploadResult.Filename,
		"originalSize":   result.SizeBefore,
		"compressedSize": result.SizeAfter,
		"reduction":      fmt.Sprintf("%.1f%%", result.Compression),
		"pageCount":      pageCount,
		"quality":        quality,
	})
}

// ExtractPages handles POST /api/v1/pdf/extract-pages
func (h *PDFHandler) ExtractPages(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		utils.BadRequest(c, "No file provided")
		return
	}
	defer file.Close()

	if !h.checkFileSize(c, header.Size) {
		return
	}

	pages := c.PostForm("pages")
	if pages == "" {
		utils.BadRequest(c, "Pages parameter required (e.g., '1,3,5')")
		return
	}

	data, err := io.ReadAll(file)
	if err != nil {
		utils.BadRequest(c, "Failed to read file")
		return
	}

	result, err := h.pdfService.ExtractPages(c.Request.Context(), data, pages)
	if err != nil {
		utils.InternalServerError(c, "Failed to extract pages: "+err.Error())
		return
	}

	userID, _ := middleware.GetUserID(c)
	uploadResult, err := h.storageService.UploadProcessedFile(
		c.Request.Context(),
		userID,
		"extracted.pdf",
		result,
		"",
	)
	if err != nil {
		utils.InternalServerError(c, "Failed to save extracted PDF")
		return
	}

	utils.Success(c, gin.H{
		"fileId":   uploadResult.FileID,
		"url":      uploadResult.URL,
		"filename": uploadResult.Filename,
		"size":     uploadResult.Size,
	})
}

// RemovePages handles POST /api/v1/pdf/remove-pages
func (h *PDFHandler) RemovePages(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		utils.BadRequest(c, "No file provided")
		return
	}
	defer file.Close()

	if !h.checkFileSize(c, header.Size) {
		return
	}

	pages := c.PostForm("pages")
	if pages == "" {
		utils.BadRequest(c, "Pages parameter required (e.g., '2,4')")
		return
	}

	data, err := io.ReadAll(file)
	if err != nil {
		utils.BadRequest(c, "Failed to read file")
		return
	}

	result, err := h.pdfService.RemovePages(c.Request.Context(), data, pages)
	if err != nil {
		utils.InternalServerError(c, "Failed to remove pages: "+err.Error())
		return
	}

	userID, _ := middleware.GetUserID(c)
	uploadResult, err := h.storageService.UploadProcessedFile(
		c.Request.Context(),
		userID,
		"modified.pdf",
		result,
		"",
	)
	if err != nil {
		utils.InternalServerError(c, "Failed to save modified PDF")
		return
	}

	newPageCount, _ := h.pdfService.GetPageCount(result)
	originalPageCount, _ := h.pdfService.GetPageCount(data)

	utils.Success(c, gin.H{
		"fileId":        uploadResult.FileID,
		"url":           uploadResult.URL,
		"filename":      uploadResult.Filename,
		"size":          uploadResult.Size,
		"pageCount":     newPageCount,
		"originalPages": originalPageCount,
	})
}

// Organize handles POST /api/v1/pdf/organize
func (h *PDFHandler) Organize(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		utils.BadRequest(c, "No file provided")
		return
	}
	defer file.Close()

	if !h.checkFileSize(c, header.Size) {
		return
	}

	orderStr := c.PostForm("order")
	if orderStr == "" {
		utils.BadRequest(c, "Order parameter required (e.g., '3,1,2,4')")
		return
	}

	// Parse order
	var order []int
	for _, s := range strings.Split(orderStr, ",") {
		s = strings.TrimSpace(s)
		n, err := strconv.Atoi(s)
		if err != nil {
			utils.BadRequest(c, "Invalid order format")
			return
		}
		order = append(order, n)
	}

	data, err := io.ReadAll(file)
	if err != nil {
		utils.BadRequest(c, "Failed to read file")
		return
	}

	result, err := h.pdfService.OrganizePages(c.Request.Context(), data, order)
	if err != nil {
		utils.InternalServerError(c, "Failed to organize pages: "+err.Error())
		return
	}

	userID, _ := middleware.GetUserID(c)
	uploadResult, err := h.storageService.UploadProcessedFile(
		c.Request.Context(),
		userID,
		"organized.pdf",
		result,
		"",
	)
	if err != nil {
		utils.InternalServerError(c, "Failed to save organized PDF")
		return
	}

	newPageCount, _ := h.pdfService.GetPageCount(result)
	originalPageCount, _ := h.pdfService.GetPageCount(data)

	utils.Success(c, gin.H{
		"fileId":        uploadResult.FileID,
		"url":           uploadResult.URL,
		"filename":      uploadResult.Filename,
		"size":          uploadResult.Size,
		"pageCount":     newPageCount,
		"originalPages": originalPageCount,
	})
}

// Watermark handles POST /api/v1/pdf/watermark
func (h *PDFHandler) Watermark(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		utils.BadRequest(c, "No file provided")
		return
	}
	defer file.Close()

	if !h.checkFileSize(c, header.Size) {
		return
	}

	text := c.PostForm("text")
	if text == "" {
		utils.BadRequest(c, "Watermark text required")
		return
	}

	position := c.DefaultPostForm("position", "center")
	opacityStr := c.DefaultPostForm("opacity", "0.3")
	opacity, _ := strconv.ParseFloat(opacityStr, 64)

	data, err := io.ReadAll(file)
	if err != nil {
		utils.BadRequest(c, "Failed to read file")
		return
	}

	result, err := h.pdfService.AddWatermark(c.Request.Context(), data, services.WatermarkOptions{
		Text:     text,
		Position: position,
		Opacity:  opacity,
	})
	if err != nil {
		utils.InternalServerError(c, "Failed to add watermark: "+err.Error())
		return
	}

	userID, _ := middleware.GetUserID(c)
	uploadResult, err := h.storageService.UploadProcessedFile(
		c.Request.Context(),
		userID,
		"watermarked.pdf",
		result,
		"",
	)
	if err != nil {
		utils.InternalServerError(c, "Failed to save watermarked PDF")
		return
	}

	utils.Success(c, gin.H{
		"fileId":   uploadResult.FileID,
		"url":      uploadResult.URL,
		"filename": uploadResult.Filename,
		"size":     uploadResult.Size,
	})
}

// PageNumbers handles POST /api/v1/pdf/page-numbers
func (h *PDFHandler) PageNumbers(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		utils.BadRequest(c, "No file provided")
		return
	}
	defer file.Close()

	if !h.checkFileSize(c, header.Size) {
		return
	}

	position := c.DefaultPostForm("position", "bottom-center")
	format := c.DefaultPostForm("format", "{n}")
	startFromStr := c.DefaultPostForm("startFrom", "1")
	startFrom, _ := strconv.Atoi(startFromStr)

	data, err := io.ReadAll(file)
	if err != nil {
		utils.BadRequest(c, "Failed to read file")
		return
	}

	result, err := h.pdfService.AddPageNumbers(c.Request.Context(), data, services.PageNumberOptions{
		Position:  position,
		Format:    format,
		StartFrom: startFrom,
	})
	if err != nil {
		utils.InternalServerError(c, "Failed to add page numbers: "+err.Error())
		return
	}

	userID, _ := middleware.GetUserID(c)
	uploadResult, err := h.storageService.UploadProcessedFile(
		c.Request.Context(),
		userID,
		"numbered.pdf",
		result,
		"",
	)
	if err != nil {
		utils.InternalServerError(c, "Failed to save numbered PDF")
		return
	}

	utils.Success(c, gin.H{
		"fileId":   uploadResult.FileID,
		"url":      uploadResult.URL,
		"filename": uploadResult.Filename,
		"size":     uploadResult.Size,
	})
}

// Crop handles POST /api/v1/pdf/crop
func (h *PDFHandler) Crop(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		utils.BadRequest(c, "No file provided")
		return
	}
	defer file.Close()

	if !h.checkFileSize(c, header.Size) {
		return
	}

	top, _ := strconv.ParseFloat(c.DefaultPostForm("top", "0"), 64)
	right, _ := strconv.ParseFloat(c.DefaultPostForm("right", "0"), 64)
	bottom, _ := strconv.ParseFloat(c.DefaultPostForm("bottom", "0"), 64)
	left, _ := strconv.ParseFloat(c.DefaultPostForm("left", "0"), 64)

	data, err := io.ReadAll(file)
	if err != nil {
		utils.BadRequest(c, "Failed to read file")
		return
	}

	result, err := h.pdfService.Crop(c.Request.Context(), data, services.CropOptions{
		Top:    top,
		Right:  right,
		Bottom: bottom,
		Left:   left,
	})
	if err != nil {
		utils.InternalServerError(c, "Failed to crop PDF: "+err.Error())
		return
	}

	userID, _ := middleware.GetUserID(c)
	uploadResult, err := h.storageService.UploadProcessedFile(
		c.Request.Context(),
		userID,
		"cropped.pdf",
		result,
		"",
	)
	if err != nil {
		utils.InternalServerError(c, "Failed to save cropped PDF")
		return
	}

	utils.Success(c, gin.H{
		"fileId":   uploadResult.FileID,
		"url":      uploadResult.URL,
		"filename": uploadResult.Filename,
		"size":     uploadResult.Size,
	})
}

// GetInfo handles GET /api/v1/pdf/info
func (h *PDFHandler) GetInfo(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		utils.BadRequest(c, "No file provided")
		return
	}
	defer file.Close()

	if !h.checkFileSize(c, header.Size) {
		return
	}

	data, err := io.ReadAll(file)
	if err != nil {
		utils.BadRequest(c, "Failed to read file")
		return
	}

	log.Printf("[PDF] GetInfo for file: %s, size: %d", header.Filename, header.Size)
	info, err := h.pdfService.GetInfo(data)
	if err != nil {
		log.Printf("[PDF] Error getting info: %v", err)
		utils.InternalServerError(c, "Failed to get PDF info: "+err.Error())
		return
	}

	pageCount, err := h.pdfService.GetPageCount(data)
	if err != nil {
		log.Printf("[PDF] Error getting page count: %v", err)
		utils.InternalServerError(c, "Failed to parse PDF pages: "+err.Error())
		return
	}
	log.Printf("[PDF] Detected %d pages", pageCount)
	
	utils.Success(c, gin.H{
		"pageCount": pageCount,
		"size":      len(data),
		"title":     info["title"],
		"author":    info["author"],
		"subject":   info["subject"],
		"version":   info["version"],
	})
}

// RegisterRoutes registers all PDF routes
func (h *PDFHandler) RegisterRoutes(r *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	pdf := r.Group("/pdf")
	pdf.Use(authMiddleware)
	{
		pdf.POST("/merge", h.Merge)
		pdf.POST("/split", h.Split)
		pdf.POST("/rotate", h.Rotate)
		pdf.POST("/compress", h.Compress)
		pdf.POST("/extract-pages", h.ExtractPages)
		pdf.POST("/remove-pages", h.RemovePages)
		pdf.POST("/organize", h.Organize)
		pdf.POST("/watermark", h.Watermark)
		pdf.POST("/page-numbers", h.PageNumbers)
		pdf.POST("/crop", h.Crop)
		pdf.POST("/info", h.GetInfo)
	}
}
