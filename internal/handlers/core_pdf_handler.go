package handlers

import (
	"fmt"
	"io"
	"strings"
	"time"

	"brainy-pdf/internal/config"
	"brainy-pdf/internal/middleware"
	"brainy-pdf/internal/services"
	"brainy-pdf/internal/utils"
	"brainy-pdf/pkg/mongodb"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// CorePDFHandler handles core PDF operations (Phase 3)
type CorePDFHandler struct {
	pdfService     *services.PDFService
	storageService *services.StorageService
	userService    *services.UserService
	mongoClient    *mongodb.Client
}

// OperationLog represents a logged PDF operation
type OperationLog struct {
	ID            primitive.ObjectID `bson:"_id,omitempty"`
	UserID        string             `bson:"userId,omitempty"`
	Operation     string             `bson:"operation"`
	InputFiles    []string           `bson:"inputFiles"`
	OutputFileID  string             `bson:"outputFileId,omitempty"`
	OutputFiles   []string           `bson:"outputFiles,omitempty"`
	PageCount     int                `bson:"pageCount,omitempty"`
	Status        string             `bson:"status"` // success, error
	ErrorMessage  string             `bson:"errorMessage,omitempty"`
	ProcessingMs  int64              `bson:"processingMs"`
	CreatedAt     time.Time          `bson:"createdAt"`
}

// NewCorePDFHandler creates a new core PDF handler
func NewCorePDFHandler(pdfService *services.PDFService, storageService *services.StorageService, userService *services.UserService, mongoClient *mongodb.Client) *CorePDFHandler {
	return &CorePDFHandler{
		pdfService:     pdfService,
		storageService: storageService,
		userService:    userService,
		mongoClient:    mongoClient,
	}
}

// getMaxFileSize returns the max allowed file size for the user based on their plan
func (h *CorePDFHandler) getMaxFileSize(c *gin.Context, userID string) int64 {
	if userID == "" {
		return config.GetMaxFileSizeForPlan("free")
	}
	user, err := h.userService.GetUserByFirebaseUID(c.Request.Context(), userID)
	if err != nil {
		return config.GetMaxFileSizeForPlan("free")
	}
	return config.GetMaxFileSizeForPlan(user.Plan)
}

// MergePDF handles POST /api/pdf/merge
// Accepts multiple PDF files, merges them, stores in MinIO, returns URL + page count
func (h *CorePDFHandler) MergePDF(c *gin.Context) {
	startTime := time.Now()
	userID, _ := middleware.GetUserID(c)

	// Parse multipart form
	form, err := c.MultipartForm()
	if err != nil {
		h.logOperation(userID, "merge", nil, "", "error", "Invalid form data", 0, startTime)
		utils.BadRequest(c, "Invalid form data: "+err.Error())
		return
	}

	files := form.File["files"]
	if len(files) < 2 {
		h.logOperation(userID, "merge", nil, "", "error", "Minimum 2 files required", 0, startTime)
		utils.BadRequest(c, "At least 2 PDF files required for merge")
		return
	}

	// Validate and read all files
	var pdfData [][]byte
	var inputFileNames []string

	for _, fileHeader := range files {
		// Validate file type
		if !strings.HasSuffix(strings.ToLower(fileHeader.Filename), ".pdf") {
			h.logOperation(userID, "merge", inputFileNames, "", "error", "Invalid file type", 0, startTime)
			utils.BadRequest(c, fmt.Sprintf("File '%s' is not a PDF", fileHeader.Filename))
			return
		}

		// Validate file size (max 50MB per file)
		if fileHeader.Size > 50*1024*1024 {
			h.logOperation(userID, "merge", inputFileNames, "", "error", "File too large", 0, startTime)
			utils.BadRequest(c, fmt.Sprintf("File '%s' exceeds 50MB limit", fileHeader.Filename))
			return
		}

		file, err := fileHeader.Open()
		if err != nil {
			h.logOperation(userID, "merge", inputFileNames, "", "error", "Failed to open file", 0, startTime)
			utils.BadRequest(c, fmt.Sprintf("Failed to read file '%s'", fileHeader.Filename))
			return
		}

		data, err := io.ReadAll(file)
		file.Close()
		if err != nil {
			h.logOperation(userID, "merge", inputFileNames, "", "error", "Failed to read file", 0, startTime)
			utils.BadRequest(c, fmt.Sprintf("Failed to read file '%s'", fileHeader.Filename))
			return
		}

		// Validate PDF structure
		if err := h.pdfService.ValidatePDF(data); err != nil {
			h.logOperation(userID, "merge", inputFileNames, "", "error", "Invalid PDF file", 0, startTime)
			utils.BadRequest(c, fmt.Sprintf("File '%s' is not a valid PDF: %s", fileHeader.Filename, err.Error()))
			return
		}

		pdfData = append(pdfData, data)
		inputFileNames = append(inputFileNames, fileHeader.Filename)
	}

	// Merge PDFs using pdfcpu
	result, err := h.pdfService.Merge(c.Request.Context(), pdfData)
	if err != nil {
		h.logOperation(userID, "merge", inputFileNames, "", "error", err.Error(), 0, startTime)
		utils.InternalServerError(c, "Failed to merge PDFs: "+err.Error())
		return
	}

	// Generate output filename
	outputFilename := "merged_" + time.Now().Format("20060102_150405") + ".pdf"

	// Upload merged file to MinIO
	uploadResult, err := h.storageService.UploadProcessedFile(
		c.Request.Context(),
		userID,
		outputFilename,
		result.Data,
		"application/pdf",
	)
	if err != nil {
		h.logOperation(userID, "merge", inputFileNames, "", "error", "Failed to upload result", 0, startTime)
		utils.InternalServerError(c, "Failed to save merged PDF: "+err.Error())
		return
	}

	// Log successful operation
	h.logOperation(userID, "merge", inputFileNames, uploadResult.FileID, "success", "", result.PageCount, startTime)

	// Return response
	utils.Success(c, gin.H{
		"fileId":       uploadResult.FileID,
		"url":          uploadResult.URL,
		"filename":     uploadResult.Filename,
		"pageCount":    result.PageCount,
		"size":         uploadResult.Size,
		"inputFiles":   len(files),
		"processingMs": time.Since(startTime).Milliseconds(),
	})
}

// SplitPDF handles POST /api/pdf/split
// Accepts file + page ranges, splits into multiple PDFs, stores each in MinIO
func (h *CorePDFHandler) SplitPDF(c *gin.Context) {
	startTime := time.Now()
	userID, _ := middleware.GetUserID(c)

	// Get uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		h.logOperation(userID, "split", nil, "", "error", "No file provided", 0, startTime)
		utils.BadRequest(c, "No PDF file provided")
		return
	}
	defer file.Close()

	// Validate file type
	if !strings.HasSuffix(strings.ToLower(header.Filename), ".pdf") {
		h.logOperation(userID, "split", []string{header.Filename}, "", "error", "Invalid file type", 0, startTime)
		utils.BadRequest(c, "File must be a PDF")
		return
	}

	// Validate file size based on plan
	maxSize := h.getMaxFileSize(c, userID)
	if header.Size > maxSize {
		h.logOperation(userID, "split", []string{header.Filename}, "", "error", "File too large", 0, startTime)
		utils.BadRequest(c, fmt.Sprintf("File size exceeds your plan limit of %d MB", maxSize/(1024*1024)))
		return
	}

	// Get page ranges
	pageRanges := c.PostForm("pages")
	if pageRanges == "" {
		h.logOperation(userID, "split", []string{header.Filename}, "", "error", "No page ranges", 0, startTime)
		utils.BadRequest(c, "Page ranges required (e.g., '1-3, 4-7, 8-10')")
		return
	}

	// Validate page range format
	if !isValidPageRanges(pageRanges) {
		h.logOperation(userID, "split", []string{header.Filename}, "", "error", "Invalid page ranges format", 0, startTime)
		utils.BadRequest(c, "Invalid page ranges format. Use format like '1-3, 4-7' or '1, 2, 3-5'")
		return
	}

	// Read file data
	data, err := io.ReadAll(file)
	if err != nil {
		h.logOperation(userID, "split", []string{header.Filename}, "", "error", "Failed to read file", 0, startTime)
		utils.BadRequest(c, "Failed to read file")
		return
	}

	// Validate PDF structure
	if err := h.pdfService.ValidatePDF(data); err != nil {
		h.logOperation(userID, "split", []string{header.Filename}, "", "error", "Invalid PDF", 0, startTime)
		utils.BadRequest(c, "Invalid PDF file: "+err.Error())
		return
	}

	// Get page count for validation
	pageCount, err := h.pdfService.GetPageCount(data)
	if err != nil {
		h.logOperation(userID, "split", []string{header.Filename}, "", "error", "Failed to read PDF", 0, startTime)
		utils.InternalServerError(c, "Failed to read PDF")
		return
	}

	// Validate page ranges against actual page count
	if err := validatePageRangesAgainstCount(pageRanges, pageCount); err != nil {
		h.logOperation(userID, "split", []string{header.Filename}, "", "error", err.Error(), 0, startTime)
		utils.BadRequest(c, err.Error())
		return
	}

	// Split PDF using pdfcpu
	result, err := h.pdfService.Split(c.Request.Context(), data, pageRanges)
	if err != nil {
		h.logOperation(userID, "split", []string{header.Filename}, "", "error", err.Error(), 0, startTime)
		utils.InternalServerError(c, "Failed to split PDF: "+err.Error())
		return
	}

	// Upload each split file to MinIO
	baseName := strings.TrimSuffix(header.Filename, ".pdf")
	ranges := parseRangesForNaming(pageRanges)

	var outputFiles []gin.H
	var outputFileIDs []string

	for i, splitData := range result.Files {
		// Generate filename
		rangeName := fmt.Sprintf("part%d", i+1)
		if i < len(ranges) {
			rangeName = ranges[i]
		}
		outputFilename := fmt.Sprintf("%s_%s.pdf", baseName, rangeName)

		// Get page count of split file
		splitPageCount, _ := h.pdfService.GetPageCount(splitData)

		// Upload to MinIO
		uploadResult, err := h.storageService.UploadProcessedFile(
			c.Request.Context(),
			userID,
			outputFilename,
			splitData,
			"application/pdf",
		)
		if err != nil {
			continue // Skip failed uploads, return partial results
		}

		outputFiles = append(outputFiles, gin.H{
			"fileId":    uploadResult.FileID,
			"url":       uploadResult.URL,
			"filename":  uploadResult.Filename,
			"pageCount": splitPageCount,
			"size":      uploadResult.Size,
			"range":     ranges[i],
		})
		outputFileIDs = append(outputFileIDs, uploadResult.FileID)
	}

	if len(outputFiles) == 0 {
		h.logOperation(userID, "split", []string{header.Filename}, "", "error", "No files created", 0, startTime)
		utils.InternalServerError(c, "Failed to create any split files")
		return
	}

	// Log successful operation
	h.logOperationMultiple(userID, "split", []string{header.Filename}, outputFileIDs, "success", "", pageCount, startTime)

	// Return response
	utils.Success(c, gin.H{
		"success": true,
		"data": gin.H{
			"files":        outputFiles,
			"totalFiles":   len(outputFiles),
			"inputFile":    header.Filename,
			"inputPages":   pageCount,
			"processingMs": time.Since(startTime).Milliseconds(),
		},
	})
}

