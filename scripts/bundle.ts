#!/usr/bin/env tnode
import { execSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { buildSync } from "esbuild";
import packageJSON from "../package.json";

rmSync("dist", { force: true, recursive: true });

buildSync({
  bundle: true,
  entryPoints: ["src/index.ts"],
  outdir: "dist",
  format: "esm",
  platform: "node",
  target: "node16",
  external: Object.keys(packageJSON.peerDependencies),
});

execSync("cp -r LICENSE README.md dist/");

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
      main: "index.js",
      repository: "ArnaudBarre/prettier-plugin-sort-imports",
      peerDependencies: packageJSON.peerDependencies,
    },
    null,
    2,
  ),
);
