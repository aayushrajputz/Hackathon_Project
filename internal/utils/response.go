package utils

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// APIResponse is the standard response structure
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *APIError   `json:"error,omitempty"`
	Meta    *APIMeta    `json:"meta"`
}

// APIError represents an error response
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// APIMeta contains request metadata
type APIMeta struct {
	RequestID string    `json:"requestId"`
	Timestamp time.Time `json:"timestamp"`
}

// Success sends a successful response
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    data,
		Meta:    newMeta(),
	})
}

// SuccessWithStatus sends a successful response with custom status
func SuccessWithStatus(c *gin.Context, status int, data interface{}) {
	c.JSON(status, APIResponse{
		Success: true,
		Data:    data,
		Meta:    newMeta(),
	})
}

// Error sends an error response
func Error(c *gin.Context, status int, code, message string) {
	c.JSON(status, APIResponse{
		Success: false,
		Error: &APIError{
			Code:    code,
			Message: message,
		},
		Meta: newMeta(),
	})
}

// ErrorWithDetails sends an error response with additional details
func ErrorWithDetails(c *gin.Context, status int, code, message, details string) {
	c.JSON(status, APIResponse{
		Success: false,
		Error: &APIError{
			Code:    code,
			Message: message,
			Details: details,
		},
		Meta: newMeta(),
	})
}

// Common error responses
func BadRequest(c *gin.Context, message string) {
	Error(c, http.StatusBadRequest, "BAD_REQUEST", message)
}

func Unauthorized(c *gin.Context, message string) {
	Error(c, http.StatusUnauthorized, "UNAUTHORIZED", message)
}

func Forbidden(c *gin.Context, message string) {
	Error(c, http.StatusForbidden, "FORBIDDEN", message)
}

func NotFound(c *gin.Context, message string) {
	Error(c, http.StatusNotFound, "NOT_FOUND", message)
}

func InternalServerError(c *gin.Context, message string) {
	Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", message)
}

func Gone(c *gin.Context, message string) {
	Error(c, http.StatusGone, "GONE", message)
}

func ServiceUnavailable(c *gin.Context, message string) {
	Error(c, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", message)
}

func TooManyRequests(c *gin.Context, message string) {
	c.Header("Retry-After", "30") // Tell client to retry after 30 seconds
	Error(c, http.StatusTooManyRequests, "TOO_MANY_REQUESTS", message)
}

func GatewayTimeout(c *gin.Context, message string) {
	Error(c, http.StatusGatewayTimeout, "GATEWAY_TIMEOUT", message)
}

func newMeta() *APIMeta {
	return &APIMeta{
		RequestID: uuid.New().String(),
		Timestamp: time.Now().UTC(),
	}
}
