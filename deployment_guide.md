# BinaryPDF Deployment Guide

## 1. Frontend (Vercel)

1.  Push this repository to **GitHub**.
2.  Go to **Vercel** -> **Add New Project**.
3.  Import the `Hackathon_Project` repository.
4.  **Framework Preset**: Next.js (Default).
5.  **Root Directory**: Click `Edit` and select `frontend`.
6.  **Environment Variables**:
    *   `NEXT_PUBLIC_API_URL`: The URL of your Render Backend (e.g., `https://binarypdf-backend.onrender.com/api/v1`)
    *   `NEXT_PUBLIC_FIREBASE_API_KEY`: Your Firebase config.
    *   ... (Add all other `NEXT_PUBLIC_` variables from `.env`).
7.  Click **Deploy**.

## 2. Backend & MinIO (Render)

1.  Go to **Render Dashboard** -> **Blueprints**.
2.  Click **New Blueprint Instance**.
3.  Connect your `Hackathon_Project` repository.
4.  Render will detect `render.yaml`.
5.  **Important**: It will ask you for values for `MONGODB_URI` and `OPENROUTER_API_KEY`. Enter them there.
6.  Click **Apply**.
7.  Render will automatically:
    *   Create a **Disk** for MinIO storage.
    *   Start the **MinIO** service.
    *   Build the **Backend** (installing Tesseract, LibreOffice, etc.).
    *   Link them together.

### Troubleshooting
*   **MinIO Connection**: The backend automatically finds MinIO using the internal reference in `render.yaml`.
*   **Persistent Data**: Files are stored on the Render Disk attached to the MinIO service.
