import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'www.dnd5eapi.co',
      pathname: '/api/images/monsters/*.png',
      search: '',
    }],
    minimumCacheTTL: 86_400,
  },
};

export default nextConfig;
