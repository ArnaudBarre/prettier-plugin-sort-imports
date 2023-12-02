import { builtinModules } from "node:module";
import type { TSESTree } from "@typescript-eslint/types";
import { mergeImports } from "./mergeImports.ts";

type Comment = { leading: boolean };
export type ImportStatement = {
  index: number;
  node: TSESTree.ImportDeclaration & { comments?: Comment[] };
  groupIndex: number;
};

export const organizeImports = (ast: TSESTree.Program) => {
  const blocks: ImportStatement[][] = [[]];
  let firstNonImportIndex: undefined | number;
  let lastImportIndex = 0;
  for (const [index, node] of ast.body.entries()) {
    if (node.type !== "ImportDeclaration") {
      if (firstNonImportIndex === undefined) firstNonImportIndex = index;
      continue;
    }
    const relative = node.source.value.startsWith(".");
    if (
      !relative &&
      builtinModules.includes(node.source.value) &&
      node.source.value !== "ws" // builtin in bun only
    ) {
      node.source.value = `node:${node.source.value}`;
      node.source.raw = `"${node.source.value}"`;
    }
    const hasSideEffects =
      node.importKind === "value" && node.specifiers.length === 0;
    if (hasSideEffects) {
      blocks.push([{ index, node, groupIndex: 0 }], []);
    } else {
      blocks.at(-1)!.push({
        index: blocks.at(-1)!.length,
        node,
        groupIndex: (() => {
          if (relative) return 3;
          if (node.source.value.startsWith("bun:")) return 0;
          if (node.source.value.startsWith("node:")) return 1;
          return 2;
        })(),
      });
    }
    lastImportIndex = index;
  }
  if (blocks.length === 1 && blocks[0].length === 0) return;

  let needProgramReorder =
    firstNonImportIndex !== undefined && firstNonImportIndex > lastImportIndex;

  const fileComments: Comment[] = [];
  for (const [blockIndex, block] of blocks.entries()) {
    if (block.length === 0) continue;
    if (blockIndex === 0 && block[0].node.comments?.length) {
      fileComments.push(...block[0].node.comments.filter((c) => c.leading));
      block[0].node.comments = block[0].node.comments.filter((c) => !c.leading);
    }
    const start = block[0].node.range[0];
    const end = block.at(-1)!.node.range[1];
    block.sort(compareImport);
    let hasChanged = mergeImports(block);
    if (!needProgramReorder) {
      hasChanged ||= block.some((imp, index) => imp.index !== index);
      if (hasChanged) needProgramReorder = true;
    }
    for (const [index, imp] of block.entries()) {
      imp.node.range[0] = index === 0 ? start : -1;
      imp.node.range[1] = index === block.length - 1 ? end : -1;
      imp.node.specifiers.sort((a, b) =>
        naturalSort.compare(a.local.name, b.local.name),
      );
    }
    if (blockIndex === 0 && fileComments.length) {
      if (!block[0].node.comments) block[0].node.comments = [];
      block[0].node.comments.unshift(...fileComments);
    }
  }

  if (!needProgramReorder) return;

  ast.body = [
    ...blocks.flatMap((block) => block.map((imp) => imp.node)),
    ...ast.body.filter((imp) => imp.type !== "ImportDeclaration"),
  ];
};

const compareImport = (a: ImportStatement, b: ImportStatement) => {
  if (a.groupIndex !== b.groupIndex) return a.groupIndex - b.groupIndex;
  return naturalSort.compare(a.node.source.value, b.node.source.value);
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator/Collator#syntax
const naturalSort = new Intl.Collator("en", {
  sensitivity: "base",
  numeric: true,
  caseFirst: "lower",
});
