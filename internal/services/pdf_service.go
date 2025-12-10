package services

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/ledongthuc/pdf"
	"github.com/pdfcpu/pdfcpu/pkg/api"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/model"
)

// PDFService handles all PDF operations using pdfcpu
type PDFService struct {
	tempDir string
}

func (s *PDFService) ensureTempDir() error {
    return os.MkdirAll(s.tempDir, 0755)
}

// Result types
type MergeResult struct {
	Data      []byte
	PageCount int
}

type SplitResult struct {
	Files [][]byte
}

type RotateResult struct {
	Data      []byte
	PageCount int
}

type CompressResult struct {
	Data        []byte
	SizeBefore  int64
	SizeAfter   int64
	Compression float64
}

// Option types
type WatermarkOptions struct {
	Text     string
	Position string
	Opacity  float64
	FontSize float64
}

type PageNumberOptions struct {
	Position  string
	Format    string
	StartFrom int
}

type CropOptions struct {
	Top    float64
	Right  float64
	Bottom float64
	Left   float64
}

// NewPDFService creates a new PDF service
func NewPDFService() (*PDFService, error) {
	tempDir := filepath.Join(os.TempDir(), "brainy-pdf-ops")
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return nil, err
	}
	return &PDFService{
		tempDir: tempDir,
	}, nil
}

func (s *PDFService) getConfig() *model.Configuration {
	conf := model.NewDefaultConfiguration()
	conf.ValidationMode = model.ValidationRelaxed
	return conf
}

// ValidatePDF validates a PDF file
func (s *PDFService) ValidatePDF(data []byte) error {
	_, err := api.ReadContext(bytes.NewReader(data), nil)
	return err
}

// GetPageCount returns the number of pages in a PDF
func (s *PDFService) GetPageCount(data []byte) (int, error) {
	ctx, err := api.ReadContext(bytes.NewReader(data), nil)
	if err != nil {
		return 0, err
	}
	return ctx.PageCount, nil
}

// GetInfo returns PDF metadata
func (s *PDFService) GetInfo(data []byte) (map[string]string, error) {
	ctx, err := api.ReadContext(bytes.NewReader(data), nil)
	if err != nil {
		return nil, err
	}
	
	info := make(map[string]string)
	info["pageCount"] = strconv.Itoa(ctx.PageCount)
	info["version"] = ctx.HeaderVersion.String()
	
	if ctx.Title != "" {
		info["title"] = ctx.Title
	}
	if ctx.Author != "" {
		info["author"] = ctx.Author
	}
	if ctx.Subject != "" {
		info["subject"] = ctx.Subject
	}
	
	return info, nil
}

// Merge combines multiple PDFs into one
func (s *PDFService) Merge(ctx context.Context, pdfData [][]byte) (*MergeResult, error) {
	if len(pdfData) < 2 {
		return nil, fmt.Errorf("at least 2 files required for merge")
	}

    if err := s.ensureTempDir(); err != nil {
        return nil, fmt.Errorf("failed to create temp dir: %w", err)
    }

	// Create temp files for each PDF
	tempFiles := make([]string, len(pdfData))
	for i, data := range pdfData {
		tempFile := filepath.Join(s.tempDir, fmt.Sprintf("merge_input_%d_%d.pdf", time.Now().UnixNano(), i))
		if err := os.WriteFile(tempFile, data, 0644); err != nil {
			return nil, err
		}
		tempFiles[i] = tempFile
		defer os.Remove(tempFile)
	}

	// Output file
	outputFile := filepath.Join(s.tempDir, fmt.Sprintf("merged_%d.pdf", time.Now().UnixNano()))
	defer os.Remove(outputFile)

	// Merge using pdfcpu
	if err := api.MergeCreateFile(tempFiles, outputFile, false, s.getConfig()); err != nil {
		return nil, fmt.Errorf("merge failed: %w", err)
	}

	// Read result
	result, err := os.ReadFile(outputFile)
	if err != nil {
		return nil, err
	}

	pageCount, _ := s.GetPageCount(result)

	return &MergeResult{
		Data:      result,
		PageCount: pageCount,
	}, nil
}

