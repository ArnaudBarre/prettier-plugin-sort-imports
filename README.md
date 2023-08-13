# @arnaud-barre/prettier-plugin-sort-imports [![npm](https://img.shields.io/npm/v/@arnaud-barre/prettier-plugin-sort-imports)](https://www.npmjs.com/package/@arnaud-barre/prettier-plugin-sort-imports)

A small low-overhead TS-only Prettier plugin to sort imports. Inspired by [IanVS/prettier-plugin-import-sort](https://github.com/IanVS/prettier-plugin-sort-imports).

This package is using a monkey-patch of the estree [pinter preprocess](https://prettier.io/docs/en/plugins.html#optional-preprocess) to avoid a double code -> AST -> code pass. This is obviously not stable, but allows to get everything I need for 200 lines of code and without any dependency.

The plugin is published as an ESM module, so it requires Prettier 3.

This plugin sorts imports into 4 groups (`bun:`, `node:`, `<packages>`, `.<relative>`), with a natural sorting inside each group. Comments follow the imports they are attached too. There is no special handling for TS paths.

## Features

- Don't reorder imports across side effect imports
- Enforce `node:` prefix
- Merge imports statement from the same module
- Use `import type` for type only imports
