package middleware

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// TimeoutMiddleware wraps the request context with a timeout.
// This prevents slow PDF processing requests from hanging the server indefinitely.
func TimeoutMiddleware(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Create a context that is both cancelled when the client disconnects (c.Request.Context())
		// AND cancelled if the deadline is exceeded.
		ctx, cancel := context.WithTimeout(c.Request.Context(), timeout)
		defer cancel()

		// Replace the request's context
		c.Request = c.Request.WithContext(ctx)

		// Create a channel to wait for the handler to finish
		done := make(chan struct{})

		// Run the handler in a goroutine
		go func() {
			c.Next()
			close(done)
		}()

		select {
		case <-done:
			// Handler finished normally
		case <-ctx.Done():
			// Timeout or client disconnected
			err := ctx.Err()
			if err == context.DeadlineExceeded {
				c.AbortWithStatusJSON(http.StatusGatewayTimeout, gin.H{
					"error": "request timed out: PDF operation took too long",
				})
			}
			// If context.Canceled (client disconnected), Gin already handles it to some degree,
			// but we abort the chain anyway.
			c.Abort()
		}
	}
}