// RotatePDF handles POST /api/pdf/rotate
// Accepts file + angle (90|180|270), rotates all pages, stores in MinIO
func (h *CorePDFHandler) RotatePDF(c *gin.Context) {
	startTime := time.Now()
	userID, _ := middleware.GetUserID(c)

	// Get uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		h.logOperation(userID, "rotate", nil, "", "error", "No file provided", 0, startTime)
		utils.BadRequest(c, "No PDF file provided")
		return
	}
	defer file.Close()

	// Validate file type
	if !strings.HasSuffix(strings.ToLower(header.Filename), ".pdf") {
		h.logOperation(userID, "rotate", []string{header.Filename}, "", "error", "Invalid file type", 0, startTime)
		utils.BadRequest(c, "File must be a PDF")
		return
	}

	// Validate file size (max 100MB)
	if header.Size > 100*1024*1024 {
		h.logOperation(userID, "rotate", []string{header.Filename}, "", "error", "File too large", 0, startTime)
		utils.BadRequest(c, "File exceeds 100MB limit")
		return
	}

	// Get angle parameter
	angleStr := c.PostForm("angle")
	if angleStr == "" {
		h.logOperation(userID, "rotate", []string{header.Filename}, "", "error", "No angle provided", 0, startTime)
		utils.BadRequest(c, "Rotation angle required (90, 180, or 270)")
		return
	}

	// Validate angle
	var angle int
	if _, err := fmt.Sscanf(angleStr, "%d", &angle); err != nil {
		h.logOperation(userID, "rotate", []string{header.Filename}, "", "error", "Invalid angle format", 0, startTime)
		utils.BadRequest(c, "Invalid angle format")
		return
	}

	if angle != 90 && angle != 180 && angle != 270 {
		h.logOperation(userID, "rotate", []string{header.Filename}, "", "error", "Invalid angle value", 0, startTime)
		utils.BadRequest(c, "Angle must be 90, 180, or 270 degrees")
		return
	}

	// Optional: specific pages to rotate (default: all pages)
	pages := c.DefaultPostForm("pages", "1-")

	// Read file data
	data, err := io.ReadAll(file)
	if err != nil {
		h.logOperation(userID, "rotate", []string{header.Filename}, "", "error", "Failed to read file", 0, startTime)
		utils.BadRequest(c, "Failed to read file")
		return
	}

	// Validate PDF structure
	if err := h.pdfService.ValidatePDF(data); err != nil {
		h.logOperation(userID, "rotate", []string{header.Filename}, "", "error", "Invalid PDF", 0, startTime)
		utils.BadRequest(c, "Invalid PDF file: "+err.Error())
		return
	}

	// Get original page count
	pageCount, _ := h.pdfService.GetPageCount(data)

	// Rotate PDF using pdfcpu
	result, err := h.pdfService.Rotate(c.Request.Context(), data, pages, angle)
	if err != nil {
		h.logOperation(userID, "rotate", []string{header.Filename}, "", "error", err.Error(), 0, startTime)
		utils.InternalServerError(c, "Failed to rotate PDF: "+err.Error())
		return
	}

	// Generate output filename
	baseName := strings.TrimSuffix(header.Filename, ".pdf")
	outputFilename := fmt.Sprintf("%s_rotated_%d.pdf", baseName, angle)

	// Upload rotated file to MinIO
	uploadResult, err := h.storageService.UploadProcessedFile(
		c.Request.Context(),
		userID,
		outputFilename,
		result.Data,
		"application/pdf",
	)
	if err != nil {
		h.logOperation(userID, "rotate", []string{header.Filename}, "", "error", "Failed to upload result", 0, startTime)
		utils.InternalServerError(c, "Failed to save rotated PDF: "+err.Error())
		return
	}

	// Log successful operation
	h.logOperation(userID, "rotate", []string{header.Filename}, uploadResult.FileID, "success", "", pageCount, startTime)

	// Return response
	utils.Success(c, gin.H{
		"success": true,
		"data": gin.H{
			"fileId":       uploadResult.FileID,
			"url":          uploadResult.URL,
			"filename":     uploadResult.Filename,
			"pageCount":    result.PageCount,
			"angle":        angle,
			"size":         uploadResult.Size,
			"processingMs": time.Since(startTime).Milliseconds(),
		},
	})
}

