package handlers

import (
	"brainy-pdf/internal/middleware"
	"brainy-pdf/internal/services"
	"brainy-pdf/internal/utils"
	"brainy-pdf/pkg/firebase"
	"github.com/gin-gonic/gin"
)

// AuthHandler handles authentication endpoints
type AuthHandler struct {
	userService    *services.UserService
	firebaseClient *firebase.Client
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(userService *services.UserService, firebaseClient *firebase.Client) *AuthHandler {
	return &AuthHandler{
		userService:    userService,
		firebaseClient: firebaseClient,
	}
}

// GoogleAuth handles POST /api/v1/auth/google
// This endpoint receives the Firebase ID token from the frontend after Google OAuth
func (h *AuthHandler) GoogleAuth(c *gin.Context) {
	var request struct {
		IDToken string `json:"idToken" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		utils.BadRequest(c, "ID token required")
		return
	}

	// Verify the Firebase ID token
	token, err := h.firebaseClient.VerifyIDToken(c.Request.Context(), request.IDToken)
	if err != nil {
		utils.Unauthorized(c, "Invalid ID token")
		return
	}

	// Get user info from token claims
	email, _ := token.Claims["email"].(string)
	name, _ := token.Claims["name"].(string)
	picture, _ := token.Claims["picture"].(string)

	// Create or update user
	user, err := h.userService.CreateOrUpdateUser(c.Request.Context(), token.UID, email, name, picture)
	if err != nil {
		utils.InternalServerError(c, "Failed to create user")
		return
	}

	utils.Success(c, gin.H{
		"user": gin.H{
			"id":           user.ID.Hex(),
			"email":        user.Email,
			"displayName":  user.DisplayName,
			"photoURL":     user.PhotoURL,
			"plan":         user.Plan,
			"storageUsed":  user.StorageUsed,
			"storageLimit": user.StorageLimit,
		},
		"message": "Authentication successful",
	})
}

// GetMe handles GET /api/v1/auth/me
func (h *AuthHandler) GetMe(c *gin.Context) {
	firebaseUID, exists := middleware.GetUserID(c)
	if !exists {
		utils.Unauthorized(c, "Not authenticated")
		return
	}

	user, err := h.userService.GetUserByFirebaseUID(c.Request.Context(), firebaseUID)
	if err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	utils.Success(c, gin.H{
		"id":           user.ID.Hex(),
		"email":        user.Email,
		"displayName":  user.DisplayName,
		"photoURL":     user.PhotoURL,
		"plan":         user.Plan,
		"storageUsed":  user.StorageUsed,
		"storageLimit": user.StorageLimit,
		"createdAt":    user.CreatedAt,
	})
}

// Logout handles POST /api/v1/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	// With Firebase, logout is handled client-side
	// This endpoint can be used to clear any server-side session data if needed
	utils.Success(c, gin.H{
		"message": "Logged out successfully",
	})
}

// UpdateProfile handles PUT /api/v1/auth/profile
func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	firebaseUID, exists := middleware.GetUserID(c)
	if !exists {
		utils.Unauthorized(c, "Not authenticated")
		return
	}

	var request struct {
		DisplayName string `json:"displayName"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		utils.BadRequest(c, "Invalid request body")
		return
	}

	// Get existing user
	user, err := h.userService.GetUserByFirebaseUID(c.Request.Context(), firebaseUID)
	if err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	// Update user (using the existing CreateOrUpdate method)
	displayName := request.DisplayName
	if displayName == "" {
		displayName = user.DisplayName
	}

	updatedUser, err := h.userService.CreateOrUpdateUser(
		c.Request.Context(),
		firebaseUID,
		user.Email,
		displayName,
		user.PhotoURL,
	)
	if err != nil {
		utils.InternalServerError(c, "Failed to update profile")
		return
	}

	utils.Success(c, gin.H{
		"id":          updatedUser.ID.Hex(),
		"email":       updatedUser.Email,
		"displayName": updatedUser.DisplayName,
		"photoURL":    updatedUser.PhotoURL,
	})
}

// SyncStorage handles POST /api/v1/auth/sync-storage
func (h *AuthHandler) SyncStorage(c *gin.Context) {
	firebaseUID, exists := middleware.GetUserID(c)
	if !exists {
		utils.Unauthorized(c, "Not authenticated")
		return
	}

	user, err := h.userService.GetUserByFirebaseUID(c.Request.Context(), firebaseUID)
	if err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	if err := h.userService.RecalculateUserStorage(c.Request.Context(), firebaseUID); err != nil {
		utils.InternalServerError(c, "Failed to sync storage usage")
		return
	}

	// Get updated user to return fresh storage usage
	updatedUser, err := h.userService.GetUserByID(c.Request.Context(), user.ID.Hex())
	if err != nil {
		utils.InternalServerError(c, "Failed to fetch updated user")
		return
	}

	utils.Success(c, gin.H{
		"storageUsed": updatedUser.StorageUsed,
		"message":     "Storage usage synced successfully",
	})
}

// GetStats handles GET /api/v1/auth/stats
func (h *AuthHandler) GetStats(c *gin.Context) {
	firebaseUID, exists := middleware.GetUserID(c)
	if !exists {
		utils.Unauthorized(c, "Not authenticated")
		return
	}

	stats, err := h.userService.GetUserStats(c.Request.Context(), firebaseUID)
	if err != nil {
		utils.InternalServerError(c, "Failed to fetch user stats")
		return
	}

	utils.Success(c, stats)
}

// RegisterRoutes registers all auth routes
func (h *AuthHandler) RegisterRoutes(r *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	auth := r.Group("/auth")
	{
		// Public routes
		auth.POST("/google", h.GoogleAuth)

		// Protected routes
		auth.GET("/me", authMiddleware, h.GetMe)
		auth.POST("/logout", authMiddleware, h.Logout)
		auth.PUT("/profile", authMiddleware, h.UpdateProfile)
		auth.POST("/sync-storage", authMiddleware, h.SyncStorage)
		auth.GET("/stats", authMiddleware, h.GetStats)
	}
}
