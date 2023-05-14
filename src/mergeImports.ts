import { TSESTree } from "@typescript-eslint/types";
import type { ImportStatement } from "./organizeImports.ts";

export const mergeImports = (
  block: ImportStatement[],
): boolean /* hasChanged */ => {
  const indexesToRemove: number[] = [];
  block.forEach((imp, index) => {
    const next = block.at(index + 1);
    if (
      next &&
      imp.node.source.value === next.node.source.value &&
      isMergeable(imp.node) &&
      isMergeable(next.node)
    ) {
      const needConversion = imp.node.importKind !== next.node.importKind;
      if (needConversion && next.node.importKind === "type") {
        next.node.importKind = "value";
        next.node.specifiers.forEach((it) => {
          it.importKind = "type";
        });
      }
      for (const impSpe of imp.node.specifiers) {
        if (
          next.node.specifiers.some(
            (nextSpe) => nextSpe.local.name === impSpe.local.name,
          )
        ) {
          continue;
        }
        if (needConversion && imp.node.importKind === "type") {
          impSpe.importKind = "type";
        }
        next.node.specifiers.push(impSpe);
      }
      if (imp.node.comments?.length) {
        next.node.comments = [
          ...imp.node.comments,
          ...(next.node.comments ?? []),
        ];
      }
      indexesToRemove.unshift(index);
    }
  });
  if (indexesToRemove.length === 0) return false;
  indexesToRemove.forEach((index) => {
    block.splice(index, 1);
  });
  return true;
};

const isMergeable = (
  node: ImportStatement["node"],
): node is Omit<ImportStatement["node"], "specifiers"> & {
  specifiers: TSESTree.ImportSpecifier[];
} => node.specifiers.every((spe) => spe.type === "ImportSpecifier");