// CompressPDF handles POST /api/pdf/compress
// Accepts file + quality level, compresses using pdfcpu optimize, stores in MinIO
func (h *CorePDFHandler) CompressPDF(c *gin.Context) {
	startTime := time.Now()
	userID, _ := middleware.GetUserID(c)

	// Get uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		h.logOperation(userID, "compress", nil, "", "error", "No file provided", 0, startTime)
		utils.BadRequest(c, "No PDF file provided")
		return
	}
	defer file.Close()

	// Validate file type
	if !strings.HasSuffix(strings.ToLower(header.Filename), ".pdf") {
		h.logOperation(userID, "compress", []string{header.Filename}, "", "error", "Invalid file type", 0, startTime)
		utils.BadRequest(c, "File must be a PDF")
		return
	}

	// Validate file size (max 100MB)
	if header.Size > 100*1024*1024 {
		h.logOperation(userID, "compress", []string{header.Filename}, "", "error", "File too large", 0, startTime)
		utils.BadRequest(c, "File exceeds 100MB limit")
		return
	}

	// Get quality parameter (low, medium, high)
	quality := c.DefaultPostForm("quality", "medium")
	if quality != "low" && quality != "medium" && quality != "high" {
		quality = "medium"
	}

	// Read file data
	data, err := io.ReadAll(file)
	if err != nil {
		h.logOperation(userID, "compress", []string{header.Filename}, "", "error", "Failed to read file", 0, startTime)
		utils.BadRequest(c, "Failed to read file")
		return
	}

	originalSize := int64(len(data))

	// Validate PDF structure
	if err := h.pdfService.ValidatePDF(data); err != nil {
		h.logOperation(userID, "compress", []string{header.Filename}, "", "error", "Invalid PDF", 0, startTime)
		utils.BadRequest(c, "Invalid PDF file: "+err.Error())
		return
	}

	// Get page count
	pageCount, _ := h.pdfService.GetPageCount(data)

	// Compress PDF using pdfcpu OptimizeFile
	result, err := h.pdfService.Compress(c.Request.Context(), data, quality)
	if err != nil {
		h.logOperation(userID, "compress", []string{header.Filename}, "", "error", err.Error(), 0, startTime)
		utils.InternalServerError(c, "Failed to compress PDF: "+err.Error())
		return
	}

	// Generate output filename
	baseName := strings.TrimSuffix(header.Filename, ".pdf")
	outputFilename := fmt.Sprintf("%s_compressed.pdf", baseName)

	// Upload compressed file to MinIO
	uploadResult, err := h.storageService.UploadProcessedFile(
		c.Request.Context(),
		userID,
		outputFilename,
		result.Data,
		"application/pdf",
	)
	if err != nil {
		h.logOperation(userID, "compress", []string{header.Filename}, "", "error", "Failed to upload result", 0, startTime)
		utils.InternalServerError(c, "Failed to save compressed PDF: "+err.Error())
		return
	}

	// Log successful operation
	h.logOperation(userID, "compress", []string{header.Filename}, uploadResult.FileID, "success", "", pageCount, startTime)

	// Calculate compression stats
	compressedSize := result.SizeAfter
	reduction := result.Compression
	if reduction < 0 {
		reduction = 0
	}

	// Return response
	utils.Success(c, gin.H{
		"success": true,
		"data": gin.H{
			"fileId":         uploadResult.FileID,
			"url":            uploadResult.URL,
			"filename":       uploadResult.Filename,
			"pageCount":      pageCount,
			"originalSize":   originalSize,
			"compressedSize": compressedSize,
			"reduction":      fmt.Sprintf("%.1f%%", reduction),
			"quality":        quality,
			"processingMs":   time.Since(startTime).Milliseconds(),
		},
	})
}

