package services

import (
	"archive/zip"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

// JobStatus represents the state of a conversion job
type JobStatus string

const (
	JobStatusQueued     JobStatus = "queued"
	JobStatusProcessing JobStatus = "processing"
	JobStatusCompleted  JobStatus = "completed"
	JobStatusFailed     JobStatus = "failed"
)

// ConversionJob represents a document conversion task
type ConversionJob struct {
	ID             string    `json:"id"`
	Status         JobStatus `json:"status"`
	InputFiles     []string  `json:"-"` // temp file paths
	OriginalNames  []string  `json:"originalNames"`
	OutputFormat   string    `json:"outputFormat"`
	ResultPath     string    `json:"-"` // path to result file or ZIP
	ResultFilename string    `json:"resultFilename"`
	Progress       int       `json:"progress"`
	ProcessedFiles int       `json:"processedFiles"`
	TotalFiles     int       `json:"totalFiles"`
	Error          string    `json:"error,omitempty"`
	CreatedAt      time.Time `json:"createdAt"`
	CompletedAt    time.Time `json:"completedAt,omitempty"`
}

// ConversionService handles document conversion using LibreOffice
type ConversionService struct {
	jobs       sync.Map
	jobQueue   chan string
	workerPool int
	tempDir    string
	outputDir  string
	wg         sync.WaitGroup
	ctx        context.Context
	cancel     context.CancelFunc
}

// NewConversionService creates a new conversion service
func NewConversionService(workerCount int) (*ConversionService, error) {
	tempDir := filepath.Join(os.TempDir(), "brainy-pdf-convert")
	outputDir := filepath.Join(tempDir, "output")

	// Create directories
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create temp dir: %w", err)
	}
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create output dir: %w", err)
	}

	ctx, cancel := context.WithCancel(context.Background())

	s := &ConversionService{
		jobQueue:   make(chan string, 100),
		workerPool: workerCount,
		tempDir:    tempDir,
		outputDir:  outputDir,
		ctx:        ctx,
		cancel:     cancel,
	}

	// Start worker pool
	for i := 0; i < workerCount; i++ {
		s.wg.Add(1)
		go s.worker(i)
	}

	fmt.Printf("[Conversion] Started %d workers, temp dir: %s\n", workerCount, tempDir)
	return s, nil
}

// Close shuts down the conversion service
func (s *ConversionService) Close() {
	s.cancel()
	close(s.jobQueue)
	s.wg.Wait()
}

// SubmitJob creates a new conversion job and returns the job ID
func (s *ConversionService) SubmitJob(inputFiles, originalNames []string, outputFormat string) (string, error) {
	jobID := uuid.New().String()

	job := &ConversionJob{
		ID:            jobID,
		Status:        JobStatusQueued,
		InputFiles:    inputFiles,
		OriginalNames: originalNames,
		OutputFormat:  strings.ToLower(outputFormat),
		TotalFiles:    len(inputFiles),
		CreatedAt:     time.Now(),
	}

	s.jobs.Store(jobID, job)

	// Queue the job
	select {
	case s.jobQueue <- jobID:
		fmt.Printf("[Conversion] Job %s queued with %d files\n", jobID, len(inputFiles))
	default:
		return "", fmt.Errorf("job queue is full")
	}

	return jobID, nil
}

// GetJob returns the current state of a job
func (s *ConversionService) GetJob(jobID string) (*ConversionJob, error) {
	val, ok := s.jobs.Load(jobID)
	if !ok {
		return nil, fmt.Errorf("job not found")
	}
	return val.(*ConversionJob), nil
}

// GetResultPath returns the path to the result file
func (s *ConversionService) GetResultPath(jobID string) (string, string, error) {
	job, err := s.GetJob(jobID)
	if err != nil {
		return "", "", err
	}
	if job.Status != JobStatusCompleted {
		return "", "", fmt.Errorf("job not completed")
	}
	return job.ResultPath, job.ResultFilename, nil
}

// worker processes jobs from the queue
func (s *ConversionService) worker(id int) {
	defer s.wg.Done()

	for {
		select {
		case <-s.ctx.Done():
			return
		case jobID, ok := <-s.jobQueue:
			if !ok {
				return
			}
			s.processJob(jobID)
		}
	}
}

