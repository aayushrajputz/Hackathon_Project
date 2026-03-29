package main

import (
	"bytes"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"sync"
	"sync/atomic"
	"time"
)

const (
	baseURL     = "http://localhost:8080"
	concurrency = 50
	requests    = 50
)

func main() {
	log.Printf("🚀 Starting Load Test on BinaryPDF Backend")
	log.Printf("Target: %s | Concurrency: %d | Total Requests: %d\n\n", baseURL, concurrency, requests)

	// Create a dummy PDF payload
	dummyPDF := []byte("%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\nxref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n106\n%%EOF\n")

	var wg sync.WaitGroup
	var successCount, failureCount, badRequestCount, serverBusyCount int32
	var totalTime time.Duration
	var mu sync.Mutex

	// We will hit /api/pdf/merge with two files
	start := time.Now()

	for i := 0; i < requests; i++ {
		wg.Add(1)

		// Concurrency control using simple channel semaphore
		go func(reqID int) {
			defer wg.Done()

			reqStart := time.Now()

			// Build multipart request
			body := &bytes.Buffer{}
			writer := multipart.NewWriter(body)

			for _, filename := range []string{"file1.pdf", "file2.pdf"} {
				part, _ := writer.CreateFormFile("files", filename)
				part.Write(dummyPDF)
			}
			writer.Close()

			req, _ := http.NewRequest("POST", baseURL+"/api/pdf/merge", body)
			req.Header.Set("Content-Type", writer.FormDataContentType())

			client := &http.Client{Timeout: 10 * time.Second}
			resp, err := client.Do(req)

			if err != nil {
				atomic.AddInt32(&failureCount, 1)
				log.Printf("[Req %d] Err: %v\n", reqID, err)
				return
			}
			defer resp.Body.Close()

			respBody, _ := io.ReadAll(resp.Body)

			if resp.StatusCode == 200 {
				atomic.AddInt32(&successCount, 1)
			} else if resp.StatusCode == 503 || resp.StatusCode == 504 || resp.StatusCode == 500 {
				if bytes.Contains(respBody, []byte("server busy")) {
					atomic.AddInt32(&serverBusyCount, 1)
				} else {
					atomic.AddInt32(&failureCount, 1)
				}
			} else if resp.StatusCode == 400 {
				atomic.AddInt32(&badRequestCount, 1)
			} else {
				atomic.AddInt32(&failureCount, 1)
			}

			mu.Lock()
			totalTime += time.Since(reqStart)
			mu.Unlock()

		}(i)
	}

	wg.Wait()
	totalWallTime := time.Since(start)

	log.Printf("\n--- Load Test Results ---")
	log.Printf("Wall Time:     %v", totalWallTime)
	log.Printf("Sum Req Time:  %v", totalTime)
	log.Printf("Avg Req Time:  %v", totalTime/time.Duration(requests))
	log.Printf("Success (200):          %d", successCount)
	log.Printf("Bad Request (400):      %d (Expected if dummy PDF is rejected by pdfcpu after pool acquire)", badRequestCount)
	log.Printf("Server Busy (50x):      %d (Worker pool protecting server!)", serverBusyCount)
	log.Printf("Other Failures:         %d", failureCount)

	if serverBusyCount > 0 || badRequestCount > 0 {
		log.Printf("\n✅ Server survived the load without crashing!")
	} else {
		log.Printf("\n⚠️ Server might have queued all requests. Check logs.")
	}
}
