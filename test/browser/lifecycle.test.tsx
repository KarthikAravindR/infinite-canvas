import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import {
  ReactInfiniteCanvas,
  type ReactInfiniteCanvasHandle,
} from "../../src/main";
import {
  center,
  consoleCalls,
  contentPosition,
  drag,
  nextFrame,
  renderCanvas,
  settle,
  wheel,
} from "./helpers";

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
test("zoom keeps working after maxZoom changes", async () => {
  const { node, rerender } = await renderCanvas({ maxZoom: 4 });
  await rerender({ maxZoom: 2 });
  for (let i = 0; i < 20; i++) {
    await wheel(center(node), { deltaY: -200, ctrlKey: true });
  }
  expect(node.getBoundingClientRect().width).toBeCloseTo(160, 0);
});

// The wheel listener is attached once, so it must read panOnScroll at event time.
test("changing panOnScroll after mount takes effect", async () => {
  const { node, rerender } = await renderCanvas();
  await rerender({ panOnScroll: false });
  await wheel(center(node), { deltaY: -100 });
  expect(node.getBoundingClientRect().width).toBeGreaterThan(80);
});

// Review Focus 1: Strict Mode mounts, unmounts and mounts again. The listeners
// must not double up, so one wheel event pans once.
test("in StrictMode, one wheel event pans once", async () => {
  const { node, empty } = await renderCanvas({}, {}, { strict: true });
  const before = contentPosition(node);
  await wheel(empty, { deltaY: 40 });
  const after = contentPosition(node);
  expect({ x: after.x - before.x, y: after.y - before.y }).toEqual({
    x: 0,
    y: -40,
  });
});

// Review Focus 3: each canvas has its own zoom behavior and listeners.
test("wheel over one canvas does not move another", async () => {
  const { node, empty } = await renderCanvas();
  const screen = await render(
    <div style={{ width: 600, height: 400 }}>
      <ReactInfiniteCanvas>
        <div data-testid="other-node" style={{ width: 80, height: 60 }} />
      </ReactInfiniteCanvas>
    </div>,
  );
  await settle();
  const other = screen.getByTestId("other-node").element();
  const before = { node: contentPosition(node), other: contentPosition(other) };
  await wheel(empty, { deltaY: 40 });
  expect(contentPosition(other)).toEqual(before.other);
  // Positive control: the first canvas did pan.
  expect(contentPosition(node)).toEqual({
    x: before.node.x,
    y: before.node.y - 40,
  });
});

test("onZoom reports the transform on pan", async () => {
  const onZoom = vi.fn();
  const { empty } = await renderCanvas({ onZoom });
  await drag(empty, { x: empty.x - 50, y: empty.y - 30 });
  expect(onZoom.mock.lastCall).toEqual([
    { translateX: -50, translateY: -30, scale: 1 },
  ]);
});

test("onZoom uses the latest callback after a rerender", async () => {
  const first = vi.fn();
  const second = vi.fn();
  const { empty, rerender } = await renderCanvas({ onZoom: first });
  await rerender({ onZoom: second });
  await drag(empty, { x: empty.x - 50, y: empty.y - 30 });
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalled();
});

test("a throwing onZoom does not stop the pan from moving the node", async () => {
  const errors: string[] = [];
  const onError = (e: ErrorEvent) => {
    errors.push(e.message);
    e.preventDefault();
  };
  window.addEventListener("error", onError);
  try {
    const { node, empty } = await renderCanvas({
      onZoom: () => {
        throw new Error("consumer bug");
      },
    });
    const before = contentPosition(node);
    await drag(empty, { x: empty.x - 50, y: empty.y - 30 });
    const after = contentPosition(node);
    expect(errors.some((m) => m.includes("consumer bug"))).toBe(true);
    expect({ x: after.x - before.x, y: after.y - before.y }).toEqual({
      x: -50,
      y: -30,
    });
  } finally {
    window.removeEventListener("error", onError);
    // The browser also logs the uncaught error to the console; it is expected here.
    for (let i = consoleCalls.length - 1; i >= 0; i--) {
      if (consoleCalls[i].includes("consumer bug")) consoleCalls.splice(i, 1);
    }
  }
});
