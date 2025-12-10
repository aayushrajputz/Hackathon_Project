package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// User represents a registered user
type User struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	FirebaseUID string             `bson:"firebaseUid" json:"firebaseUid"`
	Email       string             `bson:"email" json:"email"`
	DisplayName string             `bson:"displayName" json:"displayName"`
	PhotoURL    string             `bson:"photoURL" json:"photoURL"`
	Plan        string             `bson:"plan" json:"plan"` // free, pro, enterprise
	StorageUsed int64              `bson:"storageUsed" json:"storageUsed"`
	StorageLimit int64             `bson:"storageLimit" json:"storageLimit"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// Document represents a stored PDF document
type Document struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID       primitive.ObjectID `bson:"userId,omitempty" json:"userId"`
	Filename     string             `bson:"filename" json:"filename"`
	OriginalName string             `bson:"originalName" json:"originalName"`
	MimeType     string             `bson:"mimeType" json:"mimeType"`
	Size         int64              `bson:"size" json:"size"`
	MinIOPath    string             `bson:"minioPath" json:"minioPath"`
	FolderID     primitive.ObjectID `bson:"folderId,omitempty" json:"folderId,omitempty"`
	Metadata     DocumentMetadata   `bson:"metadata" json:"metadata"`
	IsTemporary  bool               `bson:"isTemporary" json:"isTemporary"`
	ExpiresAt    *time.Time         `bson:"expiresAt,omitempty" json:"expiresAt,omitempty"`
	CreatedAt    time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt    time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// DocumentMetadata holds PDF-specific metadata
type DocumentMetadata struct {
	PageCount int      `bson:"pageCount" json:"pageCount"`
	IsOCRd    bool     `bson:"isOCRd" json:"isOCRd"`
	AISummary string   `bson:"aiSummary,omitempty" json:"aiSummary,omitempty"`
	Tags      []string `bson:"tags,omitempty" json:"tags,omitempty"`
}

// Folder represents a user's folder in their library
type Folder struct {
	ID        primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	UserID    primitive.ObjectID  `bson:"userId" json:"userId"`
	Name      string              `bson:"name" json:"name"`
	ParentID  *primitive.ObjectID `bson:"parentId,omitempty" json:"parentId,omitempty"`
	CreatedAt time.Time           `bson:"createdAt" json:"createdAt"`
}

// AIResult stores AI processing results
type AIResult struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	DocumentID primitive.ObjectID `bson:"documentId" json:"documentId"`
	Type       string             `bson:"type" json:"type"` // ocr, summary, sensitive, search_index
	Result     interface{}        `bson:"result" json:"result"`
	CreatedAt  time.Time          `bson:"createdAt" json:"createdAt"`
}

// OCRResult represents OCR extraction results
type OCRResult struct {
	Text  string         `json:"text"`
	Pages []OCRPageResult `json:"pages"`
}

// OCRPageResult represents OCR results for a single page
type OCRPageResult struct {
	PageNumber int    `json:"pageNumber"`
	Text       string `json:"text"`
}

// SummaryResult represents AI summarization results
type SummaryResult struct {
	Summary   string   `json:"summary"`
	KeyPoints []string `json:"keyPoints"`
	Topics    []string `json:"topics"`
}

// SensitiveDataResult represents sensitive data detection results
type SensitiveDataResult struct {
	Findings []SensitiveDataFinding `json:"findings"`
	Total    int                    `json:"total"`
}

// SensitiveDataFinding represents a single sensitive data finding
type SensitiveDataFinding struct {
	Type     string `json:"type"`     // ssn, email, phone, credit_card, etc.
	Value    string `json:"value"`    // Masked value
	Page     int    `json:"page"`
	Location string `json:"location"` // Approximate location on page
}