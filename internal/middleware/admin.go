package middleware

import (
	"brainy-pdf/internal/services"
	"brainy-pdf/internal/utils"
	"github.com/gin-gonic/gin"
)

// AdminMiddleware checks if the authenticated user has the admin role
func AdminMiddleware(userService *services.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := GetUserID(c)
		if !exists {
			utils.Unauthorized(c, "Authentication required")
			c.Abort()
			return
		}

		user, err := userService.GetUserByFirebaseUID(c.Request.Context(), userID)
		if err != nil {
			utils.Unauthorized(c, "User not found")
			c.Abort()
			return
		}

		if user.Role != "admin" {
			utils.Forbidden(c, "Admin access required")
			c.Abort()
			return
		}

		c.Next()
	}
}
