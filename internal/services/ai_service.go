package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"image"
	"image/png"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"brainy-pdf/internal/models"
	"github.com/google/uuid"
	"github.com/pdfcpu/pdfcpu/pkg/api"
)

// OpenRouter API configuration
const (
	OpenRouterAPIURL   = "https://openrouter.ai/api/v1/chat/completions"
	OpenRouterModel    = "google/gemma-3-27b-it:free"
)

// ChatMessage represents a message in the chat format
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatRequest represents an OpenRouter chat completion request
type ChatRequest struct {
	Model       string        `json:"model"`
	Messages    []ChatMessage `json:"messages"`
	Temperature float64       `json:"temperature,omitempty"`
	MaxTokens   int           `json:"max_tokens,omitempty"`
}

// ChatChoice represents a choice in the response
type ChatChoice struct {
	Message ChatMessage `json:"message"`
}

// ChatResponse represents an OpenRouter chat completion response
type ChatResponse struct {
	Choices []ChatChoice `json:"choices"`
	Error   *struct {
		Message string `json:"message"`
		Code    string `json:"code"`
	} `json:"error,omitempty"`
}

// AIService handles AI-powered PDF operations using OpenRouter
type AIService struct {
	apiKey     string
	httpClient *http.Client
	tempDir    string
}

// NewAIService creates a new AI service with OpenRouter
func NewAIService(ctx context.Context, openRouterAPIKey string) (*AIService, error) {
	tempDir := filepath.Join(os.TempDir(), "binarypdf-ai")
	os.MkdirAll(tempDir, 0755)

	if openRouterAPIKey == "" {
		log.Println("[AI] Warning: No OpenRouter API key configured")
		return &AIService{
			tempDir:    tempDir,
			httpClient: &http.Client{Timeout: 120 * time.Second},
		}, nil
	}

	log.Printf("[AI] OpenRouter AI service initialized with model: %s", OpenRouterModel)
	return &AIService{
		apiKey:     openRouterAPIKey,
		httpClient: &http.Client{Timeout: 120 * time.Second},
		tempDir:    tempDir,
	}, nil
}

// callOpenRouter makes a request to the OpenRouter API with retry logic
func (s *AIService) callOpenRouter(ctx context.Context, prompt string) (string, error) {
	if s.apiKey == "" {
		return "", fmt.Errorf("OpenRouter API key not configured")
	}

	reqBody := ChatRequest{
		Model: OpenRouterModel,
		Messages: []ChatMessage{
			{Role: "user", Content: prompt},
		},
		Temperature: 0.3,
		MaxTokens:   8192,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	// Retry logic with exponential backoff for rate limiting
	maxRetries := 3
	baseDelay := 2 * time.Second

	for attempt := 0; attempt <= maxRetries; attempt++ {
		if attempt > 0 {
			delay := baseDelay * time.Duration(1<<(attempt-1)) // 2s, 4s, 8s
			log.Printf("[AI] Rate limited, waiting %v before retry %d/%d", delay, attempt, maxRetries)
			select {
			case <-time.After(delay):
			case <-ctx.Done():
				return "", ctx.Err()
			}
		}

		req, err := http.NewRequestWithContext(ctx, "POST", OpenRouterAPIURL, bytes.NewBuffer(jsonData))
		if err != nil {
			return "", fmt.Errorf("failed to create request: %w", err)
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+s.apiKey)
		req.Header.Set("HTTP-Referer", "https://binarypdf.com")
		req.Header.Set("X-Title", "BinaryPDF")

		log.Printf("[AI] Calling OpenRouter with model: %s (attempt %d)", OpenRouterModel, attempt+1)

		resp, err := s.httpClient.Do(req)
		if err != nil {
			return "", fmt.Errorf("failed to call OpenRouter: %w", err)
		}

		body, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			return "", fmt.Errorf("failed to read response: %w", err)
		}

		if resp.StatusCode == 429 {
			log.Printf("[AI] OpenRouter rate limit hit: %s", string(body))
			if attempt < maxRetries {
				continue // Retry
			}
			return "", fmt.Errorf("rate limit exceeded after %d retries. Please wait a moment and try again", maxRetries+1)
		}

		if resp.StatusCode != http.StatusOK {
			log.Printf("[AI] OpenRouter error response: %s", string(body))
			return "", fmt.Errorf("OpenRouter API error (status %d): %s", resp.StatusCode, string(body))
		}

		var chatResp ChatResponse
		if err := json.Unmarshal(body, &chatResp); err != nil {
			return "", fmt.Errorf("failed to parse response: %w", err)
		}

		if chatResp.Error != nil {
			return "", fmt.Errorf("API error: %s", chatResp.Error.Message)
		}

		if len(chatResp.Choices) == 0 {
			return "", fmt.Errorf("no response from AI model")
		}

		log.Printf("[AI] OpenRouter response received successfully")
		return chatResp.Choices[0].Message.Content, nil
	}

	return "", fmt.Errorf("unexpected error in retry loop")
}

