package handlers

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	razorpay "github.com/razorpay/razorpay-go"
	"brainy-pdf/internal/config"
	"brainy-pdf/internal/middleware"
	"brainy-pdf/internal/models"
	"brainy-pdf/internal/services"
)

type PaymentHandler struct {
	client              *razorpay.Client
	userService         *services.UserService
	notificationService *services.NotificationService
	cfg                 *config.Config
}

func NewPaymentHandler(cfg *config.Config, userService *services.UserService, notificationService *services.NotificationService) *PaymentHandler {
	client := razorpay.NewClient(cfg.RazorpayKeyID, cfg.RazorpayKeySecret)
	return &PaymentHandler{
		client:              client,
		userService:         userService,
		notificationService: notificationService,
		cfg:                 cfg,
	}
}

// CreateOrderRequest represents the request to create an order
type CreateOrderRequest struct {
	Plan string `json:"plan" binding:"required"` // pro, enterprise
}

// VerifyPaymentRequest represents the request to verify payment
type VerifyPaymentRequest struct {
	RazorpayPaymentID string `json:"razorpayPaymentId" binding:"required"`
	RazorpayOrderID   string `json:"razorpayOrderId" binding:"required"`
	RazorpaySignature string `json:"razorpaySignature" binding:"required"`
	Plan              string `json:"plan" binding:"required"`
}

// CreateOrder initiates a Razorpay order
func (h *PaymentHandler) CreateOrder(c *gin.Context) {
	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var amount int64 // Amount in paise
	switch req.Plan {
	case "pro":
		amount = 49900 // ₹499
	case "enterprise":
		amount = 299900 // ₹2999
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid plan"})
		return
	}

	// Shorten receipt ID to meet Razorpay 40 char limit
	shortUserID := userID
	if len(userID) > 6 {
		shortUserID = userID[len(userID)-6:]
	}
	receiptID := fmt.Sprintf("rcpt_%s_%d", shortUserID, time.Now().Unix())

	data := map[string]interface{}{
		"amount":          amount,
		"currency":        "INR",
		"receipt":         receiptID,
		"payment_capture": 1,
		"notes": map[string]interface{}{
			"userId": userID,
			"plan":   req.Plan,
		},
	}

	log.Printf("CreateOrder Request: Plan=%s, UserID=%s", req.Plan, userID)

	body, err := h.client.Order.Create(data, nil)
	if err != nil {
		log.Printf("[Payment Error] Razorpay Order Creation Failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order: " + err.Error()})
		return
	}
	
	log.Printf("[Payment] Razorpay Order Created: %v", body)

	// Razorpay Go SDK returns map[string]interface{}, extract ID
	orderID, ok := body["id"].(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid response from payment gateway"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"orderId": orderID,
			"amount":  amount,
			"keyId":   h.cfg.RazorpayKeyID,
		},
	})
}

// VerifyPayment verifies the signature and updates user plan
func (h *PaymentHandler) VerifyPayment(c *gin.Context) {
	var req VerifyPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userId, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Verify Signature
	// HMAC SHA256(order_id + "|" + payment_id, secret)
	data := req.RazorpayOrderID + "|" + req.RazorpayPaymentID
	hMToVerify := hmac.New(sha256.New, []byte(h.cfg.RazorpayKeySecret))
	hMToVerify.Write([]byte(data))
	expectedSignature := hex.EncodeToString(hMToVerify.Sum(nil))

	if expectedSignature != req.RazorpaySignature {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment signature"})
		return
	}

	// Signature valid, update user plan
	// We need to fetch the User Object ID from the Firebase UID (userId from middleware)
	// Or UpdatePlan works with whichever ID?
	// UserService.UpdatePlan takes userID (MongoDB Hex ID).
	// Middleware GetUserID usually returns Firebase UID depending on auth implementation.
	// Let's verify middleware implementation quickly or assume UserService can handle it.
	// Looking at user_service.go, UpdatePlan takes userID (Hex). CheckStorageLimit takes FirebaseUID.
	// We likely need to get MongoDB ID first.

	user, err := h.userService.GetUserByFirebaseUID(context.Background(), userId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}

	err = h.userService.UpdatePlan(context.Background(), user.ID.Hex(), req.Plan)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Payment verified but failed to update plan: " + err.Error()})
		return
	}

	// Send success notification
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		h.notificationService.CreateNotification(
			ctx,
			user.ID.Hex(),
			"Plan Upgraded!",
			fmt.Sprintf("You have successfully upgraded to the %s plan. Enjoy your new storage limits!", req.Plan),
			models.NotificationTypeInfo,
		)
	}()

	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *PaymentHandler) RegisterRoutes(router *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	payment := router.Group("/payment")
	payment.Use(authMiddleware)
	{
		payment.POST("/order", h.CreateOrder)
		payment.POST("/verify", h.VerifyPayment)
	}
}
