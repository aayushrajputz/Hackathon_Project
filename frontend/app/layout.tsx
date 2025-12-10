import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'BrainyPDF - AI-Powered PDF Toolkit',
    description: 'Merge, split, compress, and transform your PDFs with AI-powered features',
    keywords: 'PDF, merge, split, compress, OCR, AI, tools',
    authors: [{ name: 'BrainyPDF' }],
    openGraph: {
        title: 'BrainyPDF - AI-Powered PDF Toolkit',
        description: 'Merge, split, compress, and transform your PDFs with AI-powered features',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                {children}
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#1e293b',
                            color: '#f1f5f9',
                            borderRadius: '12px',
                        },
                        success: {
                            iconTheme: {
                                primary: '#22c55e',
                                secondary: '#f1f5f9',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#f1f5f9',
                            },
                        },
                    }}
                />
            </body>
        </html>
    );
}
