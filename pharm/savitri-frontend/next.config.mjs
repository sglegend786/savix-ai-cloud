
/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
};
export default nextConfig;

