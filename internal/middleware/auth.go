package middleware

import (
	"strings"

	"brainy-pdf/internal/utils"
	"brainy-pdf/pkg/firebase"
	"github.com/gin-gonic/gin"
)

// ContextKey type for context keys
type ContextKey string

const (
	// UserIDKey is the key for user ID in context
	UserIDKey ContextKey = "userId"
	// UserEmailKey is the key for user email in context
	UserEmailKey ContextKey = "userEmail"
)

// AuthMiddleware creates a Firebase authentication middleware
func AuthMiddleware(firebaseClient *firebase.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.Unauthorized(c, "Missing authorization header")
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			utils.Unauthorized(c, "Invalid authorization header format")
			c.Abort()
			return
		}

		idToken := parts[1]

		// Verify the token
		token, err := firebaseClient.VerifyIDToken(c.Request.Context(), idToken)
		if err != nil {
			utils.Unauthorized(c, "Invalid or expired token")
			c.Abort()
			return
		}

		// Set user info in context
		c.Set(string(UserIDKey), token.UID)
		if email, ok := token.Claims["email"].(string); ok {
			c.Set(string(UserEmailKey), email)
		}

		c.Next()
	}
}

// OptionalAuthMiddleware tries to authenticate but allows unauthenticated requests
func OptionalAuthMiddleware(firebaseClient *firebase.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.Next()
			return
		}

		idToken := parts[1]
		token, err := firebaseClient.VerifyIDToken(c.Request.Context(), idToken)
		if err != nil {
			c.Next()
			return
		}

		c.Set(string(UserIDKey), token.UID)
		if email, ok := token.Claims["email"].(string); ok {
			c.Set(string(UserEmailKey), email)
		}

		c.Next()
	}
}

// GetUserID extracts user ID from context
func GetUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get(string(UserIDKey))
	if !exists {
		return "", false
	}
	return userID.(string), true
}

// GetUserEmail extracts user email from context
func GetUserEmail(c *gin.Context) (string, bool) {
	email, exists := c.Get(string(UserEmailKey))
	if !exists {
		return "", false
	}
	return email.(string), true
}
