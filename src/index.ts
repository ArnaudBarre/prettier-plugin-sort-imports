import type { Program } from "oxc-parser";
import type { Plugin } from "prettier";
import { parsers as oxcParsers } from "prettier-oxc-parser";
import { organizeImports } from "./organizeImports.ts";

let hasOverride = false;

export const parsers: Plugin["parsers"] = {
  typescript: {
    ...oxcParsers!["typescript"],
    preprocess: (code, options: any) => {
      if (!hasOverride) {
        const previous = options.plugins[0].printers.estree.preprocess;
        options.plugins[0].printers.estree.preprocess = (
          ast: Program,
          printerOptions: any,
        ) => {
          if (printerOptions.parser === "typescript") organizeImports(ast);
          return previous?.(ast, printerOptions) ?? ast;
        };
        hasOverride = true;
      }
      return code;
    },
  },
};
