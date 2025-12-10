package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// NotificationType defines the type of notification
type NotificationType string

const (
	NotificationTypeInfo    NotificationType = "info"
	NotificationTypeSuccess NotificationType = "success"
	NotificationTypeWarning NotificationType = "warning"
	NotificationTypeError   NotificationType = "error"
)

// Notification represents a user notification
type Notification struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    primitive.ObjectID `bson:"userId" json:"userId"`
	Title     string             `bson:"title" json:"title"`
	Message   string             `bson:"message" json:"message"`
	Type      NotificationType   `bson:"type" json:"type"`
	Read      bool               `bson:"read" json:"read"`
	Link      string             `bson:"link,omitempty" json:"link,omitempty"` // Optional link to resource
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
}
