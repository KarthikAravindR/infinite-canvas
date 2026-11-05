import { expect, test } from "vitest";
import type { ReactInfiniteCanvasHandle } from "../../src/main";
import { renderCanvas } from "./helpers";

test("onCanvasMount receives the handle", async () => {
  let handle: ReactInfiniteCanvasHandle | undefined;
  await renderCanvas({ onCanvasMount: (h) => (handle = h) });
  expect(Object.keys(handle ?? {}).sort()).toEqual([
    "fitContentToView",
    "getCanvasState",
    "scrollContentHorizontallyCenter",
    "scrollNodeHandler",
    "scrollNodeToCenter",
  ]);
});