// OCRResult represents the OCR extraction result
type OCRServiceResult struct {
	Text       string                  `json:"text"`
	Pages      []models.OCRPageResult  `json:"pages"`
	TotalPages int                     `json:"totalPages"`
}

// ExtractTextOCR extracts text from a scanned PDF
// Note: OpenRouter text models don't support vision, so this returns a fallback message
// The AI handler falls back to text extraction for regular PDFs
func (s *AIService) ExtractTextOCR(ctx context.Context, pdfData []byte) (*OCRServiceResult, error) {
	// OpenRouter's text-only models don't support vision/OCR
	// Return an error to let the handler fall back to text extraction
	return nil, fmt.Errorf("OCR not available: current AI model does not support image processing")
}

// extractTextFromImage would use a vision model to extract text
// Currently returns an error since OpenRouter text models don't support vision
func (s *AIService) extractTextFromImage(ctx context.Context, imgData []byte, prompt string) (string, error) {
	return "", fmt.Errorf("vision OCR not available with current AI model")
}

// pdfToImages converts PDF pages to PNG images
func (s *AIService) pdfToImages(pdfData []byte) ([][]byte, error) {
	inputPath := filepath.Join(s.tempDir, fmt.Sprintf("pdf_%s.pdf", uuid.New().String()))
	if err := os.WriteFile(inputPath, pdfData, 0644); err != nil {
		return nil, err
	}
	defer os.Remove(inputPath)

	outputDir := filepath.Join(s.tempDir, fmt.Sprintf("images_%s", uuid.New().String()))
	os.MkdirAll(outputDir, 0755)
	defer os.RemoveAll(outputDir)

	// Use pdfcpu to extract images (this is a simplified approach)
	// For production, you'd want to use poppler or another tool
	if err := api.ExtractImagesFile(inputPath, outputDir, nil, nil); err != nil {
		// Fallback: try to render pages as images using pdfcpu
		// This is limited - for full support, poppler-utils would be needed
		return nil, fmt.Errorf("image extraction requires additional tools (poppler-utils)")
	}

	var images [][]byte
	files, _ := filepath.Glob(filepath.Join(outputDir, "*.png"))
	for _, f := range files {
		data, err := os.ReadFile(f)
		if err == nil {
			images = append(images, data)
		}
	}

	if len(images) == 0 {
		return nil, fmt.Errorf("no images extracted from PDF")
	}

	return images, nil
}

// SummarizeResult represents the advanced analysis result
type SummarizeResult struct {
	DocumentType    string                 `json:"document_type"`
	ConfidenceLevel string                 `json:"confidence_level"`
	KeyEntities     map[string]interface{} `json:"key_entities"`
	ImportantPoints []string               `json:"important_points"`
	Summary         string                 `json:"summary"`
	WordCount       int                    `json:"word_count"` // Kept for backward compatibility
}

