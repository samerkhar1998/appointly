import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@appointly/api', '@appointly/shared', '@appointly/ui'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

export default withNextIntl(nextConfig);
