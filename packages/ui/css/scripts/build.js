const fs = require("fs");
const path = require("path");
const postcss = require("postcss");
const { glob } = require("glob");

const srcDir = path.resolve(__dirname, "../src");
const distDir = path.resolve(__dirname, "../dist");

async function build() {
  // Ensure dist directory exists
  fs.mkdirSync(distDir, { recursive: true });
  fs.mkdirSync(path.join(distDir, "components"), { recursive: true });

  // Copy base CSS
  const baseSrc = fs.readFileSync(path.join(srcDir, "index.css"), "utf-8");
  fs.writeFileSync(path.join(distDir, "index.css"), baseSrc);

  // Process component CSS modules
  const componentFiles = await glob("components/*.module.css", { cwd: srcDir });

  for (const file of componentFiles) {
    const srcPath = path.join(srcDir, file);
    const distPath = path.join(distDir, file);
    const css = fs.readFileSync(srcPath, "utf-8");
    fs.writeFileSync(distPath, css);
  }

  console.log(`@prepforall/css: Built ${componentFiles.length} component CSS modules`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