// processJob handles the actual conversion
func (s *ConversionService) processJob(jobID string) {
	val, ok := s.jobs.Load(jobID)
	if !ok {
		return
	}
	job := val.(*ConversionJob)

	// Update status to processing
	job.Status = JobStatusProcessing
	s.jobs.Store(jobID, job)

	fmt.Printf("[Conversion] Processing job %s (%d files → %s)\n", jobID, job.TotalFiles, job.OutputFormat)

	// Create job output directory
	jobOutputDir := filepath.Join(s.outputDir, jobID)
	if err := os.MkdirAll(jobOutputDir, 0755); err != nil {
		s.failJob(job, fmt.Sprintf("Failed to create output dir: %v", err))
		return
	}

	var convertedFiles []string
	var convertedNames []string

	// Process each file
	for i, inputPath := range job.InputFiles {
		outputPath, err := s.convertFile(inputPath, jobOutputDir, job.OutputFormat)
		if err != nil {
			s.failJob(job, fmt.Sprintf("Failed to convert file %d: %v", i+1, err))
			s.cleanup(job.InputFiles, convertedFiles)
			return
		}

		convertedFiles = append(convertedFiles, outputPath)

		// Generate output filename from original name
		originalName := job.OriginalNames[i]
		ext := "." + job.OutputFormat
		baseName := strings.TrimSuffix(originalName, filepath.Ext(originalName))
		convertedNames = append(convertedNames, baseName+ext)

		// Update progress
		job.ProcessedFiles = i + 1
		job.Progress = ((i + 1) * 100) / job.TotalFiles
		s.jobs.Store(jobID, job)

		fmt.Printf("[Conversion] Job %s: %d/%d files completed\n", jobID, i+1, job.TotalFiles)
	}

	// If multiple files, create ZIP
	if len(convertedFiles) > 1 {
		zipPath := filepath.Join(jobOutputDir, "converted_files.zip")
		if err := s.createZip(zipPath, convertedFiles, convertedNames); err != nil {
			s.failJob(job, fmt.Sprintf("Failed to create ZIP: %v", err))
			s.cleanup(job.InputFiles, convertedFiles)
			return
		}
		job.ResultPath = zipPath
		job.ResultFilename = "converted_files.zip"
	} else if len(convertedFiles) == 1 {
		job.ResultPath = convertedFiles[0]
		job.ResultFilename = convertedNames[0]
	}

	// Cleanup input files
	for _, f := range job.InputFiles {
		os.Remove(f)
	}

	// Mark as completed
	job.Status = JobStatusCompleted
	job.Progress = 100
	job.CompletedAt = time.Now()
	s.jobs.Store(jobID, job)

	fmt.Printf("[Conversion] Job %s completed: %s\n", jobID, job.ResultFilename)
}

// convertFile converts a single file using LibreOffice
func (s *ConversionService) convertFile(inputPath, outputDir, outputFormat string) (string, error) {
	sofficePath := s.findSofficePath()
	if sofficePath == "" {
		return "", fmt.Errorf("LibreOffice (soffice) not found")
	}

	// Build command with robust flags
	args := []string{
		"--headless",
		"--invisible",
		"--nodefault",
		"--nolockcheck",
		"--nologo",
		"--norestore",
		"--convert-to", outputFormat,
		"--outdir", outputDir,
		inputPath,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	fmt.Printf("[Conversion] Executing: %s %v\n", sofficePath, args)

	cmd := exec.CommandContext(ctx, sofficePath, args...)
	cmd.Env = append(os.Environ(), "HOME="+s.tempDir) // LibreOffice needs HOME

	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("LibreOffice error: %v, output: %s", err, string(output))
	}
	// Log output even on success for debugging
	if len(output) > 0 {
		fmt.Printf("[Conversion] Output: %s\n", string(output))
	}

	// Find the output file
	baseName := strings.TrimSuffix(filepath.Base(inputPath), filepath.Ext(inputPath))
	outputPath := filepath.Join(outputDir, baseName+"."+outputFormat)

	if _, err := os.Stat(outputPath); os.IsNotExist(err) {
		return "", fmt.Errorf("output file not created: %s", outputPath)
	}

	return outputPath, nil
}

