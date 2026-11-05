import { expect, test } from "vitest";
import { SCROLL_NODE_POSITIONS } from "../../src/main";
import { getUpdatedNodePosition } from "../../src/helpers/utils";

const view = { width: 800, height: 600 };
const svgBounds = { x: 100, y: 50, ...view };
const size = { width: 100, height: 50 };

/**
 * Canvas-relative top-left of a node after scrolling it to `position`. The node
 * sits at content (cx, cy) with translate 0 and `currentScale`; the new
 * transform has `updatedScale`.
 */
function landing(
  position: string,
  { cx = 200, cy = 150, currentScale = 1, updatedScale = 1 } = {},
) {
  const { updatedX, updatedY } = getUpdatedNodePosition({
    position,
    svgBounds,
    // on-screen bounds: canvas origin plus content position, translate 0
    nodeBounds: {
      x: svgBounds.x + cx,
      y: svgBounds.y + cy,
      width: size.width * currentScale,
      height: size.height * currentScale,
    },
    currentTranslateX: 0,
    currentTranslateY: 0,
    currentScale,
    updatedScale,
    customOffset: { x: 0, y: 0 },
  });
  const ratio = updatedScale / currentScale;
  return { x: updatedX + cx * ratio, y: updatedY + cy * ratio };
}

const axis = (word: string, viewSize: number, nodeSize: number) =>
  word === "left" || word === "top"
    ? 0
    : word === "center"
      ? (viewSize - nodeSize) / 2
      : viewSize - nodeSize;

const expectLanding = (
  position: string,
  opts: Parameters<typeof landing>[1] = {},
) => {
  const [vertical, horizontal] = position.split("-");
  const scale = (opts.updatedScale ?? 1) / (opts.currentScale ?? 1);
  expect(landing(position, opts)).toEqual({
    x: axis(horizontal, view.width, size.width * (opts.currentScale ?? 1) * scale),
    y: axis(vertical, view.height, size.height * (opts.currentScale ?? 1) * scale),
  });
};

const ALL = Object.values(SCROLL_NODE_POSITIONS);
/** Rows split into [passing, expected-to-fail today] for one bug. */
const rows = (failing: string[]) =>
  [ALL.filter((p) => !failing.includes(p)), failing] as const;

test.each(ALL)(
  "places an on-screen node at each of the 9 positions when the zoom stays the same: %s",
  (position) => expectLanding(position),
);

// B13: some positions mix scaled and unscaled terms when the zoom changes.
const zoomIn = { currentScale: 1, updatedScale: 2 };
const [zoomOk, zoomBad] = rows(["top-center", "top-right", "bottom-right"]);
test.each(zoomOk)(
  "positions a node correctly when the zoom changes: %s",
  (position) => expectLanding(position, zoomIn),
);
test.fails.each(zoomBad)(
  "positions a node correctly when the zoom changes: %s",
  (position) => expectLanding(position, zoomIn),
);

// B14: Math.abs flips the sign for a node left of / above the canvas origin.
const offScreen = { cx: -400, cy: -300 };
const [offOk, offBad] = rows(ALL.filter((p) => p !== "top-left" && p !== "top-center"));
test.each(offOk)(
  "positions an off-screen node correctly: %s",
  (position) => expectLanding(position, offScreen),
);
test.fails.each(offBad)(
  "positions an off-screen node correctly: %s",
  (position) => expectLanding(position, offScreen),
);
