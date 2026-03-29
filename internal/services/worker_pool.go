package services

import (
	"context"
	"fmt"
	"log"
	"sync/atomic"
)

// WorkerPool limits concurrent PDF processing operations using a semaphore pattern.
// This prevents RAM/CPU exhaustion when many users submit PDF jobs simultaneously.
type WorkerPool struct {
	sem           chan struct{}
	maxWorkers    int
	activeWorkers int64
}

// NewWorkerPool creates a worker pool with the given concurrency limit.
// maxWorkers should be roughly equal to the number of CPU cores available.
func NewWorkerPool(maxWorkers int) *WorkerPool {
	if maxWorkers <= 0 {
		maxWorkers = 4
	}
	log.Printf("🔧 Worker pool initialized with %d max concurrent PDF workers", maxWorkers)
	return &WorkerPool{
		sem:        make(chan struct{}, maxWorkers),
		maxWorkers: maxWorkers,
	}
}

// Acquire blocks until a worker slot is available or the context is cancelled.
// Returns an error if the context deadline is exceeded (e.g., request timeout).
func (wp *WorkerPool) Acquire(ctx context.Context) error {
	select {
	case wp.sem <- struct{}{}:
		atomic.AddInt64(&wp.activeWorkers, 1)
		return nil
	case <-ctx.Done():
		return fmt.Errorf("server busy: all %d PDF workers occupied, please try again", wp.maxWorkers)
	}
}

// Release frees a worker slot back to the pool. Must be called after Acquire.
func (wp *WorkerPool) Release() {
	<-wp.sem
	atomic.AddInt64(&wp.activeWorkers, -1)
}

// ActiveWorkers returns the current number of active (busy) workers.
func (wp *WorkerPool) ActiveWorkers() int {
	return int(atomic.LoadInt64(&wp.activeWorkers))
}

// MaxWorkers returns the pool's concurrency limit.
func (wp *WorkerPool) MaxWorkers() int {
	return wp.maxWorkers
}
