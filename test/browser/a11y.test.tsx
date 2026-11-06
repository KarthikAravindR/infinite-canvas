import { expect, test } from "vitest";
import { EventBlocker } from "../../src/main";
import {
  contentPosition,
  fire,
  nextFrame,
  renderCanvas,
  settle,
} from "./helpers";

const farButton = (
  <button
    type="button"
    data-testid="far"
    style={{ position: "absolute", left: 1500, top: 900 }}
  >
    far
  </button>
);

const inside = (host: Element, el: Element) => {
  const b = el.getBoundingClientRect();
  const h = host.getBoundingClientRect();
  return (
    b.left >= h.left &&
    b.top >= h.top &&
    b.right <= h.right &&
    b.bottom <= h.bottom
  );
};

// A pan would take about 300ms (the scroll transition); wait past that.
const afterPanWindow = () => new Promise((r) => setTimeout(r, 700));

const renderFar = (props = {}) =>
  renderCanvas(props, {}, { extraContent: farButton });

// B15: keyboard focus on an off-screen element pans it into view.
test("focusing an off-screen element pans it into view", async () => {
  const { host } = await renderFar();
  const button = host.querySelector('[data-testid="far"]') as HTMLElement;
  button.focus();
  await expect.poll(() => inside(host, button)).toBe(true);
});

test("focus leaves no hidden scroll offset", async () => {
  const { host } = await renderFar();
  const button = host.querySelector('[data-testid="far"]') as HTMLElement;
  button.focus();
  await expect.poll(() => inside(host, button)).toBe(true);
  await settle();
  for (let el: Element | null = button; el; el = el.parentElement) {
    expect([el.scrollTop, el.scrollLeft]).toEqual([0, 0]);
    if (el === host) break;
  }
});

test("with panOnFocus={false}, focus does not pan", async () => {
  const { host } = await renderFar({ panOnFocus: false });
  const button = host.querySelector('[data-testid="far"]') as HTMLElement;
  button.focus();
  await afterPanWindow();
  expect(inside(host, button)).toBe(false);
});

test("panOnFocus can be turned off after mount", async () => {
  const { host, rerender } = await renderFar();
  await rerender({ panOnFocus: false });
  const button = host.querySelector('[data-testid="far"]') as HTMLElement;
  button.focus();
  await afterPanWindow();
  expect(inside(host, button)).toBe(false);
});

test("focusing an element that is already visible does not pan", async () => {
  const { host } = await renderCanvas(
    {},
    { children: <input data-testid="inp" /> },
    { extraContent: farButton },
  );
  const input = host.querySelector('[data-testid="inp"]') as HTMLElement;
  const before = input.getBoundingClientRect();
  input.focus();
  await afterPanWindow();
  const after = input.getBoundingClientRect();
  expect([after.left, after.top]).toEqual([before.left, before.top]);
});

test("background and scrollbars are hidden from assistive technology", async () => {
  const { host } = await renderCanvas({
    scrollBarConfig: { renderScrollBar: true },
  });
  const root = host.parentElement ?? host;
  const patterns = Array.from(root.querySelectorAll("svg")).filter((s) =>
    s.querySelector("pattern"),
  );
  expect(patterns.length).toBeGreaterThan(0);
  for (const svg of patterns) {
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.hasAttribute("role")).toBe(false);
    expect(svg.hasAttribute("aria-label")).toBe(false);
  }
  const bars = Array.from(
    host.querySelectorAll(
      '[data-id="vertical-scrollbar"], [data-id="horizontal-scrollbar"]',
    ),
  ).map((t) => t.parentElement);
  expect(bars).toHaveLength(2);
  for (const bar of bars) expect(bar?.getAttribute("aria-hidden")).toBe("true");
});

test("the canvas is a labelled group", async () => {
  const { host } = await renderCanvas();
  const group = host.querySelector('[role="group"]');
  expect(group?.getAttribute("aria-label")).toBe("Infinite canvas");
  expect(host.querySelector('[role="application"]')).toBeNull();
});

test("focus during a pointer press does not pan against the drag", async () => {
  const { host, content, at } = await renderCanvas(
    {},
    {},
    {
      extraContent: (
        <button
          type="button"
          data-testid="edge"
          style={{ position: "absolute", left: 540, top: 100, width: 120 }}
        >
          edge
        </button>
      ),
    },
  );
  const button = host.querySelector('[data-testid="edge"]') as HTMLElement;
  const before = contentPosition(content);
  const from = at(570, 110);
  fire("pointerdown", from);
  fire("mousedown", from);
  button.focus();
  let prev = from;
  for (let i = 1; i <= 4; i++) {
    const p = { x: from.x - 10 * i, y: from.y - 5 * i };
    fire("mousemove", p, { movementX: p.x - prev.x, movementY: p.y - prev.y });
    prev = p;
    await nextFrame();
  }
  fire("pointerup", prev);
  fire("mouseup", prev);
  await afterPanWindow();
  const after = contentPosition(content);
  expect([after.x - before.x, after.y - before.y]).toEqual([-40, -20]);
});

// d3's filter returns early for pan-blocked targets, so it never sees this press.
test("a press inside a pan-blocked area does not pan to the focused control", async () => {
  const { host, content, at } = await renderCanvas(
    {},
    {},
    {
      extraContent: (
        <EventBlocker
          shouldBlockPan
          shouldBlockScroll={false}
          shouldBlockZoom={false}
        >
          <input
            data-testid="edge-input"
            style={{ position: "absolute", left: 540, top: 100, width: 120 }}
          />
        </EventBlocker>
      ),
    },
  );
  const input = host.querySelector('[data-testid="edge-input"]') as HTMLElement;
  const before = contentPosition(content);
  const p = at(570, 110);
  fire("pointerdown", p);
  fire("mousedown", p);
  input.focus();
  fire("pointerup", p);
  fire("mouseup", p);
  await afterPanWindow();
  expect(contentPosition(content)).toEqual(before);
});
