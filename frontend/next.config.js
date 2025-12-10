/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['lh3.googleusercontent.com'],
    },
    webpack: (config, { isServer }) => {
        config.resolve.alias.canvas = false;

        // Handle undici module issues with Firebase
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                dns: false,
            };
        }

        return config;
    },
    // Transpile Firebase packages
    transpilePackages: ['firebase', '@firebase/auth', '@firebase/app'],
};

module.exports = nextConfig;
