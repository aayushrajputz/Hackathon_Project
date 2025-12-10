package handlers

import (
	"brainy-pdf/internal/middleware"
	"brainy-pdf/internal/services"
	"brainy-pdf/internal/utils"
	"github.com/gin-gonic/gin"
)

type NotificationHandler struct {
	notificationService *services.NotificationService
}

func NewNotificationHandler(service *services.NotificationService) *NotificationHandler {
	return &NotificationHandler{
		notificationService: service,
	}
}

// GetNotifications returns user's notifications
func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		utils.Unauthorized(c, "Unauthorized")
		return
	}

	limit := 50 // Default limit

	notifs, err := h.notificationService.GetUserNotifications(c.Request.Context(), userID, limit)
	if err != nil {
		utils.InternalServerError(c, "Failed to fetch notifications")
		return
	}

	utils.Success(c, gin.H{"notifications": notifs})
}

// MarkRead marks a notification as read
func (h *NotificationHandler) MarkRead(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		utils.Unauthorized(c, "Unauthorized")
		return
	}

	id := c.Param("id")
	if id == "" {
		utils.BadRequest(c, "Notification ID required")
		return
	}

	if err := h.notificationService.MarkAsRead(c.Request.Context(), id, userID); err != nil {
		utils.InternalServerError(c, "Failed to mark notification as read")
		return
	}

	utils.Success(c, gin.H{"status": "ok"})
}

// MarkAllRead marks all notifications as read
func (h *NotificationHandler) MarkAllRead(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		utils.Unauthorized(c, "Unauthorized")
		return
	}

	if err := h.notificationService.MarkAllAsRead(c.Request.Context(), userID); err != nil {
		utils.InternalServerError(c, "Failed to mark all as read")
		return
	}

	utils.Success(c, gin.H{"status": "ok"})
}

func (h *NotificationHandler) RegisterRoutes(r *gin.RouterGroup) {
	notifs := r.Group("/notifications")
	{
		notifs.GET("", h.GetNotifications)
		notifs.PATCH("/:id/read", h.MarkRead)
		notifs.POST("/read-all", h.MarkAllRead)
	}
}
