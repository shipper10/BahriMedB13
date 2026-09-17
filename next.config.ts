/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // يتجاهل أخطاء ESLint أثناء npm run build فقط
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
