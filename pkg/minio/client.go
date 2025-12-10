package minio

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// Client wraps the MinIO client
type Client struct {
	client          *minio.Client
	bucketTemp      string
	bucketUserFiles string
}

// NewClient creates a new MinIO client
func NewClient(endpoint, accessKey, secretKey string, useSSL bool, bucketTemp, bucketUserFiles string) (*Client, error) {
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create MinIO client: %w", err)
	}

	c := &Client{
		client:          client,
		bucketTemp:      bucketTemp,
		bucketUserFiles: bucketUserFiles,
	}

	// Ensure buckets exist
	ctx := context.Background()
	if err := c.ensureBucket(ctx, bucketTemp); err != nil {
		return nil, err
	}
	if err := c.ensureBucket(ctx, bucketUserFiles); err != nil {
		return nil, err
	}

	log.Println("✅ Connected to MinIO successfully")
	return c, nil
}

// ensureBucket creates a bucket if it doesn't exist
func (c *Client) ensureBucket(ctx context.Context, bucket string) error {
	exists, err := c.client.BucketExists(ctx, bucket)
	if err != nil {
		return fmt.Errorf("failed to check bucket %s: %w", bucket, err)
	}
	if !exists {
		err = c.client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{})
		if err != nil {
			return fmt.Errorf("failed to create bucket %s: %w", bucket, err)
		}
		log.Printf("📦 Created bucket: %s", bucket)
	}
	return nil
}

// UploadFile uploads a file to MinIO
func (c *Client) UploadFile(ctx context.Context, bucket, objectPath string, reader io.Reader, size int64, contentType string) (string, error) {
	_, err := c.client.PutObject(ctx, bucket, objectPath, reader, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload file: %w", err)
	}
	return objectPath, nil
}

// UploadBytes uploads bytes to MinIO
func (c *Client) UploadBytes(ctx context.Context, bucket, objectPath string, data []byte, contentType string) (string, error) {
	reader := bytes.NewReader(data)
	return c.UploadFile(ctx, bucket, objectPath, reader, int64(len(data)), contentType)
}

// UploadTempFile uploads a file to temporary storage with auto-generated path
func (c *Client) UploadTempFile(ctx context.Context, sessionID, filename string, reader io.Reader, size int64, contentType string) (string, error) {
	objectPath := fmt.Sprintf("%s/%s_%s", sessionID, uuid.New().String(), filename)
	return c.UploadFile(ctx, c.bucketTemp, objectPath, reader, size, contentType)
}

// UploadUserFile uploads a file to user's persistent storage
func (c *Client) UploadUserFile(ctx context.Context, userID, folder, filename string, reader io.Reader, size int64, contentType string) (string, error) {
	objectPath := fmt.Sprintf("%s/%s/%s_%s", userID, folder, uuid.New().String(), filename)
	return c.UploadFile(ctx, c.bucketUserFiles, objectPath, reader, size, contentType)
}

// DownloadFile downloads a file from MinIO
func (c *Client) DownloadFile(ctx context.Context, bucket, objectPath string) ([]byte, error) {
	obj, err := c.client.GetObject(ctx, bucket, objectPath, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get object: %w", err)
	}
	defer obj.Close()

	data, err := io.ReadAll(obj)
	if err != nil {
		return nil, fmt.Errorf("failed to read object: %w", err)
	}
	return data, nil
}

// GetObject returns a reader for the object
func (c *Client) GetObject(ctx context.Context, bucket, objectPath string) (*minio.Object, error) {
	return c.client.GetObject(ctx, bucket, objectPath, minio.GetObjectOptions{})
}

// DeleteFile deletes a file from MinIO
func (c *Client) DeleteFile(ctx context.Context, bucket, objectPath string) error {
	return c.client.RemoveObject(ctx, bucket, objectPath, minio.RemoveObjectOptions{})
}

// GetPresignedURL generates a presigned URL for downloading
func (c *Client) GetPresignedURL(ctx context.Context, bucket, objectPath string, expires time.Duration) (string, error) {
	url, err := c.client.PresignedGetObject(ctx, bucket, objectPath, expires, nil)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}
	return url.String(), nil
}

// GetFileInfo returns file metadata
func (c *Client) GetFileInfo(ctx context.Context, bucket, objectPath string) (minio.ObjectInfo, error) {
	return c.client.StatObject(ctx, bucket, objectPath, minio.StatObjectOptions{})
}

// MoveFile moves a file from one location to another
func (c *Client) MoveFile(ctx context.Context, srcBucket, srcPath, destBucket, destPath string) error {
	// Copy to destination
	_, err := c.client.CopyObject(ctx,
		minio.CopyDestOptions{Bucket: destBucket, Object: destPath},
		minio.CopySrcOptions{Bucket: srcBucket, Object: srcPath},
	)
	if err != nil {
		return fmt.Errorf("failed to copy file: %w", err)
	}

	// Delete source
	if err := c.DeleteFile(ctx, srcBucket, srcPath); err != nil {
		return fmt.Errorf("failed to delete source file: %w", err)
	}

	return nil
}

// GetBucketTemp returns the temp bucket name
func (c *Client) GetBucketTemp() string {
	return c.bucketTemp
}

// GetBucketUserFiles returns the user files bucket name
func (c *Client) GetBucketUserFiles() string {
	return c.bucketUserFiles
}

// GenerateUniqueFilename generates a unique filename
func GenerateUniqueFilename(originalName string) string {
	ext := filepath.Ext(originalName)
	return fmt.Sprintf("%s%s", uuid.New().String(), ext)
}
