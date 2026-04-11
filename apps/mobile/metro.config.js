const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Monorepo root — two levels up from apps/mobile/
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo so Metro sees workspace packages
config.watchFolders = [monorepoRoot];

// Resolve modules first from the mobile app's own node_modules,
// then fall back to the monorepo root node_modules (pnpm virtual store)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Ensure Metro can resolve the pnpm-hoisted expo-router entry point
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