// SummarizePDF analyzes the content of a PDF using OpenRouter with advanced document intelligence capabilities
func (s *AIService) SummarizePDF(ctx context.Context, text string, length string) (*SummarizeResult, error) {
	if s.apiKey == "" {
		return nil, fmt.Errorf("OpenRouter API not configured")
	}

	lengthInstruction := "medium length (2-3 paragraphs)"
	switch length {
	case "short":
		lengthInstruction = "short (1 paragraph, ~100 words)"
	case "long":
		lengthInstruction = "detailed (4-5 paragraphs)"
	}

	prompt := fmt.Sprintf(`You are an advanced Document Intelligence AI.
	
Document processing context:
1. Treat OCR text as VALID HUMAN CONTENT, even if it has minor noise.
2. Clean, normalize, and reconstruct the text logically.
3. Automatically identify document type (Resume, Invoice, Bank Statement, Legal, Report, etc.).

Your tasks:
1. Identify the document type.
2. Extract meaningful entities based on the type.
3. Provide a clear human-readable %s summary.
4. If it's a Resume, extract name, skills, experience, education.

Output strictly in this JSON format:
{
  "document_type": "Resume / Invoice / etc",
  "confidence_level": "High / Medium / Low",
  "key_entities": {
    "name": "...",
    "date": "...",
    "skills": ["..."],
    "total_amount": "..." 
  },
  "important_points": ["point 1", "point 2", ...],
  "summary": "..."
}

Document Content:
%s`, lengthInstruction, truncateText(text, 30000))

	log.Printf("[AI] SummarizePDF: calling OpenRouter...")

	responseText, err := s.callOpenRouter(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("failed to generate analysis: %w", err)
	}

	// Parse JSON response
	// Find JSON start and end to handle potential markdown formatting
	jsonStart := strings.Index(responseText, "{")
	jsonEnd := strings.LastIndex(responseText, "}")
	
	if jsonStart == -1 || jsonEnd == -1 || jsonEnd < jsonStart {
		log.Printf("[AI] Error: valid JSON not found in response: %s", responseText)
		return nil, fmt.Errorf("AI response was not in expected JSON format")
	}
	
	jsonContent := responseText[jsonStart : jsonEnd+1]
	
	var result SummarizeResult
	if err := json.Unmarshal([]byte(jsonContent), &result); err != nil {
		log.Printf("[AI] JSON unmarshal error: %v. Content: %s", err, jsonContent)
		// Fallback: try to manually extract summary if JSON parsing fails
		return &SummarizeResult{
			DocumentType: "Unknown",
			Summary:      responseText,
			WordCount:    len(strings.Fields(text)),
		}, nil
	}

	// Calculate word count from input text
	result.WordCount = len(strings.Fields(text))

	log.Printf("[AI] SummarizePDF completed successfully. Type: %s", result.DocumentType)
	return &result, nil
}

// ChatWithPDF allows users to ask questions about a PDF
func (s *AIService) ChatWithPDF(ctx context.Context, text string, question string, history []ChatMessage) (string, error) {
	if s.apiKey == "" {
		return "", fmt.Errorf("OpenRouter API not configured")
	}

	// Truncate text to fit context window
	contextText := truncateText(text, 50000)

	systemPrompt := fmt.Sprintf(`You are a helpful AI assistant analyzing a PDF document.
Use the following context from the document to answer the user's question.
If the answer is not in the context, say "I cannot find the answer in this document."

Context:
%s`, contextText)

	// Build messages array
	messages := []ChatMessage{
		{Role: "system", Content: systemPrompt},
	}
	
	// Add history (limit to last 15 messages)
	if len(history) > 15 {
		history = history[len(history)-15:]
	}
	messages = append(messages, history...)
	
	// Add current question
	messages = append(messages, ChatMessage{Role: "user", Content: question})

	reqBody := ChatRequest{
		Model:       OpenRouterModel,
		Messages:    messages,
		Temperature: 0.3,
		MaxTokens:   2048,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	// Retry logic with exponential backoff for rate limiting
	maxRetries := 3
	baseDelay := 2 * time.Second

	for attempt := 0; attempt <= maxRetries; attempt++ {
		if attempt > 0 {
			delay := baseDelay * time.Duration(1<<(attempt-1)) // 2s, 4s, 8s
			log.Printf("[AI] Chat rate limited, waiting %v before retry %d/%d", delay, attempt, maxRetries)
			select {
			case <-time.After(delay):
			case <-ctx.Done():
				return "", ctx.Err()
			}
		}

		req, err := http.NewRequestWithContext(ctx, "POST", OpenRouterAPIURL, bytes.NewBuffer(jsonData))
		if err != nil {
			return "", fmt.Errorf("failed to create request: %w", err)
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+s.apiKey)
		req.Header.Set("HTTP-Referer", "https://binarypdf.com")
		req.Header.Set("X-Title", "BinaryPDF")

		log.Printf("[AI] Calling OpenRouter Chat with model: %s (attempt %d)", OpenRouterModel, attempt+1)

		resp, err := s.httpClient.Do(req)
		if err != nil {
			return "", fmt.Errorf("failed to call OpenRouter: %w", err)
		}

		body, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			return "", fmt.Errorf("failed to read response: %w", err)
		}

		if resp.StatusCode == 429 {
			log.Printf("[AI] Chat OpenRouter rate limit hit: %s", string(body))
			if attempt < maxRetries {
				continue // Retry
			}
			return "", fmt.Errorf("rate limit exceeded after %d retries. Please wait a moment and try again", maxRetries+1)
		}

		if resp.StatusCode != http.StatusOK {
			log.Printf("[AI] Chat OpenRouter Error: %s", string(body))
			return "", fmt.Errorf("OpenRouter API error (status %d): %s", resp.StatusCode, string(body))
		}

		var chatResp ChatResponse
		if err := json.Unmarshal(body, &chatResp); err != nil {
			log.Printf("[AI] Chat JSON Parse Error: %v. Body: %s", err, string(body))
			return "", fmt.Errorf("failed to parse response: %w", err)
		}

		if len(chatResp.Choices) == 0 {
			return "", fmt.Errorf("no response from AI model")
		}

		log.Printf("[AI] Chat response received successfully")
		return chatResp.Choices[0].Message.Content, nil
	}

	return "", fmt.Errorf("unexpected error in retry loop")
}

