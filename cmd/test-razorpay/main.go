package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	razorpay "github.com/razorpay/razorpay-go"
)

func main() {
	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: Error loading .env file: %v", err)
	}

	keyID := os.Getenv("RAZORPAY_KEY_ID")
	keySecret := os.Getenv("RAZORPAY_KEY_SECRET")

	fmt.Printf("Testing Razorpay Config:\n")
	fmt.Printf("Key ID: %s\n", mask(keyID))
	fmt.Printf("Key Secret: %s\n", mask(keySecret))

	if keyID == "" || keySecret == "" {
		log.Fatal("❌ Error: Missing credentials in .env")
	}

	client := razorpay.NewClient(keyID, keySecret)

	data := map[string]interface{}{
		"amount":          100, // ₹1.00
		"currency":        "INR",
		"receipt":         "test_receipt_001",
		"payment_capture": 1,
	}

	fmt.Println("Attempting to create test order...")
	body, err := client.Order.Create(data, nil)
	if err != nil {
		log.Fatalf("❌ Razorpay Error: %v", err)
	}

	fmt.Printf("✅ Success! Order Created.\nOrder ID: %v\n", body["id"])
}

func mask(s string) string {
	if len(s) < 4 {
		return "****"
	}
	return s[:2] + "****" + s[len(s)-2:]
}