// CropPDF handles POST /api/pdf/crop
// Accepts file + crop margins (top, right, bottom, left), crops all pages
func (h *CorePDFHandler) CropPDF(c *gin.Context) {
	startTime := time.Now()
	userID, _ := middleware.GetUserID(c)

	// Get uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		h.logOperation(userID, "crop", nil, "", "error", "No file provided", 0, startTime)
		utils.BadRequest(c, "No PDF file provided")
		return
	}
	defer file.Close()

	// Validate file type
	if !strings.HasSuffix(strings.ToLower(header.Filename), ".pdf") {
		h.logOperation(userID, "crop", []string{header.Filename}, "", "error", "Invalid file type", 0, startTime)
		utils.BadRequest(c, "File must be a PDF")
		return
	}

	// Get crop margins
	var top, right, bottom, left float64
	fmt.Sscanf(c.DefaultPostForm("top", "0"), "%f", &top)
	fmt.Sscanf(c.DefaultPostForm("right", "0"), "%f", &right)
	fmt.Sscanf(c.DefaultPostForm("bottom", "0"), "%f", &bottom)
	fmt.Sscanf(c.DefaultPostForm("left", "0"), "%f", &left)

	// Validate crop values
	if top < 0 || right < 0 || bottom < 0 || left < 0 {
		h.logOperation(userID, "crop", []string{header.Filename}, "", "error", "Invalid crop values", 0, startTime)
		utils.BadRequest(c, "Crop values must be non-negative")
		return
	}

	// Read file data
	data, err := io.ReadAll(file)
	if err != nil {
		h.logOperation(userID, "crop", []string{header.Filename}, "", "error", "Failed to read file", 0, startTime)
		utils.BadRequest(c, "Failed to read file")
		return
	}

	// Validate PDF structure
	if err := h.pdfService.ValidatePDF(data); err != nil {
		h.logOperation(userID, "crop", []string{header.Filename}, "", "error", "Invalid PDF", 0, startTime)
		utils.BadRequest(c, "Invalid PDF file: "+err.Error())
		return
	}

	pageCount, _ := h.pdfService.GetPageCount(data)

	// Crop PDF using pdfcpu
	result, err := h.pdfService.Crop(c.Request.Context(), data, services.CropOptions{
		Top:    top,
		Right:  right,
		Bottom: bottom,
		Left:   left,
	})
	if err != nil {
		h.logOperation(userID, "crop", []string{header.Filename}, "", "error", err.Error(), 0, startTime)
		utils.InternalServerError(c, "Failed to crop PDF: "+err.Error())
		return
	}

	// Generate output filename
	baseName := strings.TrimSuffix(header.Filename, ".pdf")
	outputFilename := fmt.Sprintf("%s_cropped.pdf", baseName)

	// Upload cropped file to MinIO
	uploadResult, err := h.storageService.UploadProcessedFile(
		c.Request.Context(),
		userID,
		outputFilename,
		result,
		"application/pdf",
	)
	if err != nil {
		h.logOperation(userID, "crop", []string{header.Filename}, "", "error", "Failed to upload result", 0, startTime)
		utils.InternalServerError(c, "Failed to save cropped PDF: "+err.Error())
		return
	}

	h.logOperation(userID, "crop", []string{header.Filename}, uploadResult.FileID, "success", "", pageCount, startTime)

	utils.Success(c, gin.H{
		"success": true,
		"data": gin.H{
			"fileId":       uploadResult.FileID,
			"url":          uploadResult.URL,
			"filename":     uploadResult.Filename,
			"pageCount":    pageCount,
			"margins":      gin.H{"top": top, "right": right, "bottom": bottom, "left": left},
			"size":         uploadResult.Size,
			"processingMs": time.Since(startTime).Milliseconds(),
		},
	})
}

// WatermarkPDF handles POST /api/pdf/watermark
// Accepts file + text + opacity + position, adds text watermark to all pages
func (h *CorePDFHandler) WatermarkPDF(c *gin.Context) {
	startTime := time.Now()
	userID, _ := middleware.GetUserID(c)

	// Get uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		h.logOperation(userID, "watermark", nil, "", "error", "No file provided", 0, startTime)
		utils.BadRequest(c, "No PDF file provided")
		return
	}
	defer file.Close()

	// Validate file type
	if !strings.HasSuffix(strings.ToLower(header.Filename), ".pdf") {
		h.logOperation(userID, "watermark", []string{header.Filename}, "", "error", "Invalid file type", 0, startTime)
		utils.BadRequest(c, "File must be a PDF")
		return
	}

	// Get watermark parameters
	text := c.PostForm("text")
	if text == "" {
		h.logOperation(userID, "watermark", []string{header.Filename}, "", "error", "No text provided", 0, startTime)
		utils.BadRequest(c, "Watermark text is required")
		return
	}

	position := c.DefaultPostForm("position", "center")
	var opacity float64 = 0.3
	fmt.Sscanf(c.DefaultPostForm("opacity", "0.3"), "%f", &opacity)

	// Validate opacity
	if opacity < 0.1 || opacity > 1.0 {
		opacity = 0.3
	}

	var fontSize int = 48
	fmt.Sscanf(c.DefaultPostForm("fontSize", "48"), "%d", &fontSize)

	// Read file data
	data, err := io.ReadAll(file)
	if err != nil {
		h.logOperation(userID, "watermark", []string{header.Filename}, "", "error", "Failed to read file", 0, startTime)
		utils.BadRequest(c, "Failed to read file")
		return
	}

	// Validate PDF structure
	if err := h.pdfService.ValidatePDF(data); err != nil {
		h.logOperation(userID, "watermark", []string{header.Filename}, "", "error", "Invalid PDF", 0, startTime)
		utils.BadRequest(c, "Invalid PDF file: "+err.Error())
		return
	}

	pageCount, _ := h.pdfService.GetPageCount(data)

	// Add watermark using pdfcpu
	result, err := h.pdfService.AddWatermark(c.Request.Context(), data, services.WatermarkOptions{
		Text:     text,
		Position: position,
		Opacity:  opacity,
		FontSize: float64(fontSize),
	})
	if err != nil {
		h.logOperation(userID, "watermark", []string{header.Filename}, "", "error", err.Error(), 0, startTime)
		utils.InternalServerError(c, "Failed to add watermark: "+err.Error())
		return
	}

	// Generate output filename
	baseName := strings.TrimSuffix(header.Filename, ".pdf")
	outputFilename := fmt.Sprintf("%s_watermarked.pdf", baseName)

	// Upload watermarked file to MinIO
	uploadResult, err := h.storageService.UploadProcessedFile(
		c.Request.Context(),
		userID,
		outputFilename,
		result,
		"application/pdf",
	)
	if err != nil {
		h.logOperation(userID, "watermark", []string{header.Filename}, "", "error", "Failed to upload result", 0, startTime)
		utils.InternalServerError(c, "Failed to save watermarked PDF: "+err.Error())
		return
	}

	h.logOperation(userID, "watermark", []string{header.Filename}, uploadResult.FileID, "success", "", pageCount, startTime)

	utils.Success(c, gin.H{
		"success": true,
		"data": gin.H{
			"fileId":       uploadResult.FileID,
			"url":          uploadResult.URL,
			"filename":     uploadResult.Filename,
			"pageCount":    pageCount,
			"watermark":    gin.H{"text": text, "position": position, "opacity": opacity},
			"size":         uploadResult.Size,
			"processingMs": time.Since(startTime).Milliseconds(),
		},
	})
}

