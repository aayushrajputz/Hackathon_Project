package handlers

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"brainy-pdf/internal/services"
	"brainy-pdf/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ConversionHandler handles document conversion endpoints
type ConversionHandler struct {
	conversionService *services.ConversionService
	maxFileSize       int64  // in bytes
	tempDir           string
}

// NewConversionHandler creates a new conversion handler
func NewConversionHandler(conversionService *services.ConversionService) *ConversionHandler {
	tempDir := filepath.Join(os.TempDir(), "brainy-pdf-convert", "uploads")
	os.MkdirAll(tempDir, 0755)

	return &ConversionHandler{
		conversionService: conversionService,
		maxFileSize:       50 * 1024 * 1024, // 50MB per file
		tempDir:           tempDir,
	}
}

// allowedInputTypes lists valid input MIME types and extensions
var allowedInputTypes = map[string]string{
	".doc":  "application/msword",
	".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	".odt":  "application/vnd.oasis.opendocument.text",
	".ppt":  "application/vnd.ms-powerpoint",
	".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
	".xls":  "application/vnd.ms-excel",
	".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	".pdf":  "application/pdf",
}

// Convert handles POST /api/v1/convert
// Accepts multiple files and output format, returns jobId
func (h *ConversionHandler) Convert(c *gin.Context) {
	outputFormat := c.DefaultPostForm("outputFormat", "pdf")
	outputFormat = strings.ToLower(strings.TrimSpace(outputFormat))

	// Validate output format
	validOutputs := []string{"pdf", "docx", "odt"}
	isValidOutput := false
	for _, v := range validOutputs {
		if v == outputFormat {
			isValidOutput = true
			break
		}
	}
	if !isValidOutput {
		utils.BadRequest(c, "Invalid output format. Allowed: pdf, docx, odt")
		return
	}

	// Parse multipart form
	form, err := c.MultipartForm()
	if err != nil {
		utils.BadRequest(c, "Invalid form data")
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		// Try single file field
		file, header, err := c.Request.FormFile("file")
		if err != nil {
			utils.BadRequest(c, "No files provided")
			return
		}
		defer file.Close()

		// Process single file
		tempPath, originalName, err := h.saveUploadedFile(file, header.Filename, header.Size, outputFormat)
		if err != nil {
			utils.BadRequest(c, err.Error())
			return
		}

		jobID, err := h.conversionService.SubmitJob([]string{tempPath}, []string{originalName}, outputFormat)
		if err != nil {
			os.Remove(tempPath)
			utils.InternalServerError(c, "Failed to queue job: "+err.Error())
			return
		}

		utils.Success(c, gin.H{
			"jobId":     jobID,
			"fileCount": 1,
			"status":    "queued",
		})
		return
	}

	// Validate all files first
	var tempPaths []string
	var originalNames []string

	for _, fileHeader := range files {
		if fileHeader.Size > h.maxFileSize {
			h.cleanupFiles(tempPaths)
			utils.BadRequest(c, fmt.Sprintf("File %s exceeds max size of 50MB", fileHeader.Filename))
			return
		}

		file, err := fileHeader.Open()
		if err != nil {
			h.cleanupFiles(tempPaths)
			utils.BadRequest(c, "Failed to read file: "+fileHeader.Filename)
			return
		}

		tempPath, originalName, err := h.saveUploadedFile(file, fileHeader.Filename, fileHeader.Size, outputFormat)
		file.Close()

		if err != nil {
			h.cleanupFiles(tempPaths)
			utils.BadRequest(c, err.Error())
			return
		}

		tempPaths = append(tempPaths, tempPath)
		originalNames = append(originalNames, originalName)
	}

	// Submit job
	jobID, err := h.conversionService.SubmitJob(tempPaths, originalNames, outputFormat)
	if err != nil {
		h.cleanupFiles(tempPaths)
		utils.InternalServerError(c, "Failed to queue job: "+err.Error())
		return
	}

	utils.Success(c, gin.H{
		"jobId":     jobID,
		"fileCount": len(tempPaths),
		"status":    "queued",
	})
}

