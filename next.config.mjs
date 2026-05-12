/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // resvg-js loads a platform-specific .node native binary which
    // webpack tries (and fails) to bundle. Mark it external so it stays
    // in node_modules at runtime.
    serverComponentsExternalPackages: ["@resvg/resvg-js"],
  },
};

export default nextConfig;