// PageNumbersPDF handles POST /api/pdf/page-numbers
// Accepts file + position + format + startFrom, adds page numbers to all pages
func (h *CorePDFHandler) PageNumbersPDF(c *gin.Context) {
	startTime := time.Now()
	userID, _ := middleware.GetUserID(c)

	// Get uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		h.logOperation(userID, "page-numbers", nil, "", "error", "No file provided", 0, startTime)
		utils.BadRequest(c, "No PDF file provided")
		return
	}
	defer file.Close()

	// Validate file type
	if !strings.HasSuffix(strings.ToLower(header.Filename), ".pdf") {
		h.logOperation(userID, "page-numbers", []string{header.Filename}, "", "error", "Invalid file type", 0, startTime)
		utils.BadRequest(c, "File must be a PDF")
		return
	}

	// Get page number parameters
	position := c.DefaultPostForm("position", "bottom-center")
	format := c.DefaultPostForm("format", "{n}")
	var startFrom int = 1
	fmt.Sscanf(c.DefaultPostForm("startFrom", "1"), "%d", &startFrom)

	// Validate position
	validPositions := map[string]bool{
		"bottom-center": true, "bottom-right": true, "bottom-left": true,
		"top-center": true, "top-right": true, "top-left": true,
	}
	if !validPositions[position] {
		position = "bottom-center"
	}

	// Read file data
	data, err := io.ReadAll(file)
	if err != nil {
		h.logOperation(userID, "page-numbers", []string{header.Filename}, "", "error", "Failed to read file", 0, startTime)
		utils.BadRequest(c, "Failed to read file")
		return
	}

	// Validate PDF structure
	if err := h.pdfService.ValidatePDF(data); err != nil {
		h.logOperation(userID, "page-numbers", []string{header.Filename}, "", "error", "Invalid PDF", 0, startTime)
		utils.BadRequest(c, "Invalid PDF file: "+err.Error())
		return
	}

	pageCount, _ := h.pdfService.GetPageCount(data)

	// Add page numbers using pdfcpu
	result, err := h.pdfService.AddPageNumbers(c.Request.Context(), data, services.PageNumberOptions{
		Position:  position,
		Format:    format,
		StartFrom: startFrom,
	})
	if err != nil {
		h.logOperation(userID, "page-numbers", []string{header.Filename}, "", "error", err.Error(), 0, startTime)
		utils.InternalServerError(c, "Failed to add page numbers: "+err.Error())
		return
	}

	// Generate output filename
	baseName := strings.TrimSuffix(header.Filename, ".pdf")
	outputFilename := fmt.Sprintf("%s_numbered.pdf", baseName)

	// Upload numbered file to MinIO
	uploadResult, err := h.storageService.UploadProcessedFile(
		c.Request.Context(),
		userID,
		outputFilename,
		result,
		"application/pdf",
	)
	if err != nil {
		h.logOperation(userID, "page-numbers", []string{header.Filename}, "", "error", "Failed to upload result", 0, startTime)
		utils.InternalServerError(c, "Failed to save numbered PDF: "+err.Error())
		return
	}

	h.logOperation(userID, "page-numbers", []string{header.Filename}, uploadResult.FileID, "success", "", pageCount, startTime)

	utils.Success(c, gin.H{
		"success": true,
		"data": gin.H{
			"fileId":       uploadResult.FileID,
			"url":          uploadResult.URL,
			"filename":     uploadResult.Filename,
			"pageCount":    pageCount,
			"settings":     gin.H{"position": position, "format": format, "startFrom": startFrom},
			"size":         uploadResult.Size,
			"processingMs": time.Since(startTime).Milliseconds(),
		},
	})
}

// logOperation logs a PDF operation to MongoDB
func (h *CorePDFHandler) logOperation(userID, operation string, inputFiles []string, outputFileID, status, errorMsg string, pageCount int, startTime time.Time) {
	if h.mongoClient == nil {
		return
	}

	log := OperationLog{
		UserID:       userID,
		Operation:    operation,
		InputFiles:   inputFiles,
		OutputFileID: outputFileID,
		PageCount:    pageCount,
		Status:       status,
		ErrorMessage: errorMsg,
		ProcessingMs: time.Since(startTime).Milliseconds(),
		CreatedAt:    time.Now(),
	}

	h.mongoClient.Collection("operation_logs").InsertOne(nil, log)
}

// logOperationMultiple logs operation with multiple outputs
func (h *CorePDFHandler) logOperationMultiple(userID, operation string, inputFiles, outputFileIDs []string, status, errorMsg string, pageCount int, startTime time.Time) {
	if h.mongoClient == nil {
		return
	}

	log := bson.M{
		"userId":       userID,
		"operation":    operation,
		"inputFiles":   inputFiles,
		"outputFiles":  outputFileIDs,
		"pageCount":    pageCount,
		"status":       status,
		"errorMessage": errorMsg,
		"processingMs": time.Since(startTime).Milliseconds(),
		"createdAt":    time.Now(),
	}

	h.mongoClient.Collection("operation_logs").InsertOne(nil, log)
}

