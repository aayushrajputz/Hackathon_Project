import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// API response types
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: {
        code: string;
        message: string;
    };
    meta: {
        requestId: string;
        timestamp: string;
    };
}

// Auth API
export const authApi = {
    googleAuth: (idToken: string) =>
        api.post<ApiResponse<{ user: any }>>('/auth/google', { idToken }),

    getMe: () => api.get<ApiResponse<any>>('/auth/me'),

    logout: () => api.post('/auth/logout'),

    syncStorage: () => api.post<ApiResponse<any>>('/auth/sync-storage'),
};

// PDF API
export const pdfApi = {
    merge: (files: File[]) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        return api.post<ApiResponse<any>>('/pdf/merge', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    split: (file: File, pages: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('pages', pages);
        return api.post<ApiResponse<any>>('/pdf/split', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    rotate: (file: File, pages: string, angle: number) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('pages', pages);
        formData.append('angle', angle.toString());
        return api.post<ApiResponse<any>>('/pdf/rotate', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    compress: (file: File, quality: string = 'medium') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('quality', quality);
        return api.post<ApiResponse<any>>('/pdf/compress', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    extractPages: (file: File, pages: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('pages', pages);
        return api.post<ApiResponse<any>>('/pdf/extract-pages', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    removePages: (file: File, pages: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('pages', pages);
        return api.post<ApiResponse<any>>('/pdf/remove-pages', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    organize: (file: File, order: number[]) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('order', order.join(','));
        return api.post<ApiResponse<any>>('/pdf/organize', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    watermark: (file: File, text: string, position?: string, opacity?: number) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('text', text);
        if (position) formData.append('position', position);
        if (opacity) formData.append('opacity', opacity.toString());
        return api.post<ApiResponse<any>>('/pdf/watermark', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    pageNumbers: (file: File, position?: string, format?: string, startFrom?: number) => {
        const formData = new FormData();
        formData.append('file', file);
        if (position) formData.append('position', position);
        if (format) formData.append('format', format);
        if (startFrom) formData.append('startFrom', startFrom.toString());
        return api.post<ApiResponse<any>>('/pdf/page-numbers', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    crop: (file: File, margins: { top: number; right: number; bottom: number; left: number }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('top', margins.top.toString());
        formData.append('right', margins.right.toString());
        formData.append('bottom', margins.bottom.toString());
        formData.append('left', margins.left.toString());
        return api.post<ApiResponse<any>>('/pdf/crop', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

// AI API - longer timeout for AI processing
export const aiApi = {
    ocr: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<ApiResponse<any>>('/ai/ocr', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 90000, // 90 seconds for OCR
        });
    },

    summarize: (file: File, length: string = 'medium') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('length', length);
        return api.post<ApiResponse<any>>('/ai/summarize', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 90000, // 90 seconds for AI summarization
        });
    },

    detectSensitive: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<ApiResponse<any>>('/ai/detect-sensitive', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 90000, // 90 seconds for AI processing
        });
    },

    maskSensitive: (file: File, types: string[]) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('types', types.join(','));
        return api.post<ApiResponse<any>>('/ai/mask-sensitive', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 90000, // 90 seconds for AI processing
        });
    },

    search: (query: string, documents?: string[], fileIds?: string[]) =>
        api.post<ApiResponse<any>>('/ai/search', { query, documents, fileIds }, { timeout: 60000 }),

    chat: (text: string, question: string, history: any[]) =>
        api.post<ApiResponse<any>>('/ai/chat', { text, question, history }, { timeout: 60000 }),
};

// Files API
export const filesApi = {
    upload: (file: File, temporary: boolean = false) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('temporary', temporary.toString());
        return api.post<ApiResponse<any>>('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    getFile: (id: string) => api.get<ApiResponse<any>>(`/files/${id}`),

    download: (id: string) =>
        api.get(`/files/${id}/download`, { responseType: 'blob' }),

    delete: (id: string) => api.delete<ApiResponse<any>>(`/files/${id}`),

    listLibrary: (page: number = 1, limit: number = 20, folderId?: string) =>
        api.get<ApiResponse<any>>('/library', {
            params: { page, limit, folderId },
        }),
};

// Library API - for user's permanent file library
export const libraryApi = {
    upload: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<ApiResponse<any>>('/library/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    list: (page: number = 1, limit: number = 20) =>
        api.get<ApiResponse<any>>('/library/list', {
            params: { page, limit },
        }),

    download: (id: string) =>
        api.get(`/library/download/${id}`, { responseType: 'blob' }),

    getPresignedUrl: (id: string) =>
        api.get<ApiResponse<any>>(`/library/url/${id}`),

    delete: (id: string) =>
        api.delete<ApiResponse<any>>(`/library/${id}`),
};

// Document Conversion API
export const conversionApi = {
    convert: (files: File[], outputFormat: string) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        formData.append('outputFormat', outputFormat);
        return api.post<ApiResponse<any>>('/convert', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    status: (jobId: string) =>
        api.get<ApiResponse<any>>(`/convert/status/${jobId}`),

    download: (jobId: string) =>
        api.get(`/convert/download/${jobId}`, { responseType: 'blob' }),

    formats: () =>
        api.get<ApiResponse<any>>('/convert/formats'),
};

export const shareApi = {
    create: (fileId: string, fileType: string, expiresIn: number) =>
        api.post<ApiResponse<any>>('/share', { fileId, fileType, expiresIn }),
    get: (code: string) => api.get<ApiResponse<any>>(`/share/${code}`),
};

export default api;