// SensitiveDataResult represents sensitive data detection result
type SensitiveDataServiceResult struct {
	Findings []models.SensitiveDataFinding `json:"findings"`
	Total    int                           `json:"total"`
	Types    map[string]int                `json:"types"`
}

// DetectSensitiveData detects sensitive information in text
func (s *AIService) DetectSensitiveData(ctx context.Context, text string) (*SensitiveDataServiceResult, error) {
	result := &SensitiveDataServiceResult{
		Types: make(map[string]int),
	}

	// Use regex patterns for common sensitive data types
	patterns := map[string]*regexp.Regexp{
		"email":       regexp.MustCompile(`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`),
		"phone":       regexp.MustCompile(`(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}`),
		"ssn":         regexp.MustCompile(`\d{3}-\d{2}-\d{4}`),
		"credit_card": regexp.MustCompile(`\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}`),
		"ip_address":  regexp.MustCompile(`\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}`),
	}

	for dataType, pattern := range patterns {
		matches := pattern.FindAllString(text, -1)
		for _, match := range matches {
			result.Findings = append(result.Findings, models.SensitiveDataFinding{
				Type:     dataType,
				Value:    maskSensitiveValue(match, dataType),
				Page:     0, // Would be set if we process per-page
				Location: "detected",
			})
			result.Types[dataType]++
		}
	}

	// If OpenRouter AI is available, use it for more sophisticated detection
	if s.apiKey != "" && len(result.Findings) == 0 {
		aiResult, err := s.detectWithAI(ctx, text)
		if err == nil && aiResult != nil {
			result.Findings = append(result.Findings, aiResult.Findings...)
			for t, c := range aiResult.Types {
				result.Types[t] += c
			}
		}
	}

	result.Total = len(result.Findings)
	return result, nil
}

// detectWithAI uses OpenRouter to detect sensitive data
func (s *AIService) detectWithAI(ctx context.Context, text string) (*SensitiveDataServiceResult, error) {
	prompt := fmt.Sprintf(`Analyze this text and identify any sensitive personal information (PII) such as:
- Names
- Addresses
- Dates of birth
- Account numbers
- Medical information
- Legal case numbers

For each finding, provide:
- type (e.g., "name", "address", "date_of_birth")
- value (masked with asterisks)

Respond in JSON format only:
{
  "findings": [
    {"type": "...", "value": "..."}
  ]
}

Text to analyze:
%s`, truncateText(text, 15000))

	responseText, err := s.callOpenRouter(ctx, prompt)
	if err != nil {
		return nil, err
	}

	// Parse findings
	result := &SensitiveDataServiceResult{
		Types: make(map[string]int),
	}

	// Simple parsing (in production, use proper JSON parsing)
	findings := extractFindingsFromResponse(responseText)
	result.Findings = findings
	for _, f := range findings {
		result.Types[f.Type]++
	}
	result.Total = len(findings)

	return result, nil
}

