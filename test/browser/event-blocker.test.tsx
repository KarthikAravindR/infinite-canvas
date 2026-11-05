import { expect, test, vi } from "vitest";
import { EventBlocker } from "../../src/main";
import {
  center,
  contentPosition,
  drag,
  fire,
  renderCanvas,
  wheel,
  type Point,
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

// B10: wheel panning only works after the first pan; Task 11 removes the warm-up.
const warmUp = (empty: Point) => drag(empty, { x: empty.x + 1, y: empty.y });

test("shouldBlockScroll: wheel over the blocker does not pan", async () => {
  const { node, empty, at } = await renderCanvas(
    {},
    {},
    { extraContent: blocker({ scroll: true }) },
  );
  await warmUp(empty); // B10 workaround, removed in Task 11
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

// B17: the wheel handler calls `shouldBlockEvent({ ...event })` (src/App.tsx:337).
// Spreading a WheelEvent drops the inherited ctrlKey/metaKey getters, so a
// zoom-only blocker never blocks ctrl+wheel. Task 11 fixes it and switches this
// test to `test`. The B10 warm-up below is also removed in Task 11.
test.fails("shouldBlockZoom: ctrl+wheel over the blocker does not zoom", async () => {
  const { node, empty, at } = await renderCanvas(
    {},
    {},
    { extraContent: blocker({ zoom: true }) },
  );
  // B10: the blocking wheel handler is attached only after the first pan; Task 11 removes the warm-up.
  await warmUp(empty);
  await wheel(at(300, 50), { deltaY: -100, ctrlKey: true });
  expect(node.getBoundingClientRect().width).toBe(80);
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
// pan jumps by that drag's distance. Phase 2 switches this to `test`.
test.fails("blocked drag does not make the next pan jump", async () => {
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
test.fails("onMouseDown fires inside a pan-blocked EventBlocker", async () => {
  const onMouseDown = vi.fn();
  const { blocked } = await renderCanvas({}, { onMouseDown });
  const p = center(blocked);
  fire("mousedown", p);
  fire("mouseup", p);
  expect(onMouseDown).toHaveBeenCalledTimes(1);
});
