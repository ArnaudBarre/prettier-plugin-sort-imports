import { TSESTree } from "@typescript-eslint/types";
import { Plugin } from "prettier";
import typescriptParser from "prettier/plugins/typescript";
import { organizeImports } from "./organizeImports.ts";

let hasOverride = false;

export const parsers: Plugin["parsers"] = {
  typescript: {
    ...typescriptParser.parsers.typescript,
    preprocess: (code, options: any) => {
      if (!hasOverride) {
        options.plugins[0].printers.estree.preprocess = (
          ast: TSESTree.Program,
          printerOptions: any,
        ) => {
          if (printerOptions.parser === "typescript") organizeImports(ast);
          return ast;
        };
        hasOverride = true;
      }
      return code;
    },
  },
};
