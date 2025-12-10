package mongodb

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

// Client wraps the MongoDB client
type Client struct {
	client   *mongo.Client
	database *mongo.Database
}

// Collections
const (
	CollectionUsers     = "users"
	CollectionDocuments = "documents"
	CollectionFolders   = "folders"
	CollectionAIResults = "ai_results"
)

// NewClient creates a new MongoDB client
func NewClient(uri, dbName string) (*Client, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOptions := options.Client().
		ApplyURI(uri).
		SetMaxPoolSize(50).
		SetMinPoolSize(5).
		SetMaxConnIdleTime(30 * time.Second)

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// Ping to verify connection
	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	log.Println("✅ Connected to MongoDB successfully")

	return &Client{
		client:   client,
		database: client.Database(dbName),
	}, nil
}

// GetCollection returns a collection by name
func (c *Client) GetCollection(name string) *mongo.Collection {
	return c.database.Collection(name)
}

// Collection is an alias for GetCollection
func (c *Client) Collection(name string) *mongo.Collection {
	return c.database.Collection(name)
}

// Users returns the users collection
func (c *Client) Users() *mongo.Collection {
	return c.GetCollection(CollectionUsers)
}

// Documents returns the documents collection
func (c *Client) Documents() *mongo.Collection {
	return c.GetCollection(CollectionDocuments)
}

// Folders returns the folders collection
func (c *Client) Folders() *mongo.Collection {
	return c.GetCollection(CollectionFolders)
}

// AIResults returns the AI results collection
func (c *Client) AIResults() *mongo.Collection {
	return c.GetCollection(CollectionAIResults)
}

// Close disconnects from MongoDB
func (c *Client) Close(ctx context.Context) error {
	return c.client.Disconnect(ctx)
}

// Database returns the underlying database
func (c *Client) Database() *mongo.Database {
	return c.database
}

// MongoClient returns the underlying mongo client
func (c *Client) MongoClient() *mongo.Client {
	return c.client
}
