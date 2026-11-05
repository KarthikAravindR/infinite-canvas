import { expect, test, vi } from "vitest";
import type { ReactInfiniteCanvasHandle } from "../../src/main";
import { center, drag, nextFrame, renderCanvas, wheel } from "./helpers";

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

test("unmounting during a pending fitContentToView does not throw", async () => {
  const { ref, unmount } = await renderCanvas();
  ref.current!.fitContentToView({ duration: 0 });
  await unmount();
  await nextFrame();
  await nextFrame();
});

// B9: changing maxZoom after mount leaves the zoom limit stale.
test.fails("zoom keeps working after maxZoom changes", async () => {
  const { node, rerender } = await renderCanvas({ maxZoom: 4 });
  await rerender({ maxZoom: 2 });
  for (let i = 0; i < 20; i++) {
    await wheel(center(node), { deltaY: -200, ctrlKey: true });
  }
  expect(node.getBoundingClientRect().width).toBeCloseTo(160, 0);
});

// B11: onZoom is not called while panning.
test.fails("onZoom reports the transform on pan", async () => {
  const onZoom = vi.fn();
  const { empty } = await renderCanvas({ onZoom });
  await drag(empty, { x: empty.x - 50, y: empty.y - 30 });
  expect(onZoom.mock.lastCall).toEqual([
    { translateX: -50, translateY: -30, scale: 1 },
  ]);
});