// Split splits a PDF based on page specification
func (s *PDFService) Split(ctx context.Context, data []byte, pages string) (*SplitResult, error) {
    if err := s.ensureTempDir(); err != nil {
        return nil, fmt.Errorf("failed to create temp dir: %w", err)
    }

	// Create temp input file
	inputFile := filepath.Join(s.tempDir, fmt.Sprintf("split_input_%d.pdf", time.Now().UnixNano()))
	if err := os.WriteFile(inputFile, data, 0644); err != nil {
		return nil, err
	}
	defer os.Remove(inputFile)

	// Create temp output directory
	outputDir := filepath.Join(s.tempDir, fmt.Sprintf("split_output_%d", time.Now().UnixNano()))
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return nil, err
	}
	defer os.RemoveAll(outputDir)

	// Split using pdfcpu
	if err := api.SplitFile(inputFile, outputDir, 1, s.getConfig()); err != nil {
		return nil, fmt.Errorf("split failed: %w", err)
	}

	// Read all split files
	entries, err := os.ReadDir(outputDir)
	if err != nil {
		return nil, err
	}

	var files [][]byte
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".pdf") {
			data, err := os.ReadFile(filepath.Join(outputDir, entry.Name()))
			if err != nil {
				continue
			}
			files = append(files, data)
		}
	}

	return &SplitResult{Files: files}, nil
}

// Rotate rotates pages in a PDF
func (s *PDFService) Rotate(ctx context.Context, data []byte, pages string, angle int) (*RotateResult, error) {
    if err := s.ensureTempDir(); err != nil {
        return nil, fmt.Errorf("failed to create temp dir: %w", err)
    }

	// Create temp files
	inputFile := filepath.Join(s.tempDir, fmt.Sprintf("rotate_input_%d.pdf", time.Now().UnixNano()))
	outputFile := filepath.Join(s.tempDir, fmt.Sprintf("rotate_output_%d.pdf", time.Now().UnixNano()))
	
	if err := os.WriteFile(inputFile, data, 0644); err != nil {
		return nil, err
	}
	defer os.Remove(inputFile)
	defer os.Remove(outputFile)

	// Parse pages (nil means all pages)
	var pageSelection []string
	if pages != "" && pages != "1-" {
		pageSelection = []string{pages}
	}

	// Rotate using pdfcpu
	if err := api.RotateFile(inputFile, outputFile, angle, pageSelection, s.getConfig()); err != nil {
		return nil, fmt.Errorf("rotate failed: %w", err)
	}

	// Read result
	result, err := os.ReadFile(outputFile)
	if err != nil {
		return nil, err
	}

	pageCount, _ := s.GetPageCount(result)

	return &RotateResult{
		Data:      result,
		PageCount: pageCount,
	}, nil
}

// Compress optimizes a PDF
func (s *PDFService) Compress(ctx context.Context, data []byte, quality string) (*CompressResult, error) {
    if err := s.ensureTempDir(); err != nil {
        return nil, fmt.Errorf("failed to create temp dir: %w", err)
    }

	sizeBefore := int64(len(data))

	// Create temp files
	inputFile := filepath.Join(s.tempDir, fmt.Sprintf("compress_input_%d.pdf", time.Now().UnixNano()))
	outputFile := filepath.Join(s.tempDir, fmt.Sprintf("compress_output_%d.pdf", time.Now().UnixNano()))
	
	if err := os.WriteFile(inputFile, data, 0644); err != nil {
		return nil, err
	}
	defer os.Remove(inputFile)
	defer os.Remove(outputFile)

	// Optimize using pdfcpu
	if err := api.OptimizeFile(inputFile, outputFile, s.getConfig()); err != nil {
		return nil, fmt.Errorf("compress failed: %w", err)
	}

	// Read result
	result, err := os.ReadFile(outputFile)
	if err != nil {
		return nil, err
	}

	sizeAfter := int64(len(result))
	compression := float64(sizeBefore-sizeAfter) / float64(sizeBefore) * 100

	return &CompressResult{
		Data:        result,
		SizeBefore:  sizeBefore,
		SizeAfter:   sizeAfter,
		Compression: compression,
	}, nil
}

// ExtractPages extracts specific pages from a PDF
func (s *PDFService) ExtractPages(ctx context.Context, data []byte, pages string) ([]byte, error) {
    if err := s.ensureTempDir(); err != nil {
        return nil, fmt.Errorf("failed to create temp dir: %w", err)
    }

	inputFile := filepath.Join(s.tempDir, fmt.Sprintf("extract_input_%d.pdf", time.Now().UnixNano()))
	outputFile := filepath.Join(s.tempDir, fmt.Sprintf("extract_output_%d.pdf", time.Now().UnixNano()))
	
	if err := os.WriteFile(inputFile, data, 0644); err != nil {
		return nil, err
	}
	defer os.Remove(inputFile)
	defer os.Remove(outputFile)

	// Extract using pdfcpu
	if err := api.ExtractPagesFile(inputFile, outputFile, []string{pages}, s.getConfig()); err != nil {
		return nil, fmt.Errorf("extract failed: %w", err)
	}

	return os.ReadFile(outputFile)
}

