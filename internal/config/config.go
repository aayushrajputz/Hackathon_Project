package config

import (
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds all application configuration
type Config struct {
	// Server
	Port    string
	GinMode string

	// MongoDB
	MongoDBURI      string
	MongoDBDatabase string

	// MinIO
	MinIOEndpoint       string
	MinIOAccessKey      string
	MinIOSecretKey      string
	MinIOUseSSL         bool
	MinIOBucketTemp     string
	MinIOBucketUserFiles string

	// Firebase
	FirebaseProjectID      string
	FirebaseCredentialsFile string

	// OpenRouter AI
	OpenRouterAPIKey string

	// Temporary files
	TempFileTTLHours int

	// CORS
	CORSAllowedOrigins []string

	// Share links
	ServerHost string
}

// Global config instance
var AppConfig *Config

// Load initializes configuration from environment variables
func Load() *Config {
	// Load .env file if it exists
	cwd, _ := os.Getwd()
	log.Printf("Current working directory: %s", cwd)
	if err := godotenv.Load(); err != nil {
		log.Printf("No .env file found in root. Checking /etc/secrets/.env...")
		// Fallback for Render Secret Files
		if err := godotenv.Load("/etc/secrets/.env"); err != nil {
			log.Printf("No .env file found in /etc/secrets/ or error loading it: %v", err)
		} else {
			log.Println("Successfully loaded .env from /etc/secrets/")
		}
	}

	config := &Config{
		// Server
		Port:    getEnv("PORT", "8080"),
		GinMode: getEnv("GIN_MODE", "debug"),

		// MongoDB
		MongoDBURI:      getEnv("MONGODB_URI", "mongodb://localhost:27017"),
		MongoDBDatabase: getEnv("MONGODB_DATABASE", "brainypdf"),

		// MinIO
		MinIOEndpoint:        getEnv("MINIO_ENDPOINT", "localhost:9000"),
		MinIOAccessKey:       getEnv("MINIO_ACCESS_KEY", "minioadmin"),
		MinIOSecretKey:       getEnv("MINIO_SECRET_KEY", "minioadmin"),
		MinIOUseSSL:          getEnvBool("MINIO_USE_SSL", false),
		MinIOBucketTemp:      getEnv("MINIO_BUCKET_TEMP", "temp"),
		MinIOBucketUserFiles: getEnv("MINIO_BUCKET_USER_FILES", "user-files"),

		// Firebase
		FirebaseProjectID:       getEnv("FIREBASE_PROJECT_ID", ""),
		FirebaseCredentialsFile: getEnv("FIREBASE_CREDENTIALS_FILE", "./firebase-credentials.json"),

		// OpenRouter AI
		OpenRouterAPIKey: getEnv("OPENROUTER_API_KEY", ""),

		// Temporary files
		TempFileTTLHours: getEnvInt("TEMP_FILE_TTL_HOURS", 2),

		// CORS
	}
	
	// CORS - Robust parsing with trimming
	rawOrigins := getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
	config.CORSAllowedOrigins = parseCORSOrigins(rawOrigins)

	// Share links - should point to frontend for /s/[code] route
	// Share links - should point to frontend for /s/[code] route
	config.ServerHost = getEnv("SERVER_HOST", "http://localhost:3000")

    // Fix common misconfiguration where SERVER_HOST is set to backend port
    if strings.Contains(config.ServerHost, ":8080") && config.Port == "8080" {
        log.Println("Warning: SERVER_HOST points to backend port 8080. Redirecting to 3000 for correct frontend sharing links.")
        config.ServerHost = strings.Replace(config.ServerHost, ":8080", ":3000", 1)
    }

	AppConfig = config
	return config
}

// Helper functions
func parseCORSOrigins(raw string) []string {
	parts := strings.Split(raw, ",")
	var cleaned []string
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			cleaned = append(cleaned, trimmed)
		}
	}
	return cleaned
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		parsed, err := strconv.ParseBool(value)
		if err != nil {
			return defaultValue
		}
		return parsed
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		parsed, err := strconv.Atoi(value)
		if err != nil {
			return defaultValue
		}
		return parsed
	}
	return defaultValue
}
