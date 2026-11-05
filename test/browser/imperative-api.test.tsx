import { StrictMode } from "react";
import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { ReactInfiniteCanvas } from "../../src/main";
import {
  center,
  contentPosition,
  drag,
  type Point,
  renderCanvas,
  settle,
} from "./helpers";

const relative = (host: Element, p: Point): Point => {
  const r = host.getBoundingClientRect();
  return { x: p.x - r.left, y: p.y - r.top };
};
test("fitContentToView fits the content", async () => {
  const { ref, host, content } = await renderCanvas();
  ref.current?.fitContentToView({ duration: 0 });
  await expect
    .poll(() => ({
      w: content.getBoundingClientRect().width,
      ...relative(host, contentPosition(content)),
    }))
    .toEqual({ w: 400, x: 100, y: 0 });
});

test("fitContentToView honors scale and offset", async () => {
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

test("scrollNodeToCenter centers a node", async () => {
  const { ref, host, node } = await renderCanvas();
  ref.current?.scrollNodeToCenter({ nodeElement: node as HTMLElement, transitionDuration: 0 });
  await expect
    .poll(() => {
      const c = relative(host, center(node));
      return Math.abs(c.x - 300) <= 1 && Math.abs(c.y - 200) <= 1;
    })
    .toBe(true);
});

test("scrollContentHorizontallyCenter centers the content", async () => {
  const { ref, host, content } = await renderCanvas();
  ref.current?.scrollContentHorizontallyCenter({ transitionDuration: 0 });
  await expect
    .poll(() => Math.abs(relative(host, contentPosition(content)).x - 100) <= 1)
    .toBe(true);
});

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

// B1: the methods must not need requestIdleCallback (WebKit lacks it).
test("imperative methods work without requestIdleCallback", async () => {
  vi.stubGlobal("requestIdleCallback", undefined);
  const { ref, host, content } = await renderCanvas();
  ref.current!.fitContentToView({ duration: 0 });
  await expect
    .poll(() => relative(host, contentPosition(content)).x)
    .toBe(100);
});

const renderBig = async (strict: boolean, fitOnMount: boolean) => {
  let handle: { fitContentToView: (o: { duration: number }) => void };
  const tree = (
    <div data-testid="host" style={{ width: 600, height: 400 }}>
      <ReactInfiniteCanvas
        onCanvasMount={(h) => {
          handle = h;
          if (fitOnMount) h.fitContentToView({ duration: 0 });
        }}
      >
        <div
          data-testid="big"
          style={{ position: "relative", width: 2400, height: 1600 }}
        />
      </ReactInfiniteCanvas>
    </div>
  );
  const screen = await render(strict ? <StrictMode>{tree}</StrictMode> : tree);
  if (!fitOnMount) {
    await settle();
    handle!.fitContentToView({ duration: 0 });
  }
  const host = screen.getByTestId("host").element();
  const big = screen.getByTestId("big").element();
  return () => {
    const h = host.getBoundingClientRect();
    const b = big.getBoundingClientRect();
    return {
      fits:
        b.width <= h.width + 1 &&
        b.height <= h.height + 1 &&
        (Math.abs(b.width - h.width) <= 1 || Math.abs(b.height - h.height) <= 1),
      scale: b.width / 2400,
    };
  };
};

// B18 probe: did not reproduce with a fixed-size host (fit scale is 0.25 in
// every browser/React/StrictMode combination, also from onCanvasMount).
for (const strict of [false, true]) {
  const name = strict ? " (StrictMode)" : "";
  test(`fitContentToView called from onCanvasMount fits large content${name}`, async () => {
    const measure = await renderBig(strict, true);
    await expect.poll(measure).toMatchObject({ fits: true });
  });
  test(`fitContentToView after settle fits large content${name}`, async () => {
    const measure = await renderBig(strict, false);
    await expect.poll(measure).toMatchObject({ fits: true });
  });
}
