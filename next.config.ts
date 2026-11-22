import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
  // The page templates in /site are read at runtime; make sure they ship with the server.
  outputFileTracingIncludes: {
    '/[[...slug]]': ['./site/**/*'],
  },
  poweredByHeader: false,
  async redirects() {
    return [
      // Old links (/case-studies.html) go to the clean URL (/case-studies), like the current site.
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/:page([a-z0-9-]+).html', destination: '/:page', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/assets/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
