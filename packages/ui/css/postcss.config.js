const baseConfig = require("@prepforall/postcss-config");

module.exports = {
  ...baseConfig,
  plugins: {
    ...baseConfig.plugins,
    "postcss-modules": {
      generateScopedName: "pfa-[name]__[local]--[hash:base64:5]",
      getJSON: () => {}, // handled by build script
    },
  },
};
