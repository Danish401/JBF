/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 14.2 does not support top-level `turbopack` in next.config.js (that is Next 15+).
  // If `next dev --turbo` fails due to a parent-folder lockfile, run dev from this folder only
  // or upgrade Next and restore a turbopack root option per docs.
}

module.exports = nextConfig
