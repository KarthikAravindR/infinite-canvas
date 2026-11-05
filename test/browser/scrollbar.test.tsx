import { expect, test } from "vitest";
import { center, contentPosition, drag, renderCanvas } from "./helpers";

// The pan matters: before the first pan no scrollbar renders anyway (B16).
test("no scrollbar without renderScrollBar", async () => {
  const { host, empty } = await renderCanvas();
  await drag(empty, { x: empty.x + 1, y: empty.y });
  expect(host.querySelector('[data-id="horizontal-scrollbar"]')).toBeNull();
});

const thumb = (host: Element) =>
  host.querySelector('[data-id="horizontal-scrollbar"]') as Element;

// B16: the scrollbar only mounts after the first pan.
test.fails("scrollbar renders on mount", async () => {
  const { host } = await renderCanvas({
    scrollBarConfig: { renderScrollBar: true },
  });
  expect(thumb(host)).not.toBeNull();
});

// B4: each thumb drag leaves another window listener behind, so later drags
// pan further. The warm-up drag mounts the scrollbar (B16).
test.fails("scrollbar drag pans the same distance every time", async () => {
  const { host, node, empty } = await renderCanvas({
    scrollBarConfig: { renderScrollBar: true },
  });
  await drag(empty, { x: empty.x + 1, y: empty.y });
  const deltas: number[] = [];
  for (let i = 0; i < 4; i++) {
    const before = contentPosition(node).x;
    const from = center(thumb(host));
    await drag(from, { x: from.x + 5, y: from.y });
    deltas.push(contentPosition(node).x - before);
  }
  expect(deltas).toEqual([deltas[0], deltas[0], deltas[0], deltas[0]]);
});
