const { i18n } = require("./next-i18next.config");
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  /* config options here */
  images: {
    domains: ["raw.githubusercontent.com", "icons.iconarchive.com", "i.ibb.co"],
  },
  i18n,
  eslint: {
    // Warning: Dangerously allow production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
      config.resolve.fallback.dns = false;
      config.resolve.fallback.net = false;
      config.resolve.fallback.tls = false;
    }

    config.module.rules.push({
      test: /\.tsx?/,
      // Transpile rari-components, even though it is in node_modules
      include: [/node_modules\/rari-components/],
      use: "next-swc-loader",
    });

    return config;
  },
});