// MaskSensitiveData replaces sensitive data with masked versions
func (s *AIService) MaskSensitiveData(ctx context.Context, text string, types []string) (string, int, error) {
	maskedCount := 0
	result := text

	patterns := map[string]*regexp.Regexp{
		"email":       regexp.MustCompile(`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`),
		"phone":       regexp.MustCompile(`(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}`),
		"ssn":         regexp.MustCompile(`\d{3}-\d{2}-\d{4}`),
		"credit_card": regexp.MustCompile(`\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}`),
	}

	for _, t := range types {
		if pattern, ok := patterns[t]; ok {
			matches := pattern.FindAllString(result, -1)
			for _, match := range matches {
				masked := maskSensitiveValue(match, t)
				result = strings.Replace(result, match, masked, 1)
				maskedCount++
			}
		}
	}

	return result, maskedCount, nil
}

// AutoFillSuggestion represents a form field suggestion
type AutoFillSuggestion struct {
	FieldName      string `json:"fieldName"`
	SuggestedValue string `json:"suggestedValue"`
	Confidence     float64 `json:"confidence"`
}

// GetAutoFillSuggestions generates form auto-fill suggestions
func (s *AIService) GetAutoFillSuggestions(ctx context.Context, formFields []string, userData map[string]string) ([]AutoFillSuggestion, error) {
	if s.apiKey == "" {
		return nil, fmt.Errorf("OpenRouter AI not configured")
	}

	prompt := fmt.Sprintf(`Given these form fields and user data, suggest the best values to fill in.

Form fields: %v

User data: %v

Respond in JSON format only:
{
  "suggestions": [
    {"fieldName": "...", "suggestedValue": "...", "confidence": 0.0-1.0}
  ]
}`, formFields, userData)

	responseText, err := s.callOpenRouter(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("failed to get suggestions: %w", err)
	}

	// Parse suggestions (simplified)
	suggestions := parseAutoFillSuggestions(responseText, formFields, userData)
	return suggestions, nil
}

// SmartSearch performs semantic search across documents
func (s *AIService) SmartSearch(ctx context.Context, query string, documents []string) ([]int, error) {
	if s.apiKey == "" {
		// Fallback to simple keyword matching
		var results []int
		queryLower := strings.ToLower(query)
		for i, doc := range documents {
			if strings.Contains(strings.ToLower(doc), queryLower) {
				results = append(results, i)
			}
		}
		return results, nil
	}

	// Use OpenRouter for semantic search
	docSummaries := ""
	for i, doc := range documents {
		docSummaries += fmt.Sprintf("\n[Document %d]: %s", i, truncateText(doc, 500))
	}

	prompt := fmt.Sprintf(`Given this search query: "%s"

And these documents:%s

Return the indices of documents that are most relevant to the query, in order of relevance.
Respond with just the numbers separated by commas (e.g., "2,0,4")`, query, docSummaries)

	responseText, err := s.callOpenRouter(ctx, prompt)
	if err != nil {
		return nil, err
	}

	// Parse indices
	var results []int
	parts := strings.Split(responseText, ",")
	for _, p := range parts {
		p = strings.TrimSpace(p)
		var idx int
		if _, err := fmt.Sscanf(p, "%d", &idx); err == nil {
			if idx >= 0 && idx < len(documents) {
				results = append(results, idx)
			}
		}
	}

	return results, nil
}

// PageAnalysis represents analysis of a single page
type PageAnalysis struct {
	PageNumber  int      `json:"pageNumber"`
	ContentType string   `json:"contentType"` // cover, toc, chapter, appendix, etc.
	Title       string   `json:"title"`
	Summary     string   `json:"summary"`
	Keywords    []string `json:"keywords"`
	HasImages   bool     `json:"hasImages"`
	IsScanned   bool     `json:"isScanned"`
	TextContent string   `json:"textContent"`
}

// OrganizeSuggestion represents a suggested page order
type OrganizeSuggestion struct {
	SuggestedOrder []int          `json:"suggestedOrder"`
	Reasoning      string         `json:"reasoning"`
	PageAnalyses   []PageAnalysis `json:"pageAnalyses"`
	Confidence     float64        `json:"confidence"`
}