// ReorderPages handles POST /api/pdf/reorder
// Accepts file + newPageOrder array, reorders pages using pdfcpu
func (h *CorePDFHandler) ReorderPages(c *gin.Context) {
	startTime := time.Now()
	userID, _ := middleware.GetUserID(c)

	// Get uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		h.logOperation(userID, "reorder", nil, "", "error", "No file provided", 0, startTime)
		utils.BadRequest(c, "No PDF file provided")
		return
	}
	defer file.Close()

	// Validate file type
	if !strings.HasSuffix(strings.ToLower(header.Filename), ".pdf") {
		h.logOperation(userID, "reorder", []string{header.Filename}, "", "error", "Invalid file type", 0, startTime)
		utils.BadRequest(c, "File must be a PDF")
		return
	}

	// Get page order (comma-separated like "3,1,2,4")
	orderStr := c.PostForm("order")
	if orderStr == "" {
		h.logOperation(userID, "reorder", []string{header.Filename}, "", "error", "No order provided", 0, startTime)
		utils.BadRequest(c, "Page order is required (e.g., '3,1,2,4')")
		return
	}

	// Parse order
	orderParts := strings.Split(orderStr, ",")
	var newOrder []int
	for _, part := range orderParts {
		part = strings.TrimSpace(part)
		var pageNum int
		if _, err := fmt.Sscanf(part, "%d", &pageNum); err != nil {
			h.logOperation(userID, "reorder", []string{header.Filename}, "", "error", "Invalid page number", 0, startTime)
			utils.BadRequest(c, fmt.Sprintf("Invalid page number: %s", part))
			return
		}
		if pageNum < 1 {
			h.logOperation(userID, "reorder", []string{header.Filename}, "", "error", "Page number must be positive", 0, startTime)
			utils.BadRequest(c, "Page numbers must be positive")
			return
		}
		newOrder = append(newOrder, pageNum)
	}

	// Read file data
	data, err := io.ReadAll(file)
	if err != nil {
		h.logOperation(userID, "reorder", []string{header.Filename}, "", "error", "Failed to read file", 0, startTime)
		utils.BadRequest(c, "Failed to read file")
		return
	}

	// Validate PDF structure
	if err := h.pdfService.ValidatePDF(data); err != nil {
		h.logOperation(userID, "reorder", []string{header.Filename}, "", "error", "Invalid PDF", 0, startTime)
		utils.BadRequest(c, "Invalid PDF file: "+err.Error())
		return
	}

	// Validate page numbers against actual page count
	pageCount, _ := h.pdfService.GetPageCount(data)
	for _, p := range newOrder {
		if p > pageCount {
			h.logOperation(userID, "reorder", []string{header.Filename}, "", "error", "Page out of range", 0, startTime)
			utils.BadRequest(c, fmt.Sprintf("Page %d is out of range (document has %d pages)", p, pageCount))
			return
		}
	}

	// Reorder pages using pdfcpu OrganizePages
	result, err := h.pdfService.OrganizePages(c.Request.Context(), data, newOrder)
	if err != nil {
		h.logOperation(userID, "reorder", []string{header.Filename}, "", "error", err.Error(), 0, startTime)
		utils.InternalServerError(c, "Failed to reorder pages: "+err.Error())
		return
	}

	// Generate output filename
	baseName := strings.TrimSuffix(header.Filename, ".pdf")
	outputFilename := fmt.Sprintf("%s_reordered.pdf", baseName)

	// Upload to MinIO
	uploadResult, err := h.storageService.UploadProcessedFile(
		c.Request.Context(),
		userID,
		outputFilename,
		result,
		"application/pdf",
	)
	if err != nil {
		h.logOperation(userID, "reorder", []string{header.Filename}, "", "error", "Failed to upload result", 0, startTime)
		utils.InternalServerError(c, "Failed to save reordered PDF: "+err.Error())
		return
	}

	newPageCount, _ := h.pdfService.GetPageCount(result)
	h.logOperation(userID, "reorder", []string{header.Filename}, uploadResult.FileID, "success", "", newPageCount, startTime)

	utils.Success(c, gin.H{
		"success": true,
		"data": gin.H{
			"fileId":        uploadResult.FileID,
			"url":           uploadResult.URL,
			"filename":      uploadResult.Filename,
			"pageCount":     newPageCount,
			"originalPages": pageCount,
			"newOrder":      newOrder,
			"size":          uploadResult.Size,
			"processingMs":  time.Since(startTime).Milliseconds(),
		},
	})
}

// RemovePages handles POST /api/pdf/remove
// Accepts file + pages to remove, deletes specified pages using pdfcpu
func (h *CorePDFHandler) RemovePages(c *gin.Context) {
	startTime := time.Now()
	userID, _ := middleware.GetUserID(c)

	// Get uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		h.logOperation(userID, "remove", nil, "", "error", "No file provided", 0, startTime)
		utils.BadRequest(c, "No PDF file provided")
		return
	}
	defer file.Close()

	// Validate file type
	if !strings.HasSuffix(strings.ToLower(header.Filename), ".pdf") {
		h.logOperation(userID, "remove", []string{header.Filename}, "", "error", "Invalid file type", 0, startTime)
		utils.BadRequest(c, "File must be a PDF")
		return
	}

	// Get pages to remove
	pagesStr := c.PostForm("pages")
	if pagesStr == "" {
		h.logOperation(userID, "remove", []string{header.Filename}, "", "error", "No pages specified", 0, startTime)
		utils.BadRequest(c, "Pages to remove are required (e.g., '2,5,7' or '2-5')")
		return
	}

	// Read file data
	data, err := io.ReadAll(file)
	if err != nil {
		h.logOperation(userID, "remove", []string{header.Filename}, "", "error", "Failed to read file", 0, startTime)
		utils.BadRequest(c, "Failed to read file")
		return
	}

	// Validate PDF structure
	if err := h.pdfService.ValidatePDF(data); err != nil {
		h.logOperation(userID, "remove", []string{header.Filename}, "", "error", "Invalid PDF", 0, startTime)
		utils.BadRequest(c, "Invalid PDF file: "+err.Error())
		return
	}

	// Get original page count
	originalPageCount, _ := h.pdfService.GetPageCount(data)

	// Validate page ranges
	if err := validatePageRangesAgainstCount(pagesStr, originalPageCount); err != nil {
		h.logOperation(userID, "remove", []string{header.Filename}, "", "error", err.Error(), 0, startTime)
		utils.BadRequest(c, err.Error())
		return
	}

	// Remove pages using pdfcpu
	result, err := h.pdfService.RemovePages(c.Request.Context(), data, pagesStr)
	if err != nil {
		h.logOperation(userID, "remove", []string{header.Filename}, "", "error", err.Error(), 0, startTime)
		utils.InternalServerError(c, "Failed to remove pages: "+err.Error())
		return
	}

	// Generate output filename
	baseName := strings.TrimSuffix(header.Filename, ".pdf")
	outputFilename := fmt.Sprintf("%s_pages_removed.pdf", baseName)

	// Upload to MinIO
	uploadResult, err := h.storageService.UploadProcessedFile(
		c.Request.Context(),
		userID,
		outputFilename,
		result,
		"application/pdf",
	)
	if err != nil {
		h.logOperation(userID, "remove", []string{header.Filename}, "", "error", "Failed to upload result", 0, startTime)
		utils.InternalServerError(c, "Failed to save PDF: "+err.Error())
		return
	}

	newPageCount, _ := h.pdfService.GetPageCount(result)
	pagesRemoved := originalPageCount - newPageCount

	h.logOperation(userID, "remove", []string{header.Filename}, uploadResult.FileID, "success", "", newPageCount, startTime)

	utils.Success(c, gin.H{
		"success": true,
		"data": gin.H{
			"fileId":        uploadResult.FileID,
			"url":           uploadResult.URL,
			"filename":      uploadResult.Filename,
			"pageCount":     newPageCount,
			"originalPages": originalPageCount,
			"pagesRemoved":  pagesRemoved,
			"removedPages":  pagesStr,
			"size":          uploadResult.Size,
			"processingMs":  time.Since(startTime).Milliseconds(),
		},
	})
}

