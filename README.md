# BinaryPDF - AI-Powered PDF Toolkit

A full-featured PDF toolkit with AI capabilities built with Go, Next.js, MongoDB, and MinIO.

## 🚀 Features

### PDF Operations
- **Merge** - Combine multiple PDFs into one
- **Split** - Divide PDF by page ranges
- **Rotate** - Rotate pages (90°, 180°, 270°)
- **Compress** - Reduce file size
- **Extract Pages** - Pull specific pages
- **Remove Pages** - Delete unwanted pages
- **Organize** - Reorder pages
- **Watermark** - Add text watermarks
- **Page Numbers** - Add page numbering
- **Crop** - Adjust page margins

### AI Features
- **OCR** - Extract text from scanned PDFs
- **Summarization** - AI-powered document summaries
- **Sensitive Data Detection** - Find PII (emails, phones, SSNs)
- **Smart Search** - Semantic search across documents
- **Auto-Fill** - Form field suggestions

## 🏗️ Architecture

```
binarypdf/
├── cmd/server/main.go       # Application entry point
├── internal/
│   ├── config/              # Configuration
│   ├── handlers/            # HTTP route handlers
│   ├── middleware/          # Auth, CORS middleware
│   ├── models/              # Data models
│   ├── services/            # Business logic
│   └── utils/               # Utilities
├── pkg/
│   ├── mongodb/             # MongoDB client
│   ├── minio/               # MinIO client
│   └── firebase/            # Firebase Auth client
├── frontend/                # Next.js frontend
├── docker-compose.yml       # Docker orchestration
└── Dockerfile               # Backend container
```

## 🛠️ Tech Stack

- **Backend**: Go 1.21 + Gin
- **Frontend**: Next.js 14 + Tailwind CSS
- **Database**: MongoDB 7.0
- **Storage**: MinIO (S3-compatible)
- **Auth**: Firebase Authentication
- **AI**: Google Gemini API + Tesseract OCR

## 📦 Prerequisites

- Docker & Docker Compose
- Go 1.21+ (for local development)
- Node.js 18+ (for frontend development)
- Firebase project (for authentication)
- Gemini API key (for AI features)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
cd binarypdf

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# - FIREBASE_PROJECT_ID
# - GEMINI_API_KEY
# - NEXT_PUBLIC_FIREBASE_API_KEY
# - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
```

### 2. Add Firebase Credentials

Download your Firebase service account JSON from Firebase Console and save as:
```
firebase-credentials.json
```

### 3. Start with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin123)

## 🔧 Local Development

### Backend

```bash
# Install dependencies
go mod download

# Run locally (requires MongoDB & MinIO)
go run cmd/server/main.go
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/google` | Google OAuth login |
| GET | `/api/v1/auth/me` | Get current user |
| POST | `/api/v1/auth/logout` | Logout |

### PDF Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/pdf/merge` | Merge PDFs |
| POST | `/api/v1/pdf/split` | Split PDF |
| POST | `/api/v1/pdf/rotate` | Rotate pages |
| POST | `/api/v1/pdf/compress` | Compress PDF |
| POST | `/api/v1/pdf/extract-pages` | Extract pages |
| POST | `/api/v1/pdf/remove-pages` | Remove pages |
| POST | `/api/v1/pdf/organize` | Reorder pages |
| POST | `/api/v1/pdf/watermark` | Add watermark |
| POST | `/api/v1/pdf/page-numbers` | Add page numbers |
| POST | `/api/v1/pdf/crop` | Crop pages |

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ai/ocr` | OCR text extraction |
| POST | `/api/v1/ai/summarize` | PDF summarization |
| POST | `/api/v1/ai/detect-sensitive` | Detect PII |
| POST | `/api/v1/ai/mask-sensitive` | Mask sensitive data |
| POST | `/api/v1/ai/auto-fill` | Form auto-fill |
| POST | `/api/v1/ai/search` | Smart search |

### File Storage
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/files/upload` | Upload file |
| GET | `/api/v1/files/:id` | Get file info |
| GET | `/api/v1/files/:id/download` | Download file |
| DELETE | `/api/v1/files/:id` | Delete file |
| GET | `/api/v1/library` | List user files |

## 📝 Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 8080) |
| `MONGODB_URI` | MongoDB connection string |
| `MINIO_ENDPOINT` | MinIO server endpoint |
| `MINIO_ACCESS_KEY` | MinIO access key |
| `MINIO_SECRET_KEY` | MinIO secret key |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `GEMINI_API_KEY` | Google Gemini API key |
| `TEMP_FILE_TTL_HOURS` | Temp file expiration (default: 2) |

## 🔒 Security

- Firebase JWT authentication
- CORS protection
- File type validation
- Temporary file auto-cleanup
- Input sanitization

## 📄 License

MIT License - see LICENSE file for details.
