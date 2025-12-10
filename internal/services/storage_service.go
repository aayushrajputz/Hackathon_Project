package services

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"time"

	"brainy-pdf/internal/models"
	minioPkg "brainy-pdf/pkg/minio"
	"brainy-pdf/pkg/mongodb"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// StorageService handles file storage operations
type StorageService struct {
	minioClient *minioPkg.Client
	mongoClient *mongodb.Client
	pdfService  *PDFService
	userService *UserService
	tempTTL     time.Duration
}

// NewStorageService creates a new storage service
// NewStorageService creates a new storage service
func NewStorageService(minioClient *minioPkg.Client, mongoClient *mongodb.Client, pdfService *PDFService, userService *UserService, tempTTLHours int) *StorageService {
	return &StorageService{
		minioClient: minioClient,
		mongoClient: mongoClient,
		pdfService:  pdfService,
		userService: userService,
		tempTTL:     time.Duration(tempTTLHours) * time.Hour,
	}
}

// UploadResult contains the result of an upload operation
type UploadResult struct {
	FileID      string                  `json:"fileId"`
	Filename    string                  `json:"filename"`
	Size        int64                   `json:"size"`
	ContentType string                  `json:"contentType"`
	URL         string                  `json:"url"`
	Metadata    models.DocumentMetadata `json:"metadata"`
	IsTemporary bool                    `json:"isTemporary"`
	ExpiresAt   *time.Time              `json:"expiresAt,omitempty"`
}