// GetPDFInfo handles POST /api/pdf/info
// Returns page count and basic info about a PDF
func (h *CorePDFHandler) GetPDFInfo(c *gin.Context) {
	// Get uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		utils.BadRequest(c, "No PDF file provided")
		return
	}
	defer file.Close()

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

	// Get info
	pageCount, _ := h.pdfService.GetPageCount(data)
	info, _ := h.pdfService.GetInfo(data)

	utils.Success(c, gin.H{
		"filename":  header.Filename,
		"pageCount": pageCount,
		"size":      len(data),
		"version":   info["version"],
	})
}

// ExtractPages handles POST /api/pdf/extract
// Accepts file + pages to extract, creates new PDF with only those pages
func (h *CorePDFHandler) ExtractPages(c *gin.Context) {
	startTime := time.Now()
	userID, _ := middleware.GetUserID(c)

	// Get uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		h.logOperation(userID, "extract", nil, "", "error", "No file provided", 0, startTime)
		utils.BadRequest(c, "No PDF file provided")
		return
	}
	defer file.Close()

	// Validate file type
	if !strings.HasSuffix(strings.ToLower(header.Filename), ".pdf") {
		h.logOperation(userID, "extract", []string{header.Filename}, "", "error", "Invalid file type", 0, startTime)
		utils.BadRequest(c, "File must be a PDF")
		return
	}

	// Get pages to extract
	pagesStr := c.PostForm("pages")
	if pagesStr == "" {
		h.logOperation(userID, "extract", []string{header.Filename}, "", "error", "No pages specified", 0, startTime)
		utils.BadRequest(c, "Pages to extract are required (e.g., '1,3,5-7')")
		return
	}

	// Read file data
	data, err := io.ReadAll(file)
	if err != nil {
		h.logOperation(userID, "extract", []string{header.Filename}, "", "error", "Failed to read file", 0, startTime)
		utils.BadRequest(c, "Failed to read file")
		return
	}

	// Validate PDF structure
	if err := h.pdfService.ValidatePDF(data); err != nil {
		h.logOperation(userID, "extract", []string{header.Filename}, "", "error", "Invalid PDF", 0, startTime)
		utils.BadRequest(c, "Invalid PDF file: "+err.Error())
		return
	}

	// Get original page count
	originalPageCount, _ := h.pdfService.GetPageCount(data)

	// Validate page ranges
	if err := validatePageRangesAgainstCount(pagesStr, originalPageCount); err != nil {
		h.logOperation(userID, "extract", []string{header.Filename}, "", "error", err.Error(), 0, startTime)
		utils.BadRequest(c, err.Error())
		return
	}

	// Extract pages using pdfcpu
	result, err := h.pdfService.ExtractPages(c.Request.Context(), data, pagesStr)
	if err != nil {
		h.logOperation(userID, "extract", []string{header.Filename}, "", "error", err.Error(), 0, startTime)
		utils.InternalServerError(c, "Failed to extract pages: "+err.Error())
		return
	}

	// Generate output filename
	baseName := strings.TrimSuffix(header.Filename, ".pdf")
	// Clean up pages string for filename
	pagesForFilename := strings.ReplaceAll(pagesStr, ",", "_")
	pagesForFilename = strings.ReplaceAll(pagesForFilename, "-", "to")
	outputFilename := fmt.Sprintf("%s_pages_%s.pdf", baseName, pagesForFilename)

	// Upload to MinIO
	uploadResult, err := h.storageService.UploadProcessedFile(
		c.Request.Context(),
		userID,
		outputFilename,
		result,
		"application/pdf",
	)
	if err != nil {
		h.logOperation(userID, "extract", []string{header.Filename}, "", "error", "Failed to upload result", 0, startTime)
		utils.InternalServerError(c, "Failed to save extracted PDF: "+err.Error())
		return
	}

	newPageCount, _ := h.pdfService.GetPageCount(result)
	h.logOperation(userID, "extract", []string{header.Filename}, uploadResult.FileID, "success", "", newPageCount, startTime)

	utils.Success(c, gin.H{
		"success": true,
		"data": gin.H{
			"fileId":          uploadResult.FileID,
			"url":             uploadResult.URL,
			"filename":        uploadResult.Filename,
			"pageCount":       newPageCount,
			"originalPages":   originalPageCount,
			"extractedPages":  pagesStr,
			"size":            uploadResult.Size,
			"processingMs":    time.Since(startTime).Milliseconds(),
		},
	})
}

