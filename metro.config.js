const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// On web, replace native-only modules with empty stubs so the bundler
// doesn't try to load JSI/TurboModule code that doesn't exist in browsers.
const NATIVE_ONLY_ON_WEB = new Set([
  "react-native-quick-crypto",
  "react-native-nitro-modules",
]);

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && NATIVE_ONLY_ON_WEB.has(moduleName)) {
    return { type: "empty" };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