// UploadFile uploads a file and creates a document record
func (s *StorageService) UploadFile(ctx context.Context, userID, originalName, contentType string, reader io.Reader, size int64, isTemporary bool) (*UploadResult, error) {
	// Generate unique filename
	uniqueFilename := minioPkg.GenerateUniqueFilename(originalName)
	
	// Determine bucket and path
	var bucket, objectPath string
	var expiresAt *time.Time
	
    if isTemporary || userID == "" {
		bucket = s.minioClient.GetBucketTemp()
		sessionID := uuid.New().String()
		objectPath = fmt.Sprintf("%s/%s", sessionID, uniqueFilename)
		exp := time.Now().Add(s.tempTTL)
		expiresAt = &exp
	} else {
        // Enforce storage limit for authenticated users
        ok, err := s.userService.CheckStorageLimit(ctx, userID, size)
        if err != nil {
            return nil, fmt.Errorf("failed to check storage limit: %w", err)
        }
        if !ok {
            return nil, fmt.Errorf("storage limit exceeded. Please upgrade your plan")
        }

		bucket = s.minioClient.GetBucketUserFiles()
		objectPath = fmt.Sprintf("%s/library/%s", userID, uniqueFilename)
	}

	// Upload to MinIO
	if _, err := s.minioClient.UploadFile(ctx, bucket, objectPath, reader, size, contentType); err != nil {
		return nil, fmt.Errorf("failed to upload file: %w", err)
	}

	// Get PDF metadata if it's a PDF
	var metadata models.DocumentMetadata
	if contentType == "application/pdf" {
		// Download the file to get metadata
		data, err := s.minioClient.DownloadFile(ctx, bucket, objectPath)
		if err == nil {
			if pageCount, err := s.pdfService.GetPageCount(data); err == nil {
				metadata.PageCount = pageCount
			}
		}
	}

	// Create document record in MongoDB
	doc := models.Document{
		ID:           primitive.NewObjectID(),
		Filename:     uniqueFilename,
		OriginalName: originalName,
		MimeType:     contentType,
		Size:         size,
		MinIOPath:    fmt.Sprintf("%s/%s", bucket, objectPath),
		Metadata:     metadata,
		IsTemporary:  isTemporary || userID == "",
		ExpiresAt:    expiresAt,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Set user ID if authenticated
	if userID != "" {
		userObjID, err := primitive.ObjectIDFromHex(userID)
		if err == nil {
			doc.UserID = userObjID
		}
	}

	_, err := s.mongoClient.Documents().InsertOne(ctx, doc)
	if err != nil {
		// Try to clean up the uploaded file
		s.minioClient.DeleteFile(ctx, bucket, objectPath)
		return nil, fmt.Errorf("failed to create document record: %w", err)
	}

    // Generate download URL
	url, _ := s.minioClient.GetPresignedURL(ctx, bucket, objectPath, 1*time.Hour)

    if userID != "" && !doc.IsTemporary {
        // Update storage usage
        if err := s.userService.UpdateStorageUsed(ctx, userID, size); err != nil {
             fmt.Printf("Failed to update storage usage for user %s: %v\n", userID, err)
        }
    }

	return &UploadResult{
		FileID:      doc.ID.Hex(),
		Filename:    uniqueFilename,
		Size:        size,
		ContentType: contentType,
		URL:         url,
		Metadata:    metadata,
		IsTemporary: doc.IsTemporary,
		ExpiresAt:   expiresAt,
	}, nil
}

// UploadProcessedFile uploads a processed file (result of PDF operation)
func (s *StorageService) UploadProcessedFile(ctx context.Context, userID, originalName string, data []byte, sourceDocID string) (*UploadResult, error) {
	// Determine if user is authenticated
	isTemporary := userID == ""
	
	uniqueFilename := minioPkg.GenerateUniqueFilename(originalName)
	
	var bucket, objectPath string
	var expiresAt *time.Time
	
	if isTemporary {
		bucket = s.minioClient.GetBucketTemp()
		sessionID := uuid.New().String()
		objectPath = fmt.Sprintf("%s/processed/%s", sessionID, uniqueFilename)
		exp := time.Now().Add(s.tempTTL)
		expiresAt = &exp
	} else {
		// Enforce storage limit
		size := int64(len(data))
		ok, err := s.userService.CheckStorageLimit(ctx, userID, size)
		if err != nil {
			return nil, fmt.Errorf("failed to check storage limit: %w", err)
		}
		if !ok {
			return nil, fmt.Errorf("storage limit exceeded")
		}

		bucket = s.minioClient.GetBucketUserFiles()
		objectPath = fmt.Sprintf("%s/processed/%s", userID, uniqueFilename)
	}

	// Upload to MinIO
	if _, err := s.minioClient.UploadBytes(ctx, bucket, objectPath, data, "application/pdf"); err != nil {
		return nil, fmt.Errorf("failed to upload processed file: %w", err)
	}

	// Get page count
	var metadata models.DocumentMetadata
	if pageCount, err := s.pdfService.GetPageCount(data); err == nil {
		metadata.PageCount = pageCount
	}

	// Create document record
	doc := models.Document{
		ID:           primitive.NewObjectID(),
		Filename:     uniqueFilename,
		OriginalName: originalName,
		MimeType:     "application/pdf",
		Size:         int64(len(data)),
		MinIOPath:    fmt.Sprintf("%s/%s", bucket, objectPath),
		Metadata:     metadata,
		IsTemporary:  isTemporary,
		ExpiresAt:    expiresAt,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if userID != "" {
		userObjID, err := primitive.ObjectIDFromHex(userID)
		if err == nil {
			doc.UserID = userObjID
		}
	}

	_, err := s.mongoClient.Documents().InsertOne(ctx, doc)
	if err != nil {
		s.minioClient.DeleteFile(ctx, bucket, objectPath)
		return nil, fmt.Errorf("failed to create document record: %w", err)
	}

	url, _ := s.minioClient.GetPresignedURL(ctx, bucket, objectPath, 1*time.Hour)

    if !isTemporary {
        if err := s.userService.UpdateStorageUsed(ctx, userID, int64(len(data))); err != nil {
              fmt.Printf("Failed to update storage usage for user %s: %v\n", userID, err)
        }
    }

	return &UploadResult{
		FileID:      doc.ID.Hex(),
		Filename:    uniqueFilename,
		Size:        int64(len(data)),
		ContentType: "application/pdf",
		URL:         url,
		Metadata:    metadata,
		IsTemporary: isTemporary,
		ExpiresAt:   expiresAt,
	}, nil
}

// GetFile retrieves a file by ID
func (s *StorageService) GetFile(ctx context.Context, fileID string) (*models.Document, []byte, error) {
	objID, err := primitive.ObjectIDFromHex(fileID)
	if err != nil {
		return nil, nil, fmt.Errorf("invalid file ID: %w", err)
	}

	var doc models.Document
	err = s.mongoClient.Documents().FindOne(ctx, bson.M{"_id": objID}).Decode(&doc)
	if err != nil {
		return nil, nil, fmt.Errorf("file not found: %w", err)
	}

	// Parse MinIO path
	bucket, objectPath := parseMinIOPath(doc.MinIOPath)
	
	data, err := s.minioClient.DownloadFile(ctx, bucket, objectPath)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to download file: %w", err)
	}

	return &doc, data, nil
}

// GetFileMetadata retrieves file metadata by ID
func (s *StorageService) GetFileMetadata(ctx context.Context, fileID string) (*models.Document, error) {
	objID, err := primitive.ObjectIDFromHex(fileID)
	if err != nil {
		return nil, fmt.Errorf("invalid file ID: %w", err)
	}

	var doc models.Document
	err = s.mongoClient.Documents().FindOne(ctx, bson.M{"_id": objID}).Decode(&doc)
	if err != nil {
		return nil, fmt.Errorf("file not found: %w", err)
	}

	return &doc, nil
}

// DeleteFile deletes a file by ID
func (s *StorageService) DeleteFile(ctx context.Context, fileID, userID string) error {
	objID, err := primitive.ObjectIDFromHex(fileID)
	if err != nil {
		return fmt.Errorf("invalid file ID: %w", err)
	}

	// Build filter
	filter := bson.M{"_id": objID}
	if userID != "" {
		userObjID, err := primitive.ObjectIDFromHex(userID)
		if err == nil {
			filter["userId"] = userObjID
		}
	}

	var doc models.Document
	err = s.mongoClient.Documents().FindOne(ctx, filter).Decode(&doc)
	if err != nil {
		return fmt.Errorf("file not found or unauthorized: %w", err)
	}

	// Delete from MinIO
	bucket, objectPath := parseMinIOPath(doc.MinIOPath)
	if err := s.minioClient.DeleteFile(ctx, bucket, objectPath); err != nil {
		// Log but continue
		fmt.Printf("Warning: failed to delete from MinIO: %v\n", err)
	}

	// Delete from MongoDB
	_, err = s.mongoClient.Documents().DeleteOne(ctx, filter)
	if err != nil {
		return fmt.Errorf("failed to delete document record: %w", err)
	}

    // Update storage usage (decrement)
    if userID != "" {
        s.userService.UpdateStorageUsed(ctx, userID, -doc.Size)
    }

	return nil
}

// ListUserFiles lists files in a user's library
func (s *StorageService) ListUserFiles(ctx context.Context, userID string, folderID *string, page, limit int) ([]models.Document, int64, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid user ID: %w", err)
	}

	filter := bson.M{
		"userId":      userObjID,
		"isTemporary": false,
	}

	if folderID != nil && *folderID != "" {
		folderObjID, err := primitive.ObjectIDFromHex(*folderID)
		if err == nil {
			filter["folderId"] = folderObjID
		}
	} else {
		filter["folderId"] = bson.M{"$exists": false}
	}

	// Count total
	total, err := s.mongoClient.Documents().CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count documents: %w", err)
	}

	// Find with pagination
	opts := options.Find().
		SetSkip(int64((page - 1) * limit)).
		SetLimit(int64(limit)).
		SetSort(bson.M{"createdAt": -1})

	cursor, err := s.mongoClient.Documents().Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to find documents: %w", err)
	}
	defer cursor.Close(ctx)

	var docs []models.Document
	if err := cursor.All(ctx, &docs); err != nil {
		return nil, 0, fmt.Errorf("failed to decode documents: %w", err)
	}

	return docs, total, nil
}

