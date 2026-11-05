import { expect, test } from "vitest";
import { SCROLL_NODE_POSITIONS } from "../../src/main";
import { getUpdatedNodePosition } from "../../src/helpers/utils";

const view = { width: 800, height: 600 };
const svgBounds = { x: 100, y: 50, ...view };
const node = { cx: 200, cy: 150, width: 100, height: 50 };

/** Canvas-relative top-left of the node after scrolling it to `position`. */
function landing(position: string) {
  const { updatedX, updatedY } = getUpdatedNodePosition({
    position,
    svgBounds,
    // on-screen bounds: canvas origin plus content position, translate 0, scale 1
    nodeBounds: {
      x: svgBounds.x + node.cx,
      y: svgBounds.y + node.cy,
      width: node.width,
      height: node.height,
    },
    currentTranslateX: 0,
    currentTranslateY: 0,
    currentScale: 1,
    updatedScale: 1,
    customOffset: { x: 0, y: 0 },
  });
  return { x: updatedX + node.cx, y: updatedY + node.cy };
}

const axis = (word: string, viewSize: number, size: number) =>
  word === "left" || word === "top"
    ? 0
    : word === "center"
      ? (viewSize - size) / 2
      : viewSize - size;

test.each(Object.values(SCROLL_NODE_POSITIONS))(
  "places an on-screen node at each of the 9 positions when the zoom stays the same: %s",
  (position) => {
    const [vertical, horizontal] = position.split("-");
    expect(landing(position)).toEqual({
      x: axis(horizontal, view.width, node.width),
      y: axis(vertical, view.height, node.height),
    });
  },
);
