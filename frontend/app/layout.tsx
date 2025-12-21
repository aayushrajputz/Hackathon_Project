import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'BinaryPDF - AI-Powered PDF Toolkit',
    description: 'Merge, split, compress, and transform your PDFs with AI-powered features',
    keywords: 'PDF, merge, split, compress, OCR, AI, tools',
    authors: [{ name: 'BinaryPDF' }],
    openGraph: {
        title: 'BinaryPDF - AI-Powered PDF Toolkit',
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
                            background: 'rgba(15, 23, 42, 0.9)',
                            backdropFilter: 'blur(16px)',
                            color: '#f1f5f9',
                            borderRadius: '20px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            padding: '12px 20px',
                        },
                        success: {
                            iconTheme: {
                                primary: '#22d3ee',
                                secondary: '#0f172a',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#f43f5e',
                                secondary: '#0f172a',
                            },
                        },
                    }}
                />
            </body>
        </html>
    );
}
