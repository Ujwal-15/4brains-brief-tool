/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // resvg-js loads a platform-specific .node native binary which
    // webpack tries (and fails) to bundle. Mark it external so it stays
    // in node_modules at runtime.
    serverComponentsExternalPackages: ["@resvg/resvg-js"],

    // Force the bundled font file to be included in the export route's
    // serverless bundle. Without this, the .woff2 file would be skipped
    // (webpack only includes files it sees as imports, and fs.readFileSync
    // paths aren't statically analysable).
    outputFileTracingIncludes: {
      "/api/briefs/[id]/export": [
        "./node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2",
        "./node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2",
      ],
    },
  },
};

export default nextConfig;
