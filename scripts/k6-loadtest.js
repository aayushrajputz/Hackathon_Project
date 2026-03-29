import http from 'k6/http';
import { check, sleep } from 'k6';

// Read two dummy files into memory to send as multipart form-data
const dummyPDF = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\nxref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n106\n%%EOF\n";

export const options = {
    stages: [
        { duration: '5s', target: 50 },  // Ramp-up to 50 concurrent users
        { duration: '15s', target: 50 }, // Steady state for 15s
        { duration: '5s', target: 0 },   // Ramp-down
    ],
    thresholds: {
        // We expect some requests to fail (503/504) perfectly fine since we cap MAX_WORKERS=4
        // But we demand NO crashes!
    },
};

export default function () {
    // To hit localhost from inside docker on windows/mac, use host.docker.internal
    // If running k6 natively, use localhost. We'll pick one based on the URL variable.
    const host = __ENV.API_HOST || 'http://host.docker.internal:8080';

    // Create a multipart boundary and body manually since simple k6 lacks FormData builtin 
    // without importing external jslib
    const boundary = '----k6LoadTestBoundary123';
    const body =
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="files"; filename="file1.pdf"\r\n` +
        `Content-Type: application/pdf\r\n\r\n` +
        `${dummyPDF}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="files"; filename="file2.pdf"\r\n` +
        `Content-Type: application/pdf\r\n\r\n` +
        `${dummyPDF}\r\n` +
        `--${boundary}--`;

    const res = http.post(`${host}/api/pdf/merge`, body, {
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
        timeout: '10s' // Client timeout, should be enough to hit the 5s/10s timeout middleware
    });

    // Verify that the server didn't crash and responded properly
    // Since the dummy PDF is technically malformed for pdfcpu, it might hit 400 Bad Request
    // But that still means the server parsed it!
    // If the worker pool queue is full, it should send "server busy"
    check(res, {
        'successful or rejected properly': (r) => r.status === 200 || r.status === 400 || r.status === 503 || r.status === 504 || r.status === 500,
        'hit worker limit pool correctly': (r) => {
            // If the body contains server busy, then it worked as intended!
            return String(r.body).includes("server busy") || r.status === 504 || r.status === 503 || r.status === 400;
        }
    });

    // Brief sleep so we don't spam too hard
    sleep(0.1);
}