// SuggestPageOrder analyzes PDF pages and suggests optimal ordering
func (s *AIService) SuggestPageOrder(ctx context.Context, pageTexts []string) (*OrganizeSuggestion, error) {
	if s.apiKey == "" {
		// Without AI, return original order
		order := make([]int, len(pageTexts))
		for i := range order {
			order[i] = i + 1
		}
		return &OrganizeSuggestion{
			SuggestedOrder: order,
			Reasoning:      "AI not configured - returning original order",
			Confidence:     0.5,
		}, nil
	}

	// Build page summaries for AI analysis
	var pageSummaries strings.Builder
	for i, text := range pageTexts {
		truncated := truncateText(text, 500)
		pageSummaries.WriteString(fmt.Sprintf("\n--- PAGE %d ---\n%s\n", i+1, truncated))
	}

	prompt := fmt.Sprintf(`Analyze these PDF pages and suggest the optimal reading order.

Consider:
1. Cover pages should be first
2. Table of contents should follow cover
3. Introduction/preface before main content
4. Chapters in logical sequence
5. Appendices and references at the end
6. Identify any misplaced or out-of-order pages

Pages to analyze:
%s

Respond in JSON format:
{
  "suggestedOrder": [1, 2, 3, ...],
  "reasoning": "Brief explanation of why this order is optimal",
  "pageTypes": [
    {"page": 1, "type": "cover|toc|introduction|chapter|appendix|reference|other", "title": "detected title if any"}
  ],
  "confidence": 0.0-1.0
}`, pageSummaries.String())

	responseText, err := s.callOpenRouter(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("failed to analyze pages: %w", err)
	}

	// Parse response
	result := &OrganizeSuggestion{
		Confidence: 0.8,
	}

	// Extract suggested order
	orderPattern := regexp.MustCompile(`"suggestedOrder"\s*:\s*\[([\d,\s]+)\]`)
	if matches := orderPattern.FindStringSubmatch(responseText); len(matches) >= 2 {
		orderParts := strings.Split(matches[1], ",")
		for _, p := range orderParts {
			p = strings.TrimSpace(p)
			var num int
			if _, err := fmt.Sscanf(p, "%d", &num); err == nil {
				result.SuggestedOrder = append(result.SuggestedOrder, num)
			}
		}
	}

	// Extract reasoning
	result.Reasoning = extractJSONField(responseText, "reasoning")
	if result.Reasoning == "" {
		result.Reasoning = "Pages analyzed and ordered based on content structure"
	}

	// Extract confidence
	confPattern := regexp.MustCompile(`"confidence"\s*:\s*([\d.]+)`)
	if matches := confPattern.FindStringSubmatch(responseText); len(matches) >= 2 {
		fmt.Sscanf(matches[1], "%f", &result.Confidence)
	}

	// If no order was extracted, return original
	if len(result.SuggestedOrder) == 0 {
		for i := range pageTexts {
			result.SuggestedOrder = append(result.SuggestedOrder, i+1)
		}
	}

	// Analyze each page
	for i, text := range pageTexts {
		analysis := PageAnalysis{
			PageNumber:  i + 1,
			TextContent: truncateText(text, 200),
			IsScanned:   len(strings.TrimSpace(text)) < 50, // Likely scanned if little text
		}
		
		// Detect content type based on keywords
		textLower := strings.ToLower(text)
		switch {
		case strings.Contains(textLower, "table of contents") || strings.Contains(textLower, "contents"):
			analysis.ContentType = "toc"
		case strings.Contains(textLower, "introduction") || strings.Contains(textLower, "preface"):
			analysis.ContentType = "introduction"
		case strings.Contains(textLower, "chapter"):
			analysis.ContentType = "chapter"
		case strings.Contains(textLower, "appendix"):
			analysis.ContentType = "appendix"
		case strings.Contains(textLower, "reference") || strings.Contains(textLower, "bibliography"):
			analysis.ContentType = "reference"
		case i == 0:
			analysis.ContentType = "cover"
		default:
			analysis.ContentType = "content"
		}
		
		result.PageAnalyses = append(result.PageAnalyses, analysis)
	}

	return result, nil
}

