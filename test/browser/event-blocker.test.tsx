import { expect, test, vi } from "vitest";
import { server } from "vitest/browser";
import { EventBlocker } from "../../src/main";
import {
  center,
  contentPosition,
  drag,
  fire,
  renderCanvas,
  settle,
  wheel,
} from "./helpers";

// Second blocker, placed in free space of the content box, at (200,0)-(400,100).
const blocker = (flags: { scroll?: boolean; zoom?: boolean }) => (
  <div style={{ position: "absolute", left: 200, top: 0 }}>
    <EventBlocker
      shouldBlockScroll={!!flags.scroll}
      shouldBlockZoom={!!flags.zoom}
      shouldBlockPan={false}
    >
      <div data-testid="blocker2" style={{ width: 200, height: 100 }} />
    </EventBlocker>
  </div>
);

test("shouldBlockScroll: wheel over the blocker does not pan", async () => {
  const { node, empty, at } = await renderCanvas(
    {},
    {},
    { extraContent: blocker({ scroll: true }) },
  );
  const before = contentPosition(node);
  await wheel(at(300, 50), { deltaY: 40 });
  expect(contentPosition(node)).toEqual(before);
  // Positive control: wheel does pan on empty canvas in this same setup.
  await wheel(empty, { deltaY: 40 });
  const after = contentPosition(node);
  expect({ x: after.x - before.x, y: after.y - before.y }).toEqual({
    x: 0,
    y: -40,
  });
});

// B17: the wheel handler called `shouldBlockEvent({ ...event })`. Spreading a
// WheelEvent drops the inherited ctrlKey/metaKey getters, so a zoom-only
// blocker never blocked ctrl+wheel.
test("shouldBlockZoom: ctrl+wheel over the blocker does not zoom", async () => {
  const { node, at } = await renderCanvas(
    {},
    {},
    { extraContent: blocker({ zoom: true }) },
  );
  await wheel(at(300, 50), { deltaY: -100, ctrlKey: true });
  expect(node.getBoundingClientRect().width).toBe(80);
});

// B17, the other side: the spread made every wheel look like a plain scroll,
// so a scroll-only blocker also blocked ctrl+wheel. Now ctrl+wheel zooms there.
test("shouldBlockScroll only: ctrl+wheel over the blocker zooms", async () => {
  const { node, at } = await renderCanvas(
    {},
    {},
    { extraContent: blocker({ scroll: true }) },
  );
  await wheel(at(300, 50), { deltaY: -100, ctrlKey: true });
  expect(node.getBoundingClientRect().width).toBeGreaterThan(80);
});

test("pan works on empty canvas next to a blocker", async () => {
  const { node, empty } = await renderCanvas(
    {},
    {},
    { extraContent: blocker({ scroll: true, zoom: true }) },
  );
  const before = contentPosition(node);
  await drag(empty, { x: empty.x - 50, y: empty.y - 30 });
  const after = contentPosition(node);
  expect({ x: after.x - before.x, y: after.y - before.y }).toEqual({
    x: -50,
    y: -30,
  });
});

// B2: a drag that starts on a pan-blocked box leaves stale state, so the next
// pan jumps by that drag's distance.
test("blocked drag does not make the next pan jump", async () => {
  const { node, blocked, empty } = await renderCanvas();
  const before = contentPosition(node);
  const start = center(blocked);
  await drag(start, { x: start.x + 60, y: start.y + 40 });
  await drag(empty, { x: empty.x + 1, y: empty.y });
  const after = contentPosition(node);
  expect({ x: after.x - before.x, y: after.y - before.y }).toEqual({
    x: 1,
    y: 0,
  });
});

// B3: the blocker swallows mousedown before the child's React handler sees it.
test("onMouseDown fires inside a pan-blocked EventBlocker", async () => {
  const onMouseDown = vi.fn();
  const { blocked } = await renderCanvas({}, { onMouseDown });
  const p = center(blocked);
  fire("mousedown", p);
  fire("mouseup", p);
  expect(onMouseDown).toHaveBeenCalledTimes(1);
});

// Review Focus 5: touch gestures are filtered too. Only Chromium has `Touch`.
test.runIf(server.browser === "chromium")(
  "touch drag on a pan-blocked element does not pan",
  async () => {
    // d3 only listens for touch when the device reports touch support.
    const touchSupport = vi
      .spyOn(navigator, "maxTouchPoints", "get")
      .mockReturnValue(1);
    try {
      const { node, blocked } = await renderCanvas();
      const before = contentPosition(node);
      const p = center(blocked);
      const touch = (dx: number) =>
        new Touch({
          identifier: 1,
          target: blocked,
          clientX: p.x + dx,
          clientY: p.y,
        });
      const send = (type: string, dx: number, ended = false) => {
        const t = touch(dx);
        blocked.dispatchEvent(
          new TouchEvent(type, {
            bubbles: true,
            cancelable: true,
            touches: ended ? [] : [t],
            targetTouches: ended ? [] : [t],
            changedTouches: [t],
          }),
        );
      };
      send("touchstart", 0);
      send("touchmove", 30);
      send("touchmove", 60);
      send("touchend", 60, true);
      await settle();
      expect(contentPosition(node)).toEqual(before);
    } finally {
      touchSupport.mockRestore();
    }
  },
);
