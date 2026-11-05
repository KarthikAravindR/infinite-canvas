import { execSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = process.cwd();
const tmp = mkdtempSync(join(tmpdir(), "check-package-"));
const consumer = join(tmp, "consumer");
const webpackDir = join(tmp, "webpack");

const run = (name, cmd, cwd = root) => {
  console.log(`\n==> ${name}`);
  execSync(cmd, { cwd, stdio: "inherit" });
};

try {
  run("npm pack", `npm pack --pack-destination "${tmp}"`);
  const tgz = join(tmp, readdirSync(tmp).find((f) => f.endsWith(".tgz")));
  run("publint", `npx --yes publint@0.3.25 --strict "${tgz}"`);
  run("are the types wrong", `npx --yes @arethetypeswrong/cli@0.18.5 "${tgz}"`);
  cpSync(join(root, "test/package/consumer"), consumer, { recursive: true });
  run("install tarball in consumer", `npm install "${tgz}"`, consumer);
  run("tsc 5.9", "npx --yes -p typescript@5.9 tsc -p .", consumer);
  run("tsc 7.0", "npx --yes -p typescript@7.0 tsc -p .", consumer);
  for (const v of [18, 17]) {
    run(
      `tsc 5.9 with @types/react ${v}`,
      `npm install --no-save @types/react@${v} @types/react-dom@${v} && npx --yes -p typescript@5.9 tsc -p .`,
      consumer,
    );
  }
  run("import (ESM)", `node --input-type=module -e "import('react-infinite-canvas')"`, consumer);
  run("require (CJS)", `node -e "require('react-infinite-canvas')"`, consumer);

  // webpack 5 needs fully specified imports in a "type": "module" package,
  // and React 17 has no exports map, so "react/jsx-runtime" fails there.
  mkdirSync(webpackDir);
  writeFileSync(join(webpackDir, "package.json"), "{}");
  writeFileSync(
    join(webpackDir, "entry.js"),
    'import { ReactInfiniteCanvas } from "react-infinite-canvas"; console.log(ReactInfiniteCanvas);\n',
  );
  run(
    "install tarball with React 17 and webpack 5",
    `npm install "${tgz}" react@17.0.2 react-dom@17.0.2 webpack@5`,
    webpackDir,
  );
  console.log("\n==> webpack 5 + React 17");
  const webpack = createRequire(join(webpackDir, "package.json"))("webpack");
  const stats = await new Promise((resolve, reject) =>
    webpack(
      {
        mode: "production",
        context: webpackDir,
        entry: "./entry.js",
        output: { path: join(webpackDir, "dist") },
      },
      (err, s) => (err ? reject(err) : resolve(s)),
    ),
  );
  if (stats.hasErrors()) {
    console.error(stats.toString("errors-only"));
    throw new Error("webpack build failed");
  }
  console.log("\nAll package checks passed.");
} catch (err) {
  console.error(`\n${err.message}`);
  process.exitCode = 1;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
