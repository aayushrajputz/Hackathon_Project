package services

import (
	"context"
	"fmt"
	"time"

	"brainy-pdf/internal/models"
	"brainy-pdf/pkg/mongodb"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// UserService handles user-related operations
type UserService struct {
	mongoClient *mongodb.Client
}

// NewUserService creates a new user service
func NewUserService(mongoClient *mongodb.Client) *UserService {
	return &UserService{mongoClient: mongoClient}
}

// CreateOrUpdateUser creates a new user or updates existing one after OAuth
func (s *UserService) CreateOrUpdateUser(ctx context.Context, firebaseUID, email, displayName, photoURL string) (*models.User, error) {
	collection := s.mongoClient.Users()

	// Check if user exists
	filter := bson.M{"firebaseUid": firebaseUID}
	var existingUser models.User
	err := collection.FindOne(ctx, filter).Decode(&existingUser)

	if err == nil {
		// User exists, update
		update := bson.M{
			"$set": bson.M{
				"email":       email,
				"displayName": displayName,
				"photoURL":    photoURL,
				"updatedAt":   time.Now(),
			},
		}
		_, err = collection.UpdateOne(ctx, filter, update)
		if err != nil {
			return nil, fmt.Errorf("failed to update user: %w", err)
		}

		existingUser.Email = email
		existingUser.DisplayName = displayName
		existingUser.PhotoURL = photoURL
		return &existingUser, nil
	}

	// Create new user
	user := models.User{
		ID:           primitive.NewObjectID(),
		FirebaseUID:  firebaseUID,
		Email:        email,
		DisplayName:  displayName,
		PhotoURL:     photoURL,
		Plan:         "free",
		StorageUsed:  0,
		StorageLimit: 100 * 1024 * 1024, // 100MB for free plan
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	_, err = collection.InsertOne(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return &user, nil
}

// GetUserByFirebaseUID retrieves a user by Firebase UID
func (s *UserService) GetUserByFirebaseUID(ctx context.Context, firebaseUID string) (*models.User, error) {
	collection := s.mongoClient.Users()

	var user models.User
	err := collection.FindOne(ctx, bson.M{"firebaseUid": firebaseUID}).Decode(&user)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return &user, nil
}

// GetUserByID retrieves a user by MongoDB ID
func (s *UserService) GetUserByID(ctx context.Context, userID string) (*models.User, error) {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	collection := s.mongoClient.Users()

	var user models.User
	err = collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return &user, nil
}

// UpdateStorageUsed updates the user's storage usage
func (s *UserService) UpdateStorageUsed(ctx context.Context, firebaseUID string, delta int64) error {
	collection := s.mongoClient.Users()

	update := bson.M{
		"$inc": bson.M{"storageUsed": delta},
		"$set": bson.M{"updatedAt": time.Now()},
	}

	_, err := collection.UpdateOne(ctx, bson.M{"firebaseUid": firebaseUID}, update)
	if err != nil {
		return fmt.Errorf("failed to update storage: %w", err)
	}

	return nil
}

// CheckStorageLimit checks if user has enough storage
func (s *UserService) CheckStorageLimit(ctx context.Context, firebaseUID string, fileSize int64) (bool, error) {
	user, err := s.GetUserByFirebaseUID(ctx, firebaseUID)
	if err != nil {
		return false, err
	}

	return user.StorageUsed+fileSize <= user.StorageLimit, nil
}

// UpdatePlan updates the user's subscription plan
func (s *UserService) UpdatePlan(ctx context.Context, userID, plan string) error {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	// Set storage limit based on plan
	var storageLimit int64
	switch plan {
	case "pro":
		storageLimit = 5 * 1024 * 1024 * 1024 // 5GB
	case "enterprise":
		storageLimit = 50 * 1024 * 1024 * 1024 // 50GB
	default:
		storageLimit = 100 * 1024 * 1024 // 100MB
		plan = "free"
	}

	collection := s.mongoClient.Users()

	update := bson.M{
		"$set": bson.M{
			"plan":         plan,
			"storageLimit": storageLimit,
			"updatedAt":    time.Now(),
		},
	}

	_, err = collection.UpdateOne(ctx, bson.M{"_id": objID}, update)
	if err != nil {
		return fmt.Errorf("failed to update plan: %w", err)
	}

	return nil
}

// RecalculateUserStorage recalculates and updates storage usage for a specific user by Firebase UID
func (s *UserService) RecalculateUserStorage(ctx context.Context, firebaseUID string) error {
	// Aggregate file sizes from library (library items use Firebase UID as userId)
	pipeline := []bson.M{
		{"$match": bson.M{"userId": firebaseUID}},
		{"$group": bson.M{
			"_id": nil,
			"totalSize": bson.M{"$sum": "$size"},
		}},
	}

	cursor, err := s.mongoClient.Collection("library").Aggregate(ctx, pipeline)
	if err != nil {
		return fmt.Errorf("failed to aggregate storage: %w", err)
	}
	defer cursor.Close(ctx)

	var result []struct {
		TotalSize int64 `bson:"totalSize"`
	}
	if err := cursor.All(ctx, &result); err != nil {
		return fmt.Errorf("failed to decode aggregation result: %w", err)
	}

	var totalSize int64
	if len(result) > 0 {
		totalSize = result[0].TotalSize
	}

	// Update user by Firebase UID
	update := bson.M{
		"$set": bson.M{
			"storageUsed": totalSize,
			"updatedAt":   time.Now(),
		},
	}

	_, err = s.mongoClient.Users().UpdateOne(ctx, bson.M{"firebaseUid": firebaseUID}, update)
	if err != nil {
		return fmt.Errorf("failed to update user storage: %w", err)
	}

	return nil
}
