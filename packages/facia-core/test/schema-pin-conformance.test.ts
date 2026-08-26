import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

import {
  ANSWER_SET_SCHEMA_ID,
  ANSWER_SET_SCHEMA_PACKAGE_PATH,
  ANSWER_SET_SCHEMA_PIN,
  ANSWER_SET_SCHEMA_SHA256,
  resolveAnswerSet,
  type JsonValue,
} from "../src/index.js";

const packageRoot = new URL("../", import.meta.url);
const acceptedRoot = new URL("test/fixtures/schema/accepted/", packageRoot);

type KernelScalar = null | boolean | number | string;
type LocalKernelValue =
  | { kind: "scalar"; value: KernelScalar }
  | { kind: "list"; values: LocalKernelValue[] }
  | { kind: "record"; fields: Record<string, LocalKernelValue> };

function lowerToLocalKernelValue(value: JsonValue): LocalKernelValue {
  if (value === null || typeof value !== "object") return { kind: "scalar", value };
  if (Array.isArray(value)) {
    return { kind: "list", values: value.map(lowerToLocalKernelValue) };
  }
  return {
    kind: "record",
    fields: Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, lowerToLocalKernelValue(child)]),
    ),
  };
}

function raiseFromLocalKernelValue(value: LocalKernelValue): JsonValue {
  switch (value.kind) {
    case "scalar": return value.value;
    case "list": return value.values.map(raiseFromLocalKernelValue);
    case "record": return Object.fromEntries(
      Object.entries(value.fields).map(([key, child]) => [key, raiseFromLocalKernelValue(child)]),
    );
  }
}

describe("AnswerSet schema pin", () => {
  it("matches the exact committed canonical schema bytes and public identifiers", () => {
    const schemaBytes = readFileSync(
      new URL("schemas/facia-answer-set.v2.schema.json", packageRoot),
    );
    const computed = createHash("sha256").update(schemaBytes).digest("hex");
    const checkedIn = JSON.parse(
      readFileSync(new URL("schemas/facia-answer-set.v2.pin.json", packageRoot), "utf8"),
    ) as { schema: string; packagePath: string; sha256: string };

    expect(computed).toBe("0fa2230a3db63be2684230c9e8b9da490b8705033974afd155856b28388dc45b");
    expect(checkedIn).toEqual({
      schema: "facia.answer-set/2",
      packagePath: "@facia/core/schemas/facia-answer-set.v2.schema.json",
      sha256: computed,
    });
    expect(ANSWER_SET_SCHEMA_PIN).toEqual(checkedIn);
    expect(ANSWER_SET_SCHEMA_ID).toBe(checkedIn.schema);
    expect(ANSWER_SET_SCHEMA_PACKAGE_PATH).toBe(checkedIn.packagePath);
    expect(ANSWER_SET_SCHEMA_SHA256).toBe(computed);
  });

  it("would detect any schema-byte change while the recorded pin remains stale", () => {
    const schemaBytes = readFileSync(
      new URL("schemas/facia-answer-set.v2.schema.json", packageRoot),
    );
    const changed = Buffer.concat([schemaBytes, Buffer.from("\n")]);
    expect(createHash("sha256").update(changed).digest("hex"))
      .not.toBe(ANSWER_SET_SCHEMA_SHA256);
  });
});

describe("generated validator ESM compatibility", () => {
  const generatedUrl = new URL("src/answer-set-validator.generated.ts", packageRoot);

  it("carries no CommonJS require and no node:module shim", () => {
    const source = readFileSync(generatedUrl, "utf8");

    // A bare `require(...)` throws in any real ESM environment (the Vite dev SSR
    // bridge, plain `node`). A `createRequire` shim fixes those but breaks the
    // edge runtime, which has no `node:module`. Only static imports satisfy both.
    expect(source).not.toMatch(/\brequire\s*\(/);
    expect(source).not.toContain("node:module");
    expect(source).not.toContain("createRequire");
  });

  it("loads and validates the built validator under real Node ESM resolution", () => {
    // The dev SSR bridge, the edge runtime, and production all consume the built
    // `dist` artifact through Node's own ESM resolver — not vitest's, which
    // silently resolves extensionless deep imports and would mask a real
    // ERR_MODULE_NOT_FOUND. Spawn a real `node` process that imports the built
    // file exactly as a consumer would, so this test can't be fooled.
    const builtUrl = new URL("dist/answer-set-validator.generated.js", packageRoot);
    if (!existsSync(builtUrl)) {
      throw new Error(
        "dist/answer-set-validator.generated.js is missing — run `npm run build` "
          + "in packages/facia-core before this test.",
      );
    }
    const acceptedName = readdirSync(acceptedRoot)
      .filter((name) => name.endsWith(".json"))
      .sort()[0];
    const acceptedPath = new URL(acceptedName, acceptedRoot);
    const probeUrl = new URL(`.esm-load-probe.${process.pid}.mjs`, packageRoot);
    const runner = `import { validate } from ${JSON.stringify(builtUrl.href)};
import { readFileSync as __read } from "node:fs";
const __answer = JSON.parse(__read(${JSON.stringify(acceptedPath.pathname)}, "utf8"));
if (validate(__answer) !== true) { console.error("VALIDATION_FALSE"); process.exit(3); }
console.log("OK");
`;
    writeFileSync(probeUrl, runner);
    try {
      const result = spawnSync(process.execPath, [probeUrl.pathname], {
        cwd: new URL(packageRoot).pathname,
        encoding: "utf8",
      });
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain("OK");
    } finally {
      rmSync(probeUrl, { force: true });
    }
  });
});

describe("standalone JSON and local kernel-value conformance", () => {
  it("round-trips every representative AnswerSet and recipe through JSON and scalar/list/record values", () => {
    const names = readdirSync(acceptedRoot)
      .filter((name) => name.endsWith(".json"))
      .sort();

    for (const name of names) {
      const answer = JSON.parse(readFileSync(new URL(name, acceptedRoot), "utf8")) as JsonValue;
      const recipe = resolveAnswerSet(answer, { depth: "audit" });
      expect(recipe.ok, name).toBe(true);
      if (!recipe.ok) throw new Error(`${name}: ${recipe.explanation}`);

      for (const [label, value] of [
        ["answer", answer],
        ["recipe", recipe.recipe as unknown as JsonValue],
      ] as const) {
        expect(JSON.parse(JSON.stringify(value)), `${name}/${label}`).toEqual(value);
        const lowered = lowerToLocalKernelValue(value);
        expect(raiseFromLocalKernelValue(lowered), `${name}/${label}`).toEqual(value);
      }
    }
  });

  it("keeps package runtime dependencies free of producer, kernel, renderer, and app packages", () => {
    const packageJson = JSON.parse(
      readFileSync(new URL("package.json", packageRoot), "utf8"),
    ) as { dependencies?: Record<string, string> };
    const dependencies = Object.keys(packageJson.dependencies ?? {});
    expect(dependencies).toEqual(["ajv"]);
    expect(dependencies.some((name) =>
      /libera|domain|strategy|kernel|renderer|react|vue|svelte|application/i.test(name)
    )).toBe(false);
  });
});
