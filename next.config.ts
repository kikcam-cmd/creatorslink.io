import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Document-vault uploads run through a server action. Held under Vercel's
      // ~4.5MB serverless request-body cap and matched to MAX_DOCUMENT_BYTES +
      // the bucket file_size_limit (4 MiB). See D-020.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
