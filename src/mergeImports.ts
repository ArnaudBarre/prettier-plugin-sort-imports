import type { ImportSpecifier } from "oxc-parser";
import type { ImportStatement } from "./organizeImports.ts";

export const mergeImports = (
  block: ImportStatement[],
): boolean /* hasChanged */ => {
  const indexesToRemove: number[] = [];
  for (const [index, imp] of block.entries()) {
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
        for (const it of next.node.specifiers) {
          it.importKind = "type";
        }
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
  }

  let hasChanged = false;
  for (const index of indexesToRemove) {
    hasChanged = true;
    block.splice(index, 1);
  }
  for (const imp of block) {
    if (
      imp.node.importKind === "value" &&
      imp.node.specifiers.length &&
      imp.node.specifiers.every(
        (impSpe) =>
          impSpe.type === "ImportSpecifier" && impSpe.importKind === "type",
      )
    ) {
      hasChanged = true;
      imp.node.importKind = "type";
      for (const it of imp.node.specifiers) {
        (it as ImportSpecifier).importKind = "value";
      }
    }
  }

  return hasChanged;
};

const isMergeable = (
  node: ImportStatement["node"],
): node is Omit<ImportStatement["node"], "specifiers"> & {
  specifiers: ImportSpecifier[];
} => node.specifiers.every((spe) => spe.type === "ImportSpecifier");
