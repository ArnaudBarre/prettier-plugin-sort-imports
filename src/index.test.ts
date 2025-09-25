import assert from "node:assert";
import { test } from "node:test";
import { format } from "prettier";
import { parsers } from "./index.ts";

const run = (name: string, actual: string, expected: string) => {
  void test(name, async () => {
    const output = await format(actual.trim(), {
      parser: "typescript",
      filepath: "test.ts",
      plugins: [{ parsers }],
    });
    assert.equal(output, expected.trimStart());
  });
};

run(
  "sorts imports",
  `
import { foo } from "foo";
import { bar } from "bar";
`,
  `
import { bar } from "bar";
import { foo } from "foo";
`,
);

run(
  "sorts relative last",
  `
import { bar } from "./bar.ts";
import { foo } from "foo";
`,
  `
import { foo } from "foo";
import { bar } from "./bar.ts";
`,
);

run(
  "sorts relative",
  `
import { bar } from "../bar.ts";
import { foo } from "./foo.ts";
import { baz } from "../../baz.ts";
`,
  `
import { baz } from "../../baz.ts";
import { bar } from "../bar.ts";
import { foo } from "./foo.ts";
`,
);

run(
  "sorts named imports with natural sort",
  `
import { foo, bar, foo2, foo23, Foo14 } from "foobar";
`,
  `
import { bar, foo, foo2, Foo14, foo23 } from "foobar";
`,
);

run(
  "prefer type for the statement",
  `
import { type bar, type foo } from "foobar";
`,
  `
import type { bar, foo } from "foobar";
`,
);

run(
  "respect side-effects imports",
  `
import { foo } from "foo";
import { bar } from "bar";
import "baz";

import { foo2 } from "foo2";
import { bar2 } from "bar2";
`,
  `
import { bar } from "bar";
import { foo } from "foo";
import "baz";

import { bar2 } from "bar2";
import { foo2 } from "foo2";
`,
);

run(
  "keep comments and line feed",
  `
import { foo } from "foo"; // foo
// bar
import { bar } from "bar";

var baz = 3;
`,
  `
// bar
import { bar } from "bar";
import { foo } from "foo"; // foo

var baz = 3;
`,
);

run(
  "handle hashbang",
  `
#!/usr/bin/env tnode
import { foo } from "foo";
import { bar } from "bar";
`,
  `
#!/usr/bin/env tnode
import { bar } from "bar";
import { foo } from "foo";
`,
);

run(
  "add node prefix & sort builtins first",
  `
import { readFile } from "fs";
import assert from "node:assert";
import { it } from "node:test";
import { test } from "bun:test";
`,
  `
import { test } from "bun:test";
import assert from "node:assert";
import { readFile } from "node:fs";
import { it } from "node:test";
`,
);

run(
  "merge imports",
  `
import { foo } from "foobar";
import type { bar } from "foobar";
import { baz } from "foobar";
// Sync is faster
import { readFileSync } from "node:fs";
// Rename
import { foo as foo2 } from "foobar";
// Rename 2
import { type bar2 } from "foobar";
`,
  `
// Sync is faster
import { readFileSync } from "node:fs";
// Rename
// Rename 2
import { type bar, type bar2, baz, foo, foo as foo2 } from "foobar";
`,
);
