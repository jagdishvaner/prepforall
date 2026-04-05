const fs = require("fs");
const path = require("path");
const { transform } = require("@svgr/core");
const { glob } = require("glob");
const esbuild = require("esbuild");

const SVG_DIR = path.resolve(__dirname, "../src/svg");
const GENERATED_DIR = path.resolve(__dirname, "../src/generated");
const DIST_DIR = path.resolve(__dirname, "../dist");
const svgrConfig = require("../svgr.config.js");

function toPascalCase(str) {
  return str.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
}

async function build() {
  // 1. Clean and create dirs
  fs.rmSync(GENERATED_DIR, { recursive: true, force: true });
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // 2. Transform SVGs to React components
  const svgFiles = await glob("*.svg", { cwd: SVG_DIR });
  const exports = [];

  for (const file of svgFiles) {
    const name = path.basename(file, ".svg");
    const componentName = `Icon${toPascalCase(name)}`;
    const svgCode = fs.readFileSync(path.join(SVG_DIR, file), "utf-8");

    // Use SVGR to generate base component
    const rawTsx = await transform(svgCode, {
      ...svgrConfig,
      componentName,
    });

    // Extract the SVG JSX from SVGR output.
    // SVGR generates: import type { SVGProps } from "react";
    //   const X = (props: SVGProps<SVGSVGElement>) => <svg ...>...</svg>;
    //   export default X;
    // We extract the full <svg>...</svg> and wrap it with our size-aware component.

    const svgMatch = rawTsx.match(/<svg[\s\S]*<\/svg>/);
    const svgJsx = svgMatch ? svgMatch[0] : "";

    const wrappedCode = `import type { SVGProps } from "react";

export interface ${componentName}Props extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

export function ${componentName}({ size = 24, width, height, ...props }: ${componentName}Props) {
  return (
    ${svgJsx.replace("{...props}", `width={width ?? size} height={height ?? size} {...props}`)}
  );
}
`;

    fs.writeFileSync(
      path.join(GENERATED_DIR, `${componentName}.tsx`),
      wrappedCode
    );
    exports.push(`export { ${componentName} } from "./${componentName}";`);
    exports.push(
      `export type { ${componentName}Props } from "./${componentName}";`
    );
  }

  // 3. Write index file
  const indexContent = exports.join("\n") + "\n";
  fs.writeFileSync(path.join(GENERATED_DIR, "index.ts"), indexContent);

  // Also write src/index.ts pointing to generated
  fs.writeFileSync(
    path.resolve(__dirname, "../src/index.ts"),
    'export * from "./generated";\n'
  );

  // 4. Bundle with esbuild
  const entryPoint = path.join(GENERATED_DIR, "index.ts");

  await esbuild.build({
    entryPoints: [entryPoint],
    outfile: path.join(DIST_DIR, "index.mjs"),
    bundle: true,
    format: "esm",
    target: "es2022",
    external: ["react", "react/jsx-runtime"],
    sourcemap: true,
  });

  await esbuild.build({
    entryPoints: [entryPoint],
    outfile: path.join(DIST_DIR, "index.js"),
    bundle: true,
    format: "cjs",
    target: "es2022",
    external: ["react", "react/jsx-runtime"],
    sourcemap: true,
  });

  // 5. Generate TypeScript declarations
  // Run tsc to generate .d.ts files from the generated TSX source
  const { execSync } = require("child_process");
  try {
    execSync(
      "npx tsc --project tsconfig.json --emitDeclarationOnly --declaration --outDir dist",
      { cwd: path.resolve(__dirname, ".."), stdio: "inherit" }
    );
  } catch {
    // Fallback: generate a simple declaration file from the exports
    const dtsLines = [];
    for (const file of svgFiles) {
      const name = path.basename(file, ".svg");
      const componentName = `Icon${toPascalCase(name)}`;
      dtsLines.push(`import type { SVGProps } from "react";`);
      dtsLines.push(`export interface ${componentName}Props extends SVGProps<SVGSVGElement> { size?: number | string; }`);
      dtsLines.push(`export declare function ${componentName}(props: ${componentName}Props): JSX.Element;`);
    }
    fs.writeFileSync(path.join(DIST_DIR, "index.d.ts"), dtsLines.join("\n") + "\n");
  }

  console.log(`@prepforall/icons: Built ${svgFiles.length} icon components`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