// MergeAnalysis represents analysis for merging PDFs
type MergeAnalysis struct {
	FileIndex    int            `json:"fileIndex"`
	FileName     string         `json:"fileName"`
	PageCount    int            `json:"pageCount"`
	IsScanned    bool           `json:"isScanned"`
	OCRText      string         `json:"ocrText,omitempty"`
	PageAnalyses []PageAnalysis `json:"pageAnalyses"`
}

// MergeSuggestion represents suggestions for merging PDFs
type MergeSuggestion struct {
	SuggestedFileOrder []int           `json:"suggestedFileOrder"`
	MergeAnalyses      []MergeAnalysis `json:"mergeAnalyses"`
	Reasoning          string          `json:"reasoning"`
	TotalPages         int             `json:"totalPages"`
}

// AnalyzeForMerge analyzes multiple PDFs and suggests optimal merge order
func (s *AIService) AnalyzeForMerge(ctx context.Context, pdfTexts [][]string, fileNames []string) (*MergeSuggestion, error) {
	result := &MergeSuggestion{
		MergeAnalyses: make([]MergeAnalysis, len(pdfTexts)),
	}

	// Analyze each PDF
	for i, pages := range pdfTexts {
		analysis := MergeAnalysis{
			FileIndex: i,
			PageCount: len(pages),
		}
		
		if i < len(fileNames) {
			analysis.FileName = fileNames[i]
		} else {
			analysis.FileName = fmt.Sprintf("Document %d", i+1)
		}

		// Check if scanned (little extractable text)
		totalTextLen := 0
		for _, page := range pages {
			totalTextLen += len(strings.TrimSpace(page))
		}
		analysis.IsScanned = totalTextLen < len(pages)*100 // Average less than 100 chars per page

		// Analyze pages
		for j, pageText := range pages {
			pageAnalysis := PageAnalysis{
				PageNumber:  j + 1,
				TextContent: truncateText(pageText, 200),
				IsScanned:   len(strings.TrimSpace(pageText)) < 50,
			}
			analysis.PageAnalyses = append(analysis.PageAnalyses, pageAnalysis)
		}

		result.MergeAnalyses[i] = analysis
		result.TotalPages += len(pages)
	}

	// Use AI to suggest order if available
	if s.apiKey != "" && len(pdfTexts) > 1 {
		var docSummaries strings.Builder
		for i, pages := range pdfTexts {
			firstPage := ""
			if len(pages) > 0 {
				firstPage = truncateText(pages[0], 300)
			}
			docSummaries.WriteString(fmt.Sprintf("\n--- DOCUMENT %d (%s, %d pages) ---\n%s\n", 
				i+1, fileNames[i], len(pages), firstPage))
		}

		prompt := fmt.Sprintf(`Analyze these PDF documents and suggest the best order to merge them.

Consider:
1. Documents with cover pages or introductions should come first
2. Related content should be grouped together
3. Appendices and references should come last

Documents:
%s

Respond in JSON format:
{
  "suggestedOrder": [1, 2, 3, ...],
  "reasoning": "Brief explanation"
}`, docSummaries.String())

		responseText, err := s.callOpenRouter(ctx, prompt)
		if err == nil {
			
			// Extract order
			orderPattern := regexp.MustCompile(`"suggestedOrder"\s*:\s*\[([\d,\s]+)\]`)
			if matches := orderPattern.FindStringSubmatch(responseText); len(matches) >= 2 {
				orderParts := strings.Split(matches[1], ",")
				for _, p := range orderParts {
					p = strings.TrimSpace(p)
					var num int
					if _, err := fmt.Sscanf(p, "%d", &num); err == nil {
						result.SuggestedFileOrder = append(result.SuggestedFileOrder, num)
					}
				}
			}
			
			result.Reasoning = extractJSONField(responseText, "reasoning")
		}
	}

	// Default to original order if no suggestion
	if len(result.SuggestedFileOrder) == 0 {
		for i := range pdfTexts {
			result.SuggestedFileOrder = append(result.SuggestedFileOrder, i+1)
		}
		result.Reasoning = "Documents will be merged in upload order"
	}

	return result, nil
}

// OCRForMerge performs OCR on scanned PDFs before merging
func (s *AIService) OCRForMerge(ctx context.Context, pdfData []byte) (*OCRServiceResult, error) {
	// First try normal text extraction
	// If text is minimal, perform OCR
	return s.ExtractTextOCR(ctx, pdfData)
}