// findSofficePath locates the LibreOffice executable
func (s *ConversionService) findSofficePath() string {
	var paths []string

	switch runtime.GOOS {
	case "windows":
		paths = []string{
			`C:\Program Files\LibreOffice\program\soffice.exe`,
			`C:\Program Files (x86)\LibreOffice\program\soffice.exe`,
			`C:\Program Files\LibreOffice 7\program\soffice.exe`,
			`C:\Program Files\LibreOffice 24\program\soffice.exe`,
		}
	case "darwin":
		paths = []string{
			"/Applications/LibreOffice.app/Contents/MacOS/soffice",
		}
	default: // Linux
		paths = []string{
			"/usr/bin/soffice",
			"/usr/bin/libreoffice",
			"/opt/libreoffice/program/soffice",
			"/snap/bin/libreoffice",
		}
	}

	// Check each path
	for _, p := range paths {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}

	// Try PATH
	if path, err := exec.LookPath("soffice"); err == nil {
		return path
	}
	if path, err := exec.LookPath("libreoffice"); err == nil {
		return path
	}

	// Windows fallback: Try to find using 'where' command
	if runtime.GOOS == "windows" {
		cmd := exec.Command("where", "soffice")
		out, err := cmd.Output()
		if err == nil {
			lines := strings.Split(strings.TrimSpace(string(out)), "\n")
			if len(lines) > 0 {
				return strings.TrimSpace(lines[0])
			}
		}
		
		// Try looking in Program Files dynamically
		programFiles := os.Getenv("ProgramFiles")
		programFilesx86 := os.Getenv("ProgramFiles(x86)")
		
		dirs := []string{programFiles, programFilesx86}
		for _, dir := range dirs {
			if dir == "" {
				continue
			}
			entries, err := os.ReadDir(filepath.Join(dir))
			if err != nil {
				continue
			}
			for _, entry := range entries {
				if entry.IsDir() && strings.Contains(strings.ToLower(entry.Name()), "libreoffice") {
					candidate := filepath.Join(dir, entry.Name(), "program", "soffice.exe")
					if _, err := os.Stat(candidate); err == nil {
						return candidate
					}
				}
			}
		}
	}

	return ""
}

// createZip creates a ZIP archive from multiple files
func (s *ConversionService) createZip(zipPath string, files, names []string) error {
	zipFile, err := os.Create(zipPath)
	if err != nil {
		return err
	}
	defer zipFile.Close()

	zipWriter := zip.NewWriter(zipFile)
	defer zipWriter.Close()

	for i, filePath := range files {
		file, err := os.Open(filePath)
		if err != nil {
			return err
		}

		info, err := file.Stat()
		if err != nil {
			file.Close()
			return err
		}

		header, err := zip.FileInfoHeader(info)
		if err != nil {
			file.Close()
			return err
		}

		header.Name = names[i]
		header.Method = zip.Deflate

		writer, err := zipWriter.CreateHeader(header)
		if err != nil {
			file.Close()
			return err
		}

		_, err = io.Copy(writer, file)
		file.Close()
		if err != nil {
			return err
		}
	}

	return nil
}

// failJob marks a job as failed
func (s *ConversionService) failJob(job *ConversionJob, errMsg string) {
	job.Status = JobStatusFailed
	job.Error = errMsg
	job.CompletedAt = time.Now()
	s.jobs.Store(job.ID, job)
	fmt.Printf("[Conversion] Job %s failed: %s\n", job.ID, errMsg)
}

// cleanup removes temporary files
func (s *ConversionService) cleanup(inputFiles, outputFiles []string) {
	for _, f := range inputFiles {
		os.Remove(f)
	}
	for _, f := range outputFiles {
		os.Remove(f)
	}
}

// GetSupportedConversions returns valid input→output format mappings
func GetSupportedConversions() map[string][]string {
	return map[string][]string{
		"doc":  {"pdf", "docx", "odt"},
		"docx": {"pdf", "odt"},
		"odt":  {"pdf", "docx"},
		"ppt":  {"pdf"},
		"pptx": {"pdf"},
		"xls":  {"pdf"},
		"xlsx": {"pdf"},
	}
}

// IsValidConversion checks if input→output conversion is supported
func IsValidConversion(inputExt, outputFormat string) bool {
	inputExt = strings.ToLower(strings.TrimPrefix(inputExt, "."))
	outputFormat = strings.ToLower(outputFormat)

	supported := GetSupportedConversions()
	outputs, ok := supported[inputExt]
	if !ok {
		return false
	}

	for _, o := range outputs {
		if o == outputFormat {
			return true
		}
	}
	return false
}

// GetOutputFormats returns valid output formats for an input extension
func GetOutputFormats(inputExt string) []string {
	inputExt = strings.ToLower(strings.TrimPrefix(inputExt, "."))
	supported := GetSupportedConversions()
	return supported[inputExt]
}
