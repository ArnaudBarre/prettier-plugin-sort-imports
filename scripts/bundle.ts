#!/usr/bin/env bun
import { execSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import packageJSON from "../package.json";

rmSync("dist", { force: true, recursive: true });

await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  format: "esm",
  target: "node",
  external: [
    ...Object.keys(packageJSON.peerDependencies),
    ...Object.keys(packageJSON.dependencies),
  ],
});

execSync("cp LICENSE README.md dist/");

writeFileSync(
  "dist/package.json",
  JSON.stringify(
    {
      name: packageJSON.name,
      description: packageJSON.description,
      type: "module",
      version: packageJSON.version,
      author: packageJSON.author,
      license: packageJSON.license,
      exports: { ".": "./index.js" },
      repository: "ArnaudBarre/prettier-plugin-sort-imports",
      peerDependencies: packageJSON.peerDependencies,
      dependencies: packageJSON.dependencies,
    },
    null,
    2,
  ),
);