// GetDownloadURL generates a presigned download URL
func (s *StorageService) GetDownloadURL(ctx context.Context, fileID string) (string, error) {
	doc, err := s.GetFileMetadata(ctx, fileID)
	if err != nil {
		return "", err
	}

	bucket, objectPath := parseMinIOPath(doc.MinIOPath)
	return s.minioClient.GetPresignedURL(ctx, bucket, objectPath, 1*time.Hour)
}

// CleanupExpiredFiles removes expired temporary files
func (s *StorageService) CleanupExpiredFiles(ctx context.Context) (int, error) {
	filter := bson.M{
		"isTemporary": true,
		"expiresAt":   bson.M{"$lt": time.Now()},
	}

	cursor, err := s.mongoClient.Documents().Find(ctx, filter)
	if err != nil {
		return 0, fmt.Errorf("failed to find expired documents: %w", err)
	}
	defer cursor.Close(ctx)

	var deleted int
	for cursor.Next(ctx) {
		var doc models.Document
		if err := cursor.Decode(&doc); err != nil {
			continue
		}

		// Delete from MinIO
		bucket, objectPath := parseMinIOPath(doc.MinIOPath)
		s.minioClient.DeleteFile(ctx, bucket, objectPath)

		// Delete from MongoDB
		s.mongoClient.Documents().DeleteOne(ctx, bson.M{"_id": doc.ID})
		deleted++
	}

	return deleted, nil
}

// Helper functions

func parseMinIOPath(path string) (bucket, objectPath string) {
	// Format: "bucket/path/to/file"
	idx := 0
	for i, c := range path {
		if c == '/' {
			idx = i
			break
		}
	}
	if idx > 0 {
		return path[:idx], path[idx+1:]
	}
	return path, ""
}

// GetFileExtension returns the file extension from a filename
func GetFileExtension(filename string) string {
	return filepath.Ext(filename)
}
