import { expect, test } from "vitest";
import { server } from "vitest/browser";
import {
  center,
  contentPosition,
  drag,
  renderCanvas,
  wheel,
} from "./helpers";

test("WebKit takes the Safari (div) path; Chromium and Firefox take the svg path", async () => {
  const { host } = await renderCanvas();
  expect(host.querySelector("svg foreignObject") !== null).toBe(
    server.browser !== "webkit",
  );
});

test("drag on empty canvas pans content by the drag distance", async () => {
  const { node, empty } = await renderCanvas();
  const before = contentPosition(node);
  await drag(empty, { x: empty.x - 50, y: empty.y - 30 });
  const after = contentPosition(node);
  expect({ x: after.x - before.x, y: after.y - before.y }).toEqual({
    x: -50,
    y: -30,
  });
});

test("wheel pans content by the wheel delta", async () => {
  const { node, empty } = await renderCanvas();
  const before = contentPosition(node);
  await wheel(empty, { deltaY: 40 });
  const after = contentPosition(node);
  expect({ x: after.x - before.x, y: after.y - before.y }).toEqual({
    x: 0,
    y: -40,
  });
});

test("ctrl+wheel zooms in around the pointer", async () => {
  const { node } = await renderCanvas();
  const before = center(node);
  await wheel(before, { deltaY: -100, ctrlKey: true });
  expect(node.getBoundingClientRect().width).toBeGreaterThan(80);
  const after = center(node);
  expect(Math.abs(after.x - before.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1);
});

test("with panOnScroll={false}, wheel zooms instead of panning", async () => {
  const { node } = await renderCanvas({ panOnScroll: false });
  await wheel(center(node), { deltaY: -100 });
  expect(node.getBoundingClientRect().width).toBeGreaterThan(80);
});

test("zoom stops at maxZoom", async () => {
  const { node } = await renderCanvas({ maxZoom: 2 });
  for (let i = 0; i < 20; i++) {
    await wheel(center(node), { deltaY: -200, ctrlKey: true });
  }
  expect(node.getBoundingClientRect().width).toBeCloseTo(160, 0);
});

test("zoom stops at minZoom", async () => {
  const { node } = await renderCanvas({ minZoom: 0.5 });
  for (let i = 0; i < 20; i++) {
    await wheel(center(node), { deltaY: 200, ctrlKey: true });
  }
  expect(node.getBoundingClientRect().width).toBeCloseTo(40, 0);
});

// B10: the wheel handler is only attached after the first pan.
test("wheel pans on the first render", async () => {
  const { node, empty } = await renderCanvas();
  const before = contentPosition(node);
  await wheel(empty, { deltaY: 40 });
  const after = contentPosition(node);
  expect({ x: after.x - before.x, y: after.y - before.y }).toEqual({
    x: 0,
    y: -40,
  });
});

// B12: any mouse button pans, not just the primary one.
test("only the primary button pans", async () => {
  const { node, empty } = await renderCanvas();
  const before = contentPosition(node);
  const to = { x: empty.x - 50, y: empty.y - 30 };
  await drag(empty, to, 5, { button: 2, buttons: 2 });
  await drag(empty, to, 5, { button: 1, buttons: 4 });
  const after = contentPosition(node);
  expect({ x: after.x - before.x, y: after.y - before.y }).toEqual({
    x: 0,
    y: 0,
  });
});
