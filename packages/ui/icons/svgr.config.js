module.exports = {
  plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
  typescript: true,
  jsxRuntime: "automatic",
  svgoConfig: {
    plugins: [
      { name: "removeViewBox", active: false },
      { name: "removeDimensions", active: true },
    ],
  },
  svgProps: {
    "aria-hidden": "true",
    focusable: "false",
  },
};
