package handlers

import (
	"io"
	"log"
	"net/http"
	"strings"

	"brainy-pdf/internal/services"
	"brainy-pdf/internal/utils"
	"github.com/gin-gonic/gin"
)

// AIHandler handles AI-powered endpoints
type AIHandler struct {
	aiService      *services.AIService
	pdfService     *services.PDFService
	storageService *services.StorageService
}

// NewAIHandler creates a new AI handler
func NewAIHandler(aiService *services.AIService, pdfService *services.PDFService, storageService *services.StorageService) *AIHandler {
	return &AIHandler{
		aiService:      aiService,
		pdfService:     pdfService,
		storageService: storageService,
	}
}

// OCR handles POST /api/v1/ai/ocr
func (h *AIHandler) OCR(c *gin.Context) {
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		utils.BadRequest(c, "No file provided")
		return
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		utils.BadRequest(c, "Failed to read file")
		return
	}

	// First try to extract text directly (for non-scanned PDFs)
	text, err := h.pdfService.ExtractText(c.Request.Context(), data)
	if err == nil && len(strings.TrimSpace(text)) > 100 {
		// PDF has extractable text, return it
		pageCount, _ := h.pdfService.GetPageCount(data)
		utils.Success(c, gin.H{
			"text":       text,
			"pages":      []gin.H{{"pageNumber": 1, "text": text}},
			"totalPages": pageCount,
			"method":     "text_extraction",
		})
		return
	}

	// Fall back to OCR for scanned PDFs
	result, err := h.aiService.ExtractTextOCR(c.Request.Context(), data)
	if err != nil {
		utils.InternalServerError(c, "OCR failed: "+err.Error())
		return
	}

	utils.Success(c, gin.H{
		"text":       result.Text,
		"pages":      result.Pages,
		"totalPages": result.TotalPages,
		"method":     "ocr",
	})
}

// Summarize handles POST /api/v1/ai/summarize
func (h *AIHandler) Summarize(c *gin.Context) {
	// Check if AI service is available
	if h.aiService == nil {
		utils.ServiceUnavailable(c, "AI service is not configured. Please set OPENROUTER_API_KEY in environment.")
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		utils.BadRequest(c, "No file provided")
		return
	}
	defer file.Close()

	// Validate file size (max 10MB for AI processing)
	if header.Size > 10*1024*1024 {
		utils.BadRequest(c, "File too large. Maximum size for AI processing is 10MB.")
		return
	}

	length := c.DefaultPostForm("length", "medium")

	// Validate length parameter
	if length != "short" && length != "medium" && length != "long" {
		length = "medium"
	}

	data, err := io.ReadAll(file)
	if err != nil {
		utils.BadRequest(c, "Failed to read file")
		return
	}

	// Validate PDF format
	if err := h.pdfService.ValidatePDF(data); err != nil {
		utils.BadRequest(c, "Invalid PDF file: "+err.Error())
		return
	}

	// Extract text from PDF
	text, err := h.pdfService.ExtractText(c.Request.Context(), data)
	
	// Check if text extraction failed or returned low-quality text
	needsOCR := false
	if err != nil {
		log.Printf("[AI] Normal text extraction failed: %v, trying OCR...", err)
		needsOCR = true
	} else if len(strings.TrimSpace(text)) < 50 {
		log.Printf("[AI] Extracted text too short (%d chars), trying OCR...", len(strings.TrimSpace(text)))
		needsOCR = true
	} else if !services.IsTextReadable(text) {
		log.Printf("[AI] Extracted text appears to be garbage/unreadable, trying OCR...")
		needsOCR = true
	}
	
	// Try OCR if needed
	if needsOCR {
		ocrText, ocrErr := h.pdfService.ExtractTextWithOCR(c.Request.Context(), data)
		if ocrErr != nil {
			log.Printf("[AI] OCR also failed: %v", ocrErr)
			// If we have some text from normal extraction, use it anyway
			if text == "" || len(strings.TrimSpace(text)) < 20 {
				utils.BadRequest(c, "Could not extract readable text from this PDF. It may be a scanned document or graphics-heavy. OCR extraction also failed: "+ocrErr.Error())
				return
			}
			log.Printf("[AI] Using low-quality text from normal extraction as fallback")
		} else {
			log.Printf("[AI] OCR extraction successful (%d chars)", len(ocrText))
			text = ocrText
		}
	}
	
	// Clean the extracted text
	text = services.CleanExtractedText(text)
	
	// Final validation
	if len(strings.TrimSpace(text)) < 30 {
		utils.BadRequest(c, "Not enough text content to summarize. The PDF may be empty or contain only images.")
		return
	}

	result, err := h.aiService.SummarizePDF(c.Request.Context(), text, length)
	if err != nil {
		// Check for specific error types
		errMsg := err.Error()
		if strings.Contains(errMsg, "quota") || strings.Contains(errMsg, "rate") {
			utils.TooManyRequests(c, "AI API rate limit exceeded. Please try again in a few moments.")
			return
		}
		if strings.Contains(errMsg, "timeout") || strings.Contains(errMsg, "deadline") {
			utils.GatewayTimeout(c, "AI processing timed out. Please try with a smaller document.")
			return
		}
		if strings.Contains(errMsg, "unintelligible") || strings.Contains(errMsg, "encrypted") {
			utils.BadRequest(c, "The document content could not be understood. Please ensure the PDF contains readable text, not just images.")
			return
		}
		utils.InternalServerError(c, "Summarization failed: "+err.Error())
		return
	}

	utils.Success(c, gin.H{
		"summary":          result.Summary,
		"documentType":     result.DocumentType,
		"confidenceLevel":  result.ConfidenceLevel,
		"keyEntities":      result.KeyEntities,
		"importantPoints":  result.ImportantPoints,
		"wordCount":        result.WordCount,
	})
}

