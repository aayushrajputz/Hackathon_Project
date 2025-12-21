package config

type PlanLimits struct {
	MaxFileSize     int64 // Max single file size in bytes
	StorageLimit    int64 // Total storage limit in bytes
	AIChatsLimit    int
	ToolkitOpsLimit int
	MaxActiveLinks  int
	RetentionDays   int
}

// Plans defines storage and feature limits for each subscription tier
// Based on pricing: Free, Student (₹99), Pro (₹299), Plus (₹699)
var Plans = map[string]PlanLimits{
	"free": {
		MaxFileSize:     10 * 1024 * 1024,  // 10 MB max file
		StorageLimit:    10 * 1024 * 1024,  // 10 MB total storage
		AIChatsLimit:    3,
		ToolkitOpsLimit: 5,
		MaxActiveLinks:  0,                 // No sharing for free
		RetentionDays:   1,
	},
	"student": {
		MaxFileSize:     25 * 1024 * 1024,  // 25 MB max file
		StorageLimit:    500 * 1024 * 1024, // 500 MB total storage
		AIChatsLimit:    20,
		ToolkitOpsLimit: 30,
		MaxActiveLinks:  5,
		RetentionDays:   7,
	},
	"pro": {
		MaxFileSize:     100 * 1024 * 1024,  // 100 MB max file
		StorageLimit:    2 * 1024 * 1024 * 1024, // 2 GB total storage
		AIChatsLimit:    200,
		ToolkitOpsLimit: 1000000, // Unlimited
		MaxActiveLinks:  50,
		RetentionDays:   30,
	},
	"plus": {
		MaxFileSize:     300 * 1024 * 1024,  // 300 MB max file
		StorageLimit:    10 * 1024 * 1024 * 1024, // 10 GB total storage
		AIChatsLimit:    1000000, // Unlimited
		ToolkitOpsLimit: 1000000,
		MaxActiveLinks:  1000000,
		RetentionDays:   180, // 6 months
	},
	"business": {
		MaxFileSize:     1024 * 1024 * 1024, // 1 GB max file
		StorageLimit:    50 * 1024 * 1024 * 1024, // 50 GB total storage
		AIChatsLimit:    1000000,
		ToolkitOpsLimit: 1000000,
		MaxActiveLinks:  1000000,
		RetentionDays:   365,
	},
}

// GetStorageLimitForPlan returns the storage limit in bytes for a given plan
func GetStorageLimitForPlan(plan string) int64 {
	if limits, ok := Plans[plan]; ok {
		return limits.StorageLimit
	}
	return Plans["free"].StorageLimit // Default to free
}

// GetMaxFileSizeForPlan returns the max file size in bytes for a given plan
func GetMaxFileSizeForPlan(plan string) int64 {
	if limits, ok := Plans[plan]; ok {
		return limits.MaxFileSize
	}
	return Plans["free"].MaxFileSize // Default to free
}