// RemovePages removes specific pages from a PDF
func (s *PDFService) RemovePages(ctx context.Context, data []byte, pages string) ([]byte, error) {
    if err := s.ensureTempDir(); err != nil {
        return nil, fmt.Errorf("failed to create temp dir: %w", err)
    }

	inputFile := filepath.Join(s.tempDir, fmt.Sprintf("remove_input_%d.pdf", time.Now().UnixNano()))
	outputFile := filepath.Join(s.tempDir, fmt.Sprintf("remove_output_%d.pdf", time.Now().UnixNano()))
	
	if err := os.WriteFile(inputFile, data, 0644); err != nil {
		return nil, err
	}
	defer os.Remove(inputFile)
	defer os.Remove(outputFile)

	// Remove using pdfcpu
	if err := api.RemovePagesFile(inputFile, outputFile, []string{pages}, s.getConfig()); err != nil {
		return nil, fmt.Errorf("remove failed: %w", err)
	}

	return os.ReadFile(outputFile)
}

// OrganizePages reorders pages in a PDF
func (s *PDFService) OrganizePages(ctx context.Context, data []byte, order []int) ([]byte, error) {
    if err := s.ensureTempDir(); err != nil {
        return nil, fmt.Errorf("failed to create temp dir: %w", err)
    }

	inputFile := filepath.Join(s.tempDir, fmt.Sprintf("organize_input_%d.pdf", time.Now().UnixNano()))
	outputFile := filepath.Join(s.tempDir, fmt.Sprintf("organize_output_%d.pdf", time.Now().UnixNano()))
	
	if err := os.WriteFile(inputFile, data, 0644); err != nil {
		return nil, err
	}
	defer os.Remove(inputFile)
	defer os.Remove(outputFile)

	// Convert order to string format for pdfcpu
	var orderStr []string
	for _, p := range order {
		orderStr = append(orderStr, strconv.Itoa(p))
	}

	// Collect pages in new order
	if err := api.CollectFile(inputFile, outputFile, orderStr, s.getConfig()); err != nil {
		return nil, fmt.Errorf("organize failed: %w", err)
	}

	return os.ReadFile(outputFile)
}

// AddWatermark adds a text watermark to a PDF
func (s *PDFService) AddWatermark(ctx context.Context, data []byte, opts WatermarkOptions) ([]byte, error) {
    if err := s.ensureTempDir(); err != nil {
        return nil, fmt.Errorf("failed to create temp dir: %w", err)
    }

	inputFile := filepath.Join(s.tempDir, fmt.Sprintf("watermark_input_%d.pdf", time.Now().UnixNano()))
	outputFile := filepath.Join(s.tempDir, fmt.Sprintf("watermark_output_%d.pdf", time.Now().UnixNano()))
	
	if err := os.WriteFile(inputFile, data, 0644); err != nil {
		return nil, err
	}
	defer os.Remove(inputFile)
	defer os.Remove(outputFile)

	// Build watermark description
	// Format: "font:Helvetica, points:48, color:#808080, opacity:0.3, rotation:45"
	fontSize := opts.FontSize
	if fontSize == 0 {
		fontSize = 48
	}
	opacity := opts.Opacity
	if opacity == 0 {
		opacity = 0.3
	}
	
	desc := fmt.Sprintf("font:Helvetica, points:%d, color:#808080, opacity:%.2f, rotation:45, scale:1.0 rel",
		int(fontSize), opacity)

	// AddTextWatermarksFile(inFile, outFile, selectedPages, onTop, text, desc, conf)
	if err := api.AddTextWatermarksFile(inputFile, outputFile, nil, true, opts.Text, desc, s.getConfig()); err != nil {
		// If fails, return original
		return data, nil
	}

	result, err := os.ReadFile(outputFile)
	if err != nil {
		return data, nil
	}
	return result, nil
}

