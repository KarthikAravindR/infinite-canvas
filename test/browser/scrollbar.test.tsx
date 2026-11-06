import { expect, test, vi } from "vitest";
import {
  center,
  contentPosition,
  drag,
  fire,
  nextFrame,
  renderCanvas,
  wheel,
} from "./helpers";

// The pan matters: before the first pan no scrollbar renders anyway (B16).
test("no scrollbar without renderScrollBar", async () => {
  const { host, empty } = await renderCanvas();
  await drag(empty, { x: empty.x + 1, y: empty.y });
  expect(host.querySelector('[data-id="horizontal-scrollbar"]')).toBeNull();
});

const thumb = (host: Element) =>
  host.querySelector('[data-id="horizontal-scrollbar"]') as Element;

test("scrollbar renders on mount", async () => {
  const { host } = await renderCanvas({
    scrollBarConfig: { renderScrollBar: true },
  });
  expect(thumb(host)).not.toBeNull();
});

// jsdom (Jest, Vitest with environment: "jsdom") has no ResizeObserver.
test("renders without ResizeObserver", async () => {
  vi.stubGlobal("ResizeObserver", undefined);
  const { host } = await renderCanvas({
    scrollBarConfig: { renderScrollBar: true },
  });
  expect(thumb(host)).not.toBeNull();
});

// B4: each thumb drag leaves another window listener behind, so later drags
// pan further.
test("scrollbar drag pans the same distance every time", async () => {
  const { host, node } = await renderCanvas({
    scrollBarConfig: { renderScrollBar: true },
  });
  const deltas: number[] = [];
  for (let i = 0; i < 4; i++) {
    const before = contentPosition(node).x;
    const from = center(thumb(host));
    await drag(from, { x: from.x + 5, y: from.y });
    deltas.push(contentPosition(node).x - before);
  }
  expect(deltas[0]).toBeLessThan(0);
  expect(deltas).toEqual([deltas[0], deltas[0], deltas[0], deltas[0]]);
});

// The thumb starts a third of the way along (200px of 600px); a narrower host
// clamps it to the new width.
test("scrollbar follows container resizes", async () => {
  const { host } = await renderCanvas({
    scrollBarConfig: { renderScrollBar: true },
  });
  const offsetInHost = () =>
    thumb(host).getBoundingClientRect().left -
    host.getBoundingClientRect().left;
  expect(offsetInHost()).toBeGreaterThan(100);
  host.style.width = "100px";
  await expect.poll(offsetInHost).toBeLessThanOrEqual(100);
});

// After a zoom, dragging the thumb past the end used to keep panning.
test("a thumb drag stops panning when the thumb reaches the end after a zoom", async () => {
  const { host, node } = await renderCanvas({
    scrollBarConfig: { renderScrollBar: true },
  });
  await wheel(center(node), { deltaY: 100, ctrlKey: true });
  // Wait for the resized thumb before grabbing it.
  await expect.poll(() => thumb(host).getBoundingClientRect().width).toBe(100);
  const hostRight = host.getBoundingClientRect().right;
  const left = () => thumb(host).getBoundingClientRect().left;
  const atEnd = () => thumb(host).getBoundingClientRect().right >= hostRight;
  const from = center(thumb(host));
  const move = (x: number) =>
    fire("mousemove", { x, y: from.y }, { movementX: 10, movementY: 0 });
  fire("mousedown", from);
  // The first move sets the grab offset.
  fire("mousemove", from, { movementX: 0, movementY: 0 });
  // The thumb updates through React, so wait for it on each step.
  let x = from.x;
  while (!atEnd() && x < hostRight) {
    const before = left();
    x += 10;
    move(x);
    await nextFrame();
    await expect.poll(() => left() >= before + 5 || atEnd()).toBe(true);
  }
  expect(atEnd()).toBe(true);
  // Content moves synchronously; 5 steps cover the old size's extra 50px.
  const endX = contentPosition(node).x;
  for (let i = 1; i <= 5; i++) {
    move(x + 10 * i);
    await nextFrame();
    expect(contentPosition(node).x).toBe(endX);
  }
  fire("mouseup", { x: x + 50, y: from.y });
});
