package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Share struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Code      string             `bson:"code" json:"code"`       // Unique 8-char code
	FileID    string             `bson:"fileId" json:"fileId"`   // ID of the file (can be library ID or temp ID)
	CreatorID string             `bson:"creatorId" json:"creatorId"`
	FileType  string             `bson:"fileType" json:"fileType"` // "library" or "temp"
	Filename  string             `bson:"filename" json:"filename"`
	Stats     ShareStats         `bson:"stats" json:"stats"`
	ExpiresAt time.Time          `bson:"expiresAt" json:"expiresAt"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
}

type ShareStats struct {
	Views     int       `bson:"views" json:"views"`
	Downloads int       `bson:"downloads" json:"downloads"`
	LastAccess time.Time `bson:"lastAccess" json:"lastAccess"`
}
