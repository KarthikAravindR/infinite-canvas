import { expect, test } from "vitest";
import {
  center,
  contentPosition,
  drag,
  failsOn,
  type Point,
  renderCanvas,
} from "./helpers";

// B1: the imperative methods use requestIdleCallback, which WebKit lacks, so
// they fail there. Task 8 removes the marker (use plain `test`).
const it = failsOn("webkit");

const relative = (host: Element, p: Point): Point => {
  const r = host.getBoundingClientRect();
  return { x: p.x - r.left, y: p.y - r.top };
};
it("fitContentToView fits the content", async () => {
  const { ref, host, content } = await renderCanvas();
  ref.current?.fitContentToView({ duration: 0 });
  await expect
    .poll(() => ({
      w: content.getBoundingClientRect().width,
      ...relative(host, contentPosition(content)),
    }))
    .toEqual({ w: 400, x: 100, y: 0 });
});

it("fitContentToView honors scale and offset", async () => {
  const { ref, host, content } = await renderCanvas();
  ref.current?.fitContentToView({
    duration: 0,
    scale: 0.5,
    offset: { x: 10, y: 20 },
  });
  await expect
    .poll(() => ({
      w: content.getBoundingClientRect().width,
      ...relative(host, contentPosition(content)),
    }))
    .toEqual({ w: 200, x: 210, y: 20 });
});

it("scrollNodeToCenter centers a node", async () => {
  const { ref, host, node } = await renderCanvas();
  ref.current?.scrollNodeToCenter({ nodeElement: node as HTMLElement, transitionDuration: 0 });
  await expect
    .poll(() => {
      const c = relative(host, center(node));
      return Math.abs(c.x - 300) <= 1 && Math.abs(c.y - 200) <= 1;
    })
    .toBe(true);
});

it("scrollContentHorizontallyCenter centers the content", async () => {
  const { ref, host, content } = await renderCanvas();
  ref.current?.scrollContentHorizontallyCenter({ transitionDuration: 0 });
  await expect
    .poll(() => Math.abs(relative(host, contentPosition(content)).x - 100) <= 1)
    .toBe(true);
});

// getCanvasState does not use requestIdleCallback, so it works in WebKit too
// and is a plain test (test.fails would error there).
test("getCanvasState reports the position", async () => {
  const { ref, empty } = await renderCanvas();
  await drag(empty, { x: empty.x - 50, y: empty.y - 30 });
  const { currentPosition } = ref.current!.getCanvasState();
  expect({
    k: currentPosition.k,
    x: currentPosition.x,
    y: currentPosition.y,
  }).toEqual({ k: 1, x: -50, y: -30 });
});