// DetectSensitive handles POST /api/v1/ai/detect-sensitive
func (h *AIHandler) DetectSensitive(c *gin.Context) {
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		utils.BadRequest(c, "No file provided")
		return
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		utils.BadRequest(c, "Failed to read file")
		return
	}

	// Extract text
	text, err := h.pdfService.ExtractText(c.Request.Context(), data)
	if err != nil || len(strings.TrimSpace(text)) < 10 {
		ocrResult, ocrErr := h.aiService.ExtractTextOCR(c.Request.Context(), data)
		if ocrErr != nil {
			utils.InternalServerError(c, "Failed to extract text from PDF")
			return
		}
		text = ocrResult.Text
	}

	result, err := h.aiService.DetectSensitiveData(c.Request.Context(), text)
	if err != nil {
		utils.InternalServerError(c, "Detection failed: "+err.Error())
		return
	}

	utils.Success(c, gin.H{
		"findings": result.Findings,
		"total":    result.Total,
		"types":    result.Types,
	})
}

// MaskSensitive handles POST /api/v1/ai/mask-sensitive
func (h *AIHandler) MaskSensitive(c *gin.Context) {
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		utils.BadRequest(c, "No file provided")
		return
	}
	defer file.Close()

	typesStr := c.DefaultPostForm("types", "email,phone,ssn,credit_card")
	types := strings.Split(typesStr, ",")

	data, err := io.ReadAll(file)
	if err != nil {
		utils.BadRequest(c, "Failed to read file")
		return
	}

	// Extract text
	text, err := h.pdfService.ExtractText(c.Request.Context(), data)
	if err != nil {
		utils.InternalServerError(c, "Failed to extract text from PDF")
		return
	}

	// Mask sensitive data in text
	maskedText, maskedCount, err := h.aiService.MaskSensitiveData(c.Request.Context(), text, types)
	if err != nil {
		utils.InternalServerError(c, "Masking failed: "+err.Error())
		return
	}

	// Note: Full PDF masking would require more complex PDF manipulation
	// For now, we return the masked text and count
	utils.Success(c, gin.H{
		"maskedText":  maskedText,
		"maskedCount": maskedCount,
		"types":       types,
		"note":        "Full PDF masking requires additional processing",
	})
}