// DrawTextPDF handles POST /api/pdf/draw-text
// Adds custom text at specific coordinates
func (h *CorePDFHandler) DrawTextPDF(c *gin.Context) {
	startTime := time.Now()
	userID, _ := middleware.GetUserID(c)

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		h.logOperation(userID, "draw-text", nil, "", "error", "No file provided", 0, startTime)
		utils.BadRequest(c, "No PDF file provided")
		return
	}
	defer file.Close()

	// Get parameters
	text := c.PostForm("text")
	if text == "" {
		utils.BadRequest(c, "Text is required")
		return
	}

	var x, y, fontSize float64
	fmt.Sscanf(c.DefaultPostForm("x", "0"), "%f", &x)
	fmt.Sscanf(c.DefaultPostForm("y", "0"), "%f", &y)
	fmt.Sscanf(c.DefaultPostForm("fontSize", "24"), "%f", &fontSize)
	color := c.DefaultPostForm("color", "#000000")

	data, err := io.ReadAll(file)
	if err != nil {
		utils.BadRequest(c, "Failed to read file")
		return
	}

	result, err := h.pdfService.DrawTextOnPDF(c.Request.Context(), data, services.DrawTextOptions{
		Text:     text,
		X:        x,
		Y:        y,
		FontSize: fontSize,
		Color:    color,
	})
	if err != nil {
		h.logOperation(userID, "draw-text", []string{header.Filename}, "", "error", err.Error(), 0, startTime)
		utils.InternalServerError(c, "Failed to draw text: "+err.Error())
		return
	}

	outputFilename := "custom_" + header.Filename
	uploadResult, err := h.storageService.UploadProcessedFile(c.Request.Context(), userID, outputFilename, result, "application/pdf")
	if err != nil {
		utils.InternalServerError(c, "Failed to save file")
		return
	}

	h.logOperation(userID, "draw-text", []string{header.Filename}, uploadResult.FileID, "success", "", 0, startTime)

	utils.Success(c, gin.H{
		"fileId": uploadResult.FileID,
		"url":    uploadResult.URL,
	})
}

// AddBadgePDF handles POST /api/pdf/add-badge
func (h *CorePDFHandler) AddBadgePDF(c *gin.Context) {
	startTime := time.Now()
	userID, _ := middleware.GetUserID(c)

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		h.logOperation(userID, "add-badge", nil, "", "error", "No file provided", 0, startTime)
		utils.BadRequest(c, "No PDF file provided")
		return
	}
	defer file.Close()

	badgeType := c.DefaultPostForm("type", "gold")
	var x, y, scale float64
	fmt.Sscanf(c.DefaultPostForm("x", "0"), "%f", &x)
	fmt.Sscanf(c.DefaultPostForm("y", "0"), "%f", &y)
	fmt.Sscanf(c.DefaultPostForm("scale", "1.0"), "%f", &scale)

	data, err := io.ReadAll(file)
	if err != nil {
		utils.BadRequest(c, "Failed to read file")
		return
	}

	result, err := h.pdfService.AddBadgeOnPDF(c.Request.Context(), data, services.BadgeOptions{
		Type:  badgeType,
		X:     x,
		Y:     y,
		Scale: scale,
	})
	if err != nil {
		h.logOperation(userID, "add-badge", []string{header.Filename}, "", "error", err.Error(), 0, startTime)
		utils.InternalServerError(c, "Failed to add badge: "+err.Error())
		return
	}

	outputFilename := "badged_" + header.Filename
	uploadResult, err := h.storageService.UploadProcessedFile(c.Request.Context(), userID, outputFilename, result, "application/pdf")
	if err != nil {
		utils.InternalServerError(c, "Failed to save file")
		return
	}

	h.logOperation(userID, "add-badge", []string{header.Filename}, uploadResult.FileID, "success", "", 0, startTime)

	utils.Success(c, gin.H{
		"fileId": uploadResult.FileID,
		"url":    uploadResult.URL,
	})
}

// RegisterRoutes registers core PDF routes
func (h *CorePDFHandler) RegisterRoutes(r *gin.RouterGroup) {
	pdf := r.Group("/pdf")
	{
		// Phase 3: Core tools
		pdf.POST("/merge", h.MergePDF)
		pdf.POST("/split", h.SplitPDF)
		// Phase 4: Rotate & Compress
		pdf.POST("/rotate", h.RotatePDF)
		pdf.POST("/compress", h.CompressPDF)
		// Phase 5: Advanced tools
		pdf.POST("/crop", h.CropPDF)
		pdf.POST("/watermark", h.WatermarkPDF)
		pdf.POST("/page-numbers", h.PageNumbersPDF)
		// Phase 6: Organize tools
		pdf.POST("/reorder", h.ReorderPages)
		pdf.POST("/remove", h.RemovePages)
		pdf.POST("/info", h.GetPDFInfo)
		// Phase 7: Extract pages
		pdf.POST("/extract", h.ExtractPages)
		
		// Phase 8: Manual Tools (Premium)
		pdf.POST("/draw-text", h.DrawTextPDF)
		pdf.POST("/add-badge", h.AddBadgePDF)
	}
}

// Helper functions

func isValidPageRanges(ranges string) bool {
	parts := strings.Split(ranges, ",")
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		// Check if it's a range (e.g., "1-5") or single page (e.g., "3")
		if strings.Contains(part, "-") {
			rangeParts := strings.Split(part, "-")
			if len(rangeParts) != 2 {
				return false
			}
			// Validate both parts are numbers
			for _, rp := range rangeParts {
				if _, err := parseInt(strings.TrimSpace(rp)); err != nil {
					return false
				}
			}
		} else {
			// Single page
			if _, err := parseInt(part); err != nil {
				return false
			}
		}
	}
	return true
}

func validatePageRangesAgainstCount(ranges string, pageCount int) error {
	parts := strings.Split(ranges, ",")
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}

		if strings.Contains(part, "-") {
			rangeParts := strings.Split(part, "-")
			start, _ := parseInt(strings.TrimSpace(rangeParts[0]))
			end, _ := parseInt(strings.TrimSpace(rangeParts[1]))

			if start < 1 || start > pageCount {
				return fmt.Errorf("page %d is out of range (document has %d pages)", start, pageCount)
			}
			if end < 1 || end > pageCount {
				return fmt.Errorf("page %d is out of range (document has %d pages)", end, pageCount)
			}
			if start > end {
				return fmt.Errorf("invalid range %d-%d: start must be less than or equal to end", start, end)
			}
		} else {
			page, _ := parseInt(part)
			if page < 1 || page > pageCount {
				return fmt.Errorf("page %d is out of range (document has %d pages)", page, pageCount)
			}
		}
	}
	return nil
}

func parseRangesForNaming(ranges string) []string {
	var result []string
	parts := strings.Split(ranges, ",")
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			// Replace "-" with "to" for filenames
			part = strings.ReplaceAll(part, "-", "to")
			result = append(result, "pages_"+part)
		}
	}
	return result
}

func parseInt(s string) (int, error) {
	var n int
	_, err := fmt.Sscanf(s, "%d", &n)
	return n, err
}
