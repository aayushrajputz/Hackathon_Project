package services

import (
	"context"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func TestWorkerPool_ConcurrencyLimits(t *testing.T) {
	// Initialize a worker pool that can only handle 2 concurrent PDF jobs
	pool := NewWorkerPool(2)

	// We'll spawn 10 concurrent requests
	totalRequests := 10
	var wg sync.WaitGroup
	var successful, rejected int32

	for i := 0; i < totalRequests; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			// Fast timeout simulating real-world request timeout
			ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
			defer cancel()

			err := pool.Acquire(ctx)
			if err != nil {
				// Rejected due to timeout because pool was full
				atomic.AddInt32(&rejected, 1)
				return
			}
			defer pool.Release()

			// Simulate heavy PDF processing (100ms)
			// Because processing (100ms) > timeout (50ms), we expect only 2 jobs to succeed
			// and the other 8 to time out waiting for a slot.
			time.Sleep(100 * time.Millisecond)
			atomic.AddInt32(&successful, 1)
		}()
	}

	wg.Wait()

	if successful != 2 {
		t.Errorf("Expected exactly 2 successful jobs, got %d", successful)
	}
	if rejected != 8 {
		t.Errorf("Expected exactly 8 rejected jobs, got %d", rejected)
	}

	// Verify pool resets active workers back to 0
	if active := pool.ActiveWorkers(); active != 0 {
		t.Errorf("Expected 0 active workers at end, got %d", active)
	}
}
