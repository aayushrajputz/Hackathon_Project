package handlers

import (
	"context"
	"net/http"
	"time"

	"brainy-pdf/internal/models"
	"brainy-pdf/internal/services"
	"brainy-pdf/pkg/mongodb"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

type AdminHandler struct {
	db          *mongodb.Client
	userService *services.UserService
}

func NewAdminHandler(db *mongodb.Client, userService *services.UserService) *AdminHandler {
	return &AdminHandler{
		db:          db,
		userService: userService,
	}
}

func (h *AdminHandler) RegisterRoutes(r *gin.RouterGroup, authMiddleware gin.HandlerFunc, adminMiddleware gin.HandlerFunc) {
	admin := r.Group("/admin")
	admin.Use(authMiddleware)
	admin.Use(adminMiddleware)
	{
		admin.GET("/stats", h.GetStats)
		admin.GET("/analytics", h.GetAnalytics)
		admin.GET("/health", h.GetSystemHealth)
		admin.GET("/users", h.ListUsers)
		admin.GET("/documents", h.ListDocuments)
		admin.POST("/users/:uid/role", h.UpdateUserRole)
		admin.POST("/users/:uid/plan", h.UpdateUserPlan)
	}
}

func (h *AdminHandler) GetStats(c *gin.Context) {
	ctx := context.Background()

	// 1. Total Users
	totalUsers, _ := h.db.Users().CountDocuments(ctx, bson.M{})

	// 2. Total Documents
	totalDocs, _ := h.db.Collection("documents").CountDocuments(ctx, bson.M{})

	// 3. Storage Analysis
	pipeline := []bson.M{
		{"$group": bson.M{
			"_id": nil,
			"totalStorage": bson.M{"$sum": "$storageUsed"},
		}},
	}
	cursor, _ := h.db.Users().Aggregate(ctx, pipeline)
	var storageResult []bson.M
	cursor.All(ctx, &storageResult)
	totalStorage := int64(0)
	if len(storageResult) > 0 {
		if val, ok := storageResult[0]["totalStorage"].(int64); ok {
			totalStorage = val
		}
	}

	// 4. Plan Distribution
	planPipeline := []bson.M{
		{"$group": bson.M{
			"_id":   "$plan",
			"count": bson.M{"$sum": 1},
		}},
	}
	cursor, _ = h.db.Users().Aggregate(ctx, planPipeline)
	var planStats []bson.M
	cursor.All(ctx, &planStats)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"totalUsers":   totalUsers,
			"totalDocs":    totalDocs,
			"totalStorage": totalStorage,
			"planStats":    planStats,
			"timestamp":    time.Now(),
		},
	})
}

func (h *AdminHandler) ListUsers(c *gin.Context) {
	ctx := context.Background()
	var users []models.User
	
	cursor, err := h.db.Users().Find(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	defer cursor.Close(ctx)
	cursor.All(ctx, &users)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    users,
	})
}

func (h *AdminHandler) ListDocuments(c *gin.Context) {
	ctx := context.Background()
	var docs []models.Document
	
	cursor, err := h.db.Collection("documents").Find(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch documents"})
		return
	}
	defer cursor.Close(ctx)
	cursor.All(ctx, &docs)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    docs,
	})
}

func (h *AdminHandler) UpdateUserRole(c *gin.Context) {
	uid := c.Param("uid")
	var req struct {
		Role string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, err := h.db.Users().UpdateOne(context.Background(), bson.M{"firebaseUid": uid}, bson.M{
		"$set": bson.M{"role": req.Role, "updatedAt": time.Now()},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Role updated"})
}

func (h *AdminHandler) UpdateUserPlan(c *gin.Context) {
	uid := c.Param("uid")
	var req struct {
		Plan string `json:"plan" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Fetch user to get MongoDB ID
	user, err := h.userService.GetUserByFirebaseUID(context.Background(), uid)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	err = h.userService.UpdatePlan(context.Background(), user.ID.Hex(), req.Plan)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update plan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Plan updated"})
}

func (h *AdminHandler) GetSystemHealth(c *gin.Context) {
	ctx := context.Background()

	// 1. MongoDB Ping
	dbStatus := "healthy"
	if err := h.db.MongoClient().Ping(ctx, nil); err != nil {
		dbStatus = "unhealthy"
	}

	// 2. Collection Stats
	usersCount, _ := h.db.Users().EstimatedDocumentCount(ctx)
	docsCount, _ := h.db.Collection("documents").EstimatedDocumentCount(ctx)
	sharesCount, _ := h.db.Collection("shares").EstimatedDocumentCount(ctx)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"mongo": dbStatus,
			"collections": gin.H{
				"users":     usersCount,
				"documents": docsCount,
				"shares":    sharesCount,
			},
			"serverTime": time.Now(),
		},
	})
}

func (h *AdminHandler) GetAnalytics(c *gin.Context) {
	ctx := context.Background()
	
	// Fetch user growth for last 7 days
	now := time.Now()
	sevenDaysAgo := now.AddDate(0, 0, -7)
	
	pipeline := []bson.M{
		{"$match": bson.M{
			"createdAt": bson.M{"$gte": sevenDaysAgo},
		}},
		{"$group": bson.M{
			"_id": bson.M{
				"$dateToString": bson.M{"format": "%Y-%m-%d", "date": "$createdAt"},
			},
			"count": bson.M{"$sum": 1},
		}},
		{"$sort": bson.M{"_id": 1}},
	}
	
	cursor, err := h.db.Users().Aggregate(ctx, pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch growth analytics"})
		return
	}
	var growthData []bson.M
	cursor.All(ctx, &growthData)
	
	// Static revenue data for now (since we don't have a payments collection yet, just user plans)
	revenueByPlan := []bson.M{
		{"plan": "student", "amount": 99},
		{"plan": "pro", "amount": 299},
		{"plan": "plus", "amount": 699},
		{"plan": "business", "amount": 1999},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"userGrowth": growthData,
			"revenueByPlan": revenueByPlan,
		},
	})
}

