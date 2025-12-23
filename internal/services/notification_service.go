package services

import (
	"context"
	"log"
	"time"

	"brainy-pdf/internal/models"
	"brainy-pdf/pkg/mongodb"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type NotificationService struct {
	mongoClient *mongodb.Client
}

func NewNotificationService(mongoClient *mongodb.Client) *NotificationService {
	return &NotificationService{
		mongoClient: mongoClient,
	}
}

// CreateNotification creates a new notification for a user
func (s *NotificationService) CreateNotification(ctx context.Context, userID, title, message string, notifType models.NotificationType) error {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	notification := models.Notification{
		ID:        primitive.NewObjectID(),
		UserID:    userObjID,
		Title:     title,
		Message:   message,
		Type:      notifType,
		Read:      false,
		CreatedAt: time.Now(),
	}

	_, err = s.mongoClient.Collection("notifications").InsertOne(ctx, notification)
	if err != nil {
		log.Printf("[Notification] Failed to insert notification: %v", err)
	} else {
		log.Printf("[Notification] Created notification for user %s: %s", userID, title)
	}
	return err
}

// GetUserNotifications retrieves unread and recent read notifications for a user
func (s *NotificationService) GetUserNotifications(ctx context.Context, userID string, limit int) ([]models.Notification, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	filter := bson.M{"userId": userObjID}
	
	// Sort by newest first
	opts := options.Find().SetSort(bson.M{"createdAt": -1}).SetLimit(int64(limit))

	cursor, err := s.mongoClient.Collection("notifications").Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var notifications []models.Notification
	if err := cursor.All(ctx, &notifications); err != nil {
		return nil, err
	}

	return notifications, nil
}

// MarkAsRead marks a single notification as read
func (s *NotificationService) MarkAsRead(ctx context.Context, notificationID string, userID string) error {
	notifObjID, err := primitive.ObjectIDFromHex(notificationID)
	if err != nil {
		return err
	}
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	filter := bson.M{
		"_id":    notifObjID,
		"userId": userObjID,
	}
	update := bson.M{"$set": bson.M{"read": true}}

	_, err = s.mongoClient.Collection("notifications").UpdateOne(ctx, filter, update)
	return err
}

// MarkAllAsRead marks all notifications for a user as read
func (s *NotificationService) MarkAllAsRead(ctx context.Context, userID string) error {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	filter := bson.M{
		"userId": userObjID,
		"read":   false,
	}
	update := bson.M{"$set": bson.M{"read": true}}

	_, err = s.mongoClient.Collection("notifications").UpdateMany(ctx, filter, update)
	return err
}

// DeleteNotification deletes a notification by ID for a specific user
func (s *NotificationService) DeleteNotification(ctx context.Context, notificationID string, userID string) error {
	notifObjID, err := primitive.ObjectIDFromHex(notificationID)
	if err != nil {
		return err
	}
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	filter := bson.M{
		"_id":    notifObjID,
		"userId": userObjID,
	}

	_, err = s.mongoClient.Collection("notifications").DeleteOne(ctx, filter)
	return err
}