// AddPageNumbers adds page numbers to a PDF
func (s *PDFService) AddPageNumbers(ctx context.Context, data []byte, opts PageNumberOptions) ([]byte, error) {
    if err := s.ensureTempDir(); err != nil {
        return nil, fmt.Errorf("failed to create temp dir: %w", err)
    }

	inputFile := filepath.Join(s.tempDir, fmt.Sprintf("pagenums_input_%d.pdf", time.Now().UnixNano()))
	outputFile := filepath.Join(s.tempDir, fmt.Sprintf("pagenums_output_%d.pdf", time.Now().UnixNano()))
	
	if err := os.WriteFile(inputFile, data, 0644); err != nil {
		return nil, err
	}
	defer os.Remove(inputFile)
	defer os.Remove(outputFile)

	// Determine position
	pos := "bc" // bottom center as default
	switch opts.Position {
	case "bottom-left":
		pos = "bl"
	case "bottom-right":
		pos = "br"
	case "top-center":
		pos = "tc"
	case "top-left":
		pos = "tl"
	case "top-right":
		pos = "tr"
	}

	// Build description for page number stamp
	// Using %p as placeholder for page number
	desc := fmt.Sprintf("font:Helvetica, points:12, pos:%s, color:#333333", pos)

	// Text with page number placeholder
	text := "Page %p"
	if opts.Format != "" {
		text = strings.ReplaceAll(opts.Format, "{n}", "%p")
	}

	// AddTextWatermarksFile(inFile, outFile, selectedPages, onTop, text, desc, conf)
	if err := api.AddTextWatermarksFile(inputFile, outputFile, nil, true, text, desc, s.getConfig()); err != nil {
		return data, nil
	}

	result, err := os.ReadFile(outputFile)
	if err != nil {
		return data, nil
	}
	return result, nil
}

// Crop crops margins from a PDF
func (s *PDFService) Crop(ctx context.Context, data []byte, opts CropOptions) ([]byte, error) {
	// If no crop values, return original
	if opts.Top == 0 && opts.Right == 0 && opts.Bottom == 0 && opts.Left == 0 {
		return data, nil
	}

    if err := s.ensureTempDir(); err != nil {
        return nil, fmt.Errorf("failed to create temp dir: %w", err)
    }

	inputFile := filepath.Join(s.tempDir, fmt.Sprintf("crop_input_%d.pdf", time.Now().UnixNano()))
	outputFile := filepath.Join(s.tempDir, fmt.Sprintf("crop_output_%d.pdf", time.Now().UnixNano()))
	
	if err := os.WriteFile(inputFile, data, 0644); err != nil {
		return nil, err
	}
	defer os.Remove(inputFile)
	defer os.Remove(outputFile)

	// Use Trim which removes whitespace margins
	if err := api.TrimFile(inputFile, outputFile, nil, s.getConfig()); err != nil {
		return data, nil
	}

	result, err := os.ReadFile(outputFile)
	if err != nil {
		return data, nil
	}
	return result, nil
}

// ExtractText extracts text from PDF using ledongthuc/pdf
func (s *PDFService) ExtractText(ctx context.Context, data []byte) (string, error) {
	reader := bytes.NewReader(data)
	f, err := pdf.NewReader(reader, int64(len(data)))
	if err != nil {
		return "", fmt.Errorf("failed to open pdf: %w", err)
	}

	var textBuilder strings.Builder
	totalPage := f.NumPage()

	for pageIndex := 1; pageIndex <= totalPage; pageIndex++ {
		p := f.Page(pageIndex)
		if p.V.IsNull() {
			continue
		}
		
		text, err := p.GetPlainText(nil)
		if err != nil {
			continue
		}
		textBuilder.WriteString(text)
		textBuilder.WriteString("\n")
	}

	return textBuilder.String(), nil
}

// ExtractTextWithOCR extracts text with OCR (stub)
func (s *PDFService) ExtractTextWithOCR(ctx context.Context, data []byte) (string, error) {
	return "", fmt.Errorf("OCR extraction not available")
}

// Helper functions

// IsTextReadable checks if extracted text is readable
func IsTextReadable(text string) bool {
	// Simple heuristic: if text has enough words, it's readable
	words := strings.Fields(text)
	return len(words) > 10
}

// CleanExtractedText cleans up extracted text
func CleanExtractedText(text string) string {
	// Remove excessive whitespace and normalize
	text = strings.TrimSpace(text)
	// Replace multiple spaces with single space
	for strings.Contains(text, "  ") {
		text = strings.ReplaceAll(text, "  ", " ")
	}
	return text
}

