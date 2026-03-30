import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: 'https://binarypdf.vercel.app',
            lastModified: new Date(),
        },
        {
            url: 'https://binarypdf.vercel.app/tools',
            lastModified: new Date(),
        },
        {
            url: 'https://binarypdf.vercel.app/pricing',
            lastModified: new Date(),
        },
    ]
}