// saveUploadedFile validates and saves an uploaded file
func (h *ConversionHandler) saveUploadedFile(file io.Reader, filename string, size int64, outputFormat string) (string, string, error) {
	// Get extension
	ext := strings.ToLower(filepath.Ext(filename))
	if ext == "" {
		return "", "", fmt.Errorf("file %s has no extension", filename)
	}

	// Validate extension
	if _, ok := allowedInputTypes[ext]; !ok {
		return "", "", fmt.Errorf("file type %s not supported", ext)
	}

	// Validate conversion is possible
	if !services.IsValidConversion(ext, outputFormat) {
		validOutputs := services.GetOutputFormats(ext)
		return "", "", fmt.Errorf("cannot convert %s to %s. Valid outputs: %v", ext, outputFormat, validOutputs)
	}

	// Generate unique filename
	uniqueName := uuid.New().String() + ext
	tempPath := filepath.Join(h.tempDir, uniqueName)

	// Create file
	outFile, err := os.Create(tempPath)
	if err != nil {
		return "", "", fmt.Errorf("failed to create temp file")
	}
	defer outFile.Close()

	// Copy content
	written, err := io.Copy(outFile, file)
	if err != nil {
		os.Remove(tempPath)
		return "", "", fmt.Errorf("failed to save file")
	}

	if written == 0 {
		os.Remove(tempPath)
		return "", "", fmt.Errorf("file %s is empty", filename)
	}

	return tempPath, filename, nil
}

// cleanupFiles removes temporary files
func (h *ConversionHandler) cleanupFiles(paths []string) {
	for _, p := range paths {
		os.Remove(p)
	}
}

// Status handles GET /api/v1/convert/status/:jobId
func (h *ConversionHandler) Status(c *gin.Context) {
	jobID := c.Param("jobId")
	if jobID == "" {
		utils.BadRequest(c, "Job ID required")
		return
	}

	job, err := h.conversionService.GetJob(jobID)
	if err != nil {
		utils.NotFound(c, "Job not found")
		return
	}

	utils.Success(c, gin.H{
		"jobId":          job.ID,
		"status":         job.Status,
		"progress":       job.Progress,
		"processedFiles": job.ProcessedFiles,
		"totalFiles":     job.TotalFiles,
		"error":          job.Error,
		"createdAt":      job.CreatedAt,
		"completedAt":    job.CompletedAt,
	})
}

// Download handles GET /api/v1/convert/download/:jobId
// Forces file download with Content-Disposition: attachment
func (h *ConversionHandler) Download(c *gin.Context) {
	jobID := c.Param("jobId")
	if jobID == "" {
		utils.BadRequest(c, "Job ID required")
		return
	}

	resultPath, filename, err := h.conversionService.GetResultPath(jobID)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// Check file exists
	fileInfo, err := os.Stat(resultPath)
	if err != nil {
		utils.NotFound(c, "Result file not found")
		return
	}

	// Open file
	file, err := os.Open(resultPath)
	if err != nil {
		utils.InternalServerError(c, "Failed to read result file")
		return
	}
	defer file.Close()

	// Determine content type
	contentType := "application/octet-stream"
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".pdf":
		contentType = "application/pdf"
	case ".docx":
		contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	case ".odt":
		contentType = "application/vnd.oasis.opendocument.text"
	case ".zip":
		contentType = "application/zip"
	}

	// Set headers for forced download
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	c.Header("Content-Type", contentType)
	c.Header("Content-Length", strconv.FormatInt(fileInfo.Size(), 10))
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")

	// Stream file
	c.Status(200)
	io.Copy(c.Writer, file)
}

// Formats handles GET /api/v1/convert/formats
// Returns supported conversion formats
func (h *ConversionHandler) Formats(c *gin.Context) {
	utils.Success(c, gin.H{
		"conversions": services.GetSupportedConversions(),
		"inputTypes":  []string{"doc", "docx", "odt", "ppt", "pptx", "xls", "xlsx", "pdf"},
		"outputTypes": []string{"pdf", "docx", "odt"},
	})
}

// RegisterRoutes registers conversion routes
func (h *ConversionHandler) RegisterRoutes(r *gin.RouterGroup) {
	convert := r.Group("/convert")
	{
		convert.POST("", h.Convert)
		convert.GET("/status/:jobId", h.Status)
		convert.GET("/download/:jobId", h.Download)
		convert.GET("/formats", h.Formats)
	}
}
