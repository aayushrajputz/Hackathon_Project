package services

import (
	"context"
	"fmt"
	"time"

	"brainy-pdf/internal/config"
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
		// User exists, update and sync storage limit from config
		correctStorageLimit := config.GetStorageLimitForPlan(existingUser.Plan)
		
		update := bson.M{
			"$set": bson.M{
				"email":        email,
				"displayName":  displayName,
				"photoURL":     photoURL,
				"storageLimit": correctStorageLimit, // Sync storage limit from config
				"updatedAt":    time.Now(),
			},
		}
		_, err = collection.UpdateOne(ctx, filter, update)
		if err != nil {
			return nil, fmt.Errorf("failed to update user: %w", err)
		}

		existingUser.Email = email
		existingUser.DisplayName = displayName
		existingUser.PhotoURL = photoURL
		existingUser.StorageLimit = correctStorageLimit
		return &existingUser, nil
	}

	// Create new user with FREE plan defaults
	user := models.User{
		ID:           primitive.NewObjectID(),
		FirebaseUID:  firebaseUID,
		Email:        email,
		DisplayName:  displayName,
		PhotoURL:     photoURL,
		Plan:         "free",
		StorageUsed:  0,
		StorageLimit: config.GetStorageLimitForPlan("free"), // 10MB for free plan
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	_, err = collection.InsertOne(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return &user, nil
}

// GetUserByFirebaseUID retrieves a user by Firebase UID and ensures limits are synced
func (s *UserService) GetUserByFirebaseUID(ctx context.Context, firebaseUID string) (*models.User, error) {
	collection := s.mongoClient.Users()

	var user models.User
	err := collection.FindOne(ctx, bson.M{"firebaseUid": firebaseUID}).Decode(&user)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Sync storage limit if it doesn't match the current config for their plan
	correctLimit := config.GetStorageLimitForPlan(user.Plan)
	if user.StorageLimit != correctLimit {
		user.StorageLimit = correctLimit
		// Blocking update to ensure DB is fixed
		collection.UpdateOne(ctx, bson.M{"firebaseUid": firebaseUID}, bson.M{
			"$set": bson.M{"storageLimit": correctLimit, "updatedAt": time.Now()},
		})
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

	// Set storage limit based on plan from config
	storageLimit := config.GetStorageLimitForPlan(plan)
	if _, ok := config.Plans[plan]; !ok {
		plan = "free"
		storageLimit = config.GetStorageLimitForPlan("free")
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

// CheckLimit checks if a user has reached their plan limits for a specific feature
func (s *UserService) CheckLimit(ctx context.Context, firebaseUID string, feature string) (bool, error) {
	user, err := s.GetUserByFirebaseUID(ctx, firebaseUID)
	if err != nil {
		return false, err
	}

	// In real-world, we'd check if LastReset was > 30 days ago and reset counts here.

	limits, ok := config.Plans[user.Plan]
	if !ok {
		limits = config.Plans["free"]
	}

	switch feature {
	case "ai_chat":
		return user.AIChatCount < limits.AIChatsLimit, nil
	case "toolkit":
		return user.ToolkitCount < limits.ToolkitOpsLimit, nil
	case "sharing":
		// Count active links from shares collection
		count, _ := s.mongoClient.Collection("shares").CountDocuments(ctx, bson.M{"creatorId": firebaseUID, "expiresAt": bson.M{"$gt": time.Now()}})
		return int(count) < limits.MaxActiveLinks, nil
	}

	return true, nil
}

// IncrementCounter increments a feature counter for a user
func (s *UserService) IncrementCounter(ctx context.Context, firebaseUID string, feature string) error {
	collection := s.mongoClient.Users()
	var field string
	switch feature {
	case "ai_chat":
		field = "aiChatCount"
	case "toolkit":
		field = "toolkitCount"
	default:
		return nil
	}

	_, err := collection.UpdateOne(ctx, bson.M{"firebaseUid": firebaseUID}, bson.M{"$inc": bson.M{field: 1}})
	return err
}

// GetUserStats returns statistics for a user
func (s *UserService) GetUserStats(ctx context.Context, firebaseUID string) (map[string]int64, error) {
	// Aggregate from shares collection
	pipeline := []bson.M{
		{"$match": bson.M{"creatorId": firebaseUID}},
		{"$group": bson.M{
			"_id":             nil,
			"totalShared":     bson.M{"$sum": 1},
			"totalViews":      bson.M{"$sum": "$stats.views"},
			"totalDownloads":  bson.M{"$sum": "$stats.downloads"},
		}},
	}

	cursor, err := s.mongoClient.Collection("shares").Aggregate(ctx, pipeline)
	if err != nil {
		return nil, fmt.Errorf("failed to aggregate stats: %w", err)
	}
	defer cursor.Close(ctx)

	var result []struct {
		TotalShared    int64 `bson:"totalShared"`
		TotalViews     int64 `bson:"totalViews"`
		TotalDownloads int64 `bson:"totalDownloads"`
	}

	if err := cursor.All(ctx, &result); err != nil {
		return nil, fmt.Errorf("failed to decode stats: %w", err)
	}

	stats := map[string]int64{
		"totalShared":    0,
		"totalViews":     0,
		"totalDownloads": 0,
	}

	if len(result) > 0 {
		stats["totalShared"] = result[0].TotalShared
		stats["totalViews"] = result[0].TotalViews
		stats["totalDownloads"] = result[0].TotalDownloads
	}

	return stats, nil
}
