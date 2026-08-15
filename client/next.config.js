/** @type {import('next').NextConfig} */
const nextConfig = {
  /*
   * Uploaded images are referenced by relative urls (/uploads/...) and reach the backend
   * through the proxy in server.js, so they are same-origin and need no remotePatterns.
   */
};

export default nextConfig
