import { expect, test } from "vitest";
import { consoleCalls, renderCanvas } from "./helpers";

// B5: React shows each warning once per file, so this test has its own file.
test("renders without React warnings", async () => {
  await renderCanvas({
    customComponents: [{ component: <button type="button">b</button> }],
  });
  expect(
    consoleCalls.filter((m) => /element\.ref|zoomState/.test(m)),
  ).toEqual([]);
});
