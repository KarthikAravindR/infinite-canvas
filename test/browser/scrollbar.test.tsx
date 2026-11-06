import { expect, test, vi } from "vitest";
import { center, contentPosition, drag, renderCanvas } from "./helpers";

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