// AutoFill handles POST /api/v1/ai/auto-fill
func (h *AIHandler) AutoFill(c *gin.Context) {
	var request struct {
		FormFields []string          `json:"formFields"`
		UserData   map[string]string `json:"userData"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		utils.BadRequest(c, "Invalid request body")
		return
	}

	if len(request.FormFields) == 0 {
		utils.BadRequest(c, "Form fields required")
		return
	}

	suggestions, err := h.aiService.GetAutoFillSuggestions(
		c.Request.Context(),
		request.FormFields,
		request.UserData,
	)
	if err != nil {
		utils.InternalServerError(c, "Auto-fill failed: "+err.Error())
		return
	}

	utils.Success(c, gin.H{
		"suggestions": suggestions,
	})
}

// Search handles POST /api/v1/ai/search
func (h *AIHandler) Search(c *gin.Context) {
	var request struct {
		Query     string   `json:"query"`
		Documents []string `json:"documents,omitempty"`
		FileIDs   []string `json:"fileIds,omitempty"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		utils.BadRequest(c, "Invalid request body")
		return
	}

	if request.Query == "" {
		utils.BadRequest(c, "Search query required")
		return
	}

	// If fileIDs provided, load documents from storage
	var documents []string
	if len(request.FileIDs) > 0 {
		for _, fileID := range request.FileIDs {
			_, data, err := h.storageService.GetFile(c.Request.Context(), fileID)
			if err != nil {
				continue
			}
			text, err := h.pdfService.ExtractText(c.Request.Context(), data)
			if err != nil {
				continue
			}
			documents = append(documents, text)
		}
	} else {
		documents = request.Documents
	}

	if len(documents) == 0 {
		utils.BadRequest(c, "No documents to search")
		return
	}

	results, err := h.aiService.SmartSearch(c.Request.Context(), request.Query, documents)
	if err != nil {
		utils.InternalServerError(c, "Search failed: "+err.Error())
		return
	}

	// Build response with document indices and snippets
	var searchResults []gin.H
	for _, idx := range results {
		if idx < len(documents) {
			snippet := documents[idx]
			if len(snippet) > 200 {
				snippet = snippet[:200] + "..."
			}
			searchResults = append(searchResults, gin.H{
				"documentIndex": idx,
				"snippet":       snippet,
				"relevance":     1.0 - float64(len(searchResults))*0.1,
			})
		}
	}

	utils.Success(c, gin.H{
		"query":   request.Query,
		"results": searchResults,
		"total":   len(searchResults),
	})
}

// RegisterRoutes registers all AI routes
func (h *AIHandler) RegisterRoutes(r *gin.RouterGroup) {
	ai := r.Group("/ai")
	{
		ai.POST("/ocr", h.OCR)
		ai.POST("/summarize", h.Summarize)
		ai.POST("/detect-sensitive", h.DetectSensitive)
		ai.POST("/mask-sensitive", h.MaskSensitive)
		ai.POST("/auto-fill", h.AutoFill)
		ai.POST("/search", h.Search)
		ai.POST("/chat", h.Chat)
	}
}

// Chat handles POST /api/v1/ai/chat
func (h *AIHandler) Chat(c *gin.Context) {
	var request struct {
		Text     string                 `json:"text"`
		Question string                 `json:"question"`
		History  []services.ChatMessage `json:"history"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		utils.BadRequest(c, "Invalid request body")
		return
	}

	if request.Text == "" {
		utils.BadRequest(c, "Document text is required")
		return
	}

	if request.Question == "" {
		utils.BadRequest(c, "Question is required")
		return
	}

	answer, err := h.aiService.ChatWithPDF(
		c.Request.Context(),
		request.Text,
		request.Question,
		request.History,
	)
	if err != nil {
		utils.InternalServerError(c, "Chat failed: "+err.Error())
		return
	}

	utils.Success(c, gin.H{
		"answer": answer,
	})
}

// HealthCheck returns AI service status
func (h *AIHandler) HealthCheck(c *gin.Context) {
	status := gin.H{
		"ocr":    "available",
		"gemini": "unavailable",
	}

	// Check if Gemini is configured
	if h.aiService != nil {
		status["gemini"] = "available"
	}

	c.JSON(http.StatusOK, status)
}
