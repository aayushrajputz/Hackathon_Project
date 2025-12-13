package handlers

import (
	"brainy-pdf/internal/middleware"
	"brainy-pdf/internal/services"
	"brainy-pdf/internal/utils"
	"log"
	"github.com/gin-gonic/gin"
)

type NotificationHandler struct {
	notificationService *services.NotificationService
	userService         *services.UserService
}

func NewNotificationHandler(service *services.NotificationService, userService *services.UserService) *NotificationHandler {
	return &NotificationHandler{
		notificationService: service,
		userService:         userService,
	}
}

// GetNotifications returns user's notifications
func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	firebaseUID, exists := middleware.GetUserID(c)
	if !exists {
		log.Println("[NotificationHandler] ❌ 401: No UserID from middleware")
		utils.Unauthorized(c, "Unauthorized")
		return
	}

	log.Printf("[NotificationHandler] Fetching user for Firebase UID: %s", firebaseUID)
	user, err := h.userService.GetUserByFirebaseUID(c.Request.Context(), firebaseUID)
	if err != nil {
		log.Printf("[NotificationHandler] ❌ 401: User not found for UID %s. Error: %v", firebaseUID, err)
		utils.Unauthorized(c, "User not found")
		return
	}

	log.Printf("[NotificationHandler] ✅ User found: %s (Hex: %s). Fetching notifications...", user.Email, user.ID.Hex())

	limit := 50 // Default limit

	notifs, err := h.notificationService.GetUserNotifications(c.Request.Context(), user.ID.Hex(), limit)
	if err != nil {
		utils.InternalServerError(c, "Failed to fetch notifications")
		return
	}

	utils.Success(c, gin.H{"notifications": notifs})
}

// MarkRead marks a notification as read
func (h *NotificationHandler) MarkRead(c *gin.Context) {
	firebaseUID, exists := middleware.GetUserID(c)
	if !exists {
		utils.Unauthorized(c, "Unauthorized")
		return
	}

	user, err := h.userService.GetUserByFirebaseUID(c.Request.Context(), firebaseUID)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	id := c.Param("id")
	if id == "" {
		utils.BadRequest(c, "Notification ID required")
		return
	}

	if err := h.notificationService.MarkAsRead(c.Request.Context(), id, user.ID.Hex()); err != nil {
		utils.InternalServerError(c, "Failed to mark notification as read")
		return
	}

	utils.Success(c, gin.H{"status": "ok"})
}

// MarkAllRead marks all notifications as read
func (h *NotificationHandler) MarkAllRead(c *gin.Context) {
	firebaseUID, exists := middleware.GetUserID(c)
	if !exists {
		utils.Unauthorized(c, "Unauthorized")
		return
	}

	user, err := h.userService.GetUserByFirebaseUID(c.Request.Context(), firebaseUID)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	if err := h.notificationService.MarkAllAsRead(c.Request.Context(), user.ID.Hex()); err != nil {
		utils.InternalServerError(c, "Failed to mark all as read")
		return
	}

	utils.Success(c, gin.H{"status": "ok"})
}

func (h *NotificationHandler) RegisterRoutes(r *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	notifs := r.Group("/notifications")
	notifs.Use(authMiddleware)
	{
		notifs.GET("", h.GetNotifications)
		notifs.PATCH("/:id/read", h.MarkRead)
		notifs.POST("/read-all", h.MarkAllRead)
	}
}