// Close cleans up resources (no-op for HTTP client)
func (s *AIService) Close() error {
	// HTTP client doesn't need explicit closing
	return nil
}

// Helper functions

func truncateText(text string, maxLen int) string {
	if len(text) <= maxLen {
		return text
	}
	return text[:maxLen] + "..."
}

func maskSensitiveValue(value, dataType string) string {
	switch dataType {
	case "email":
		parts := strings.Split(value, "@")
		if len(parts) == 2 {
			masked := string(parts[0][0]) + "***@" + parts[1]
			return masked
		}
	case "phone":
		if len(value) >= 4 {
			return "***-***-" + value[len(value)-4:]
		}
	case "ssn":
		return "***-**-" + value[len(value)-4:]
	case "credit_card":
		if len(value) >= 4 {
			return "****-****-****-" + value[len(value)-4:]
		}
	}
	
	// Default masking
	if len(value) <= 4 {
		return "****"
	}
	return value[:2] + strings.Repeat("*", len(value)-4) + value[len(value)-2:]
}

func extractJSONField(text, field string) string {
	// Simple extraction - in production use proper JSON parsing
	pattern := regexp.MustCompile(fmt.Sprintf(`"%s"\s*:\s*"([^"]*)"`, field))
	matches := pattern.FindStringSubmatch(text)
	if len(matches) >= 2 {
		return matches[1]
	}
	return ""
}

func extractJSONArray(text, field string) []string {
	// Simple extraction
	pattern := regexp.MustCompile(fmt.Sprintf(`"%s"\s*:\s*\[(.*?)\]`, field))
	matches := pattern.FindStringSubmatch(text)
	if len(matches) >= 2 {
		// Parse array items
		items := regexp.MustCompile(`"([^"]*)"`).FindAllStringSubmatch(matches[1], -1)
		var result []string
		for _, item := range items {
			if len(item) >= 2 {
				result = append(result, item[1])
			}
		}
		return result
	}
	return nil
}

func extractFindingsFromResponse(text string) []models.SensitiveDataFinding {
	var findings []models.SensitiveDataFinding
	
	// Simple regex-based extraction
	pattern := regexp.MustCompile(`"type"\s*:\s*"([^"]*)"\s*,\s*"value"\s*:\s*"([^"]*)"`)
	matches := pattern.FindAllStringSubmatch(text, -1)
	
	for _, m := range matches {
		if len(m) >= 3 {
			findings = append(findings, models.SensitiveDataFinding{
				Type:  m[1],
				Value: m[2],
			})
		}
	}
	
	return findings
}

func parseAutoFillSuggestions(text string, fields []string, userData map[string]string) []AutoFillSuggestion {
	var suggestions []AutoFillSuggestion
	
	// Try to extract from JSON response
	pattern := regexp.MustCompile(`"fieldName"\s*:\s*"([^"]*)"\s*,\s*"suggestedValue"\s*:\s*"([^"]*)"`)
	matches := pattern.FindAllStringSubmatch(text, -1)
	
	for _, m := range matches {
		if len(m) >= 3 {
			suggestions = append(suggestions, AutoFillSuggestion{
				FieldName:      m[1],
				SuggestedValue: m[2],
				Confidence:     0.8,
			})
		}
	}
	
	// Fallback: try simple matching
	if len(suggestions) == 0 {
		fieldMappings := map[string][]string{
			"name":    {"name", "full_name", "fullname"},
			"email":   {"email", "e-mail", "mail"},
			"phone":   {"phone", "telephone", "mobile"},
			"address": {"address", "street", "location"},
		}
		
		for _, field := range fields {
			fieldLower := strings.ToLower(field)
			for key, aliases := range fieldMappings {
				for _, alias := range aliases {
					if strings.Contains(fieldLower, alias) {
						if val, ok := userData[key]; ok {
							suggestions = append(suggestions, AutoFillSuggestion{
								FieldName:      field,
								SuggestedValue: val,
								Confidence:     0.7,
							})
							break
						}
					}
				}
			}
		}
	}
	
	return suggestions
}

// createTestImage creates a simple test image for OCR validation
func createTestImage(text string) ([]byte, error) {
	img := image.NewRGBA(image.Rect(0, 0, 200, 50))
	
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		return nil, err
	}
	
	return buf.Bytes(), nil
}
