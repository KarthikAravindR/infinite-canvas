import { expect, test } from "vitest";
import { COMPONENT_POSITIONS } from "../../src/main";
import { renderCanvas } from "./helpers";

const offset = { x: 10, y: 20 };

test("custom components sit at their corner plus offset", async () => {
  const { host } = await renderCanvas({
    customComponents: [
      {
        component: <div data-testid="tl" style={{ width: 30, height: 30 }} />,
        position: COMPONENT_POSITIONS.TOP_LEFT,
        offset,
      },
      {
        component: <div data-testid="tr" style={{ width: 30, height: 30 }} />,
        position: COMPONENT_POSITIONS.TOP_RIGHT,
        offset,
      },
      {
        component: <div data-testid="bl" style={{ width: 30, height: 30 }} />,
        position: COMPONENT_POSITIONS.BOTTOM_LEFT,
        offset,
      },
    ],
  });
  const h = host.getBoundingClientRect();
  const rect = (id: string) =>
    host.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect() as DOMRect;
  const near = (a: number, b: number) =>
    expect(Math.abs(a - b)).toBeLessThanOrEqual(1);

  const tl = rect("tl");
  near(tl.left - h.left, 10);
  near(tl.top - h.top, 20);
  const tr = rect("tr");
  near(h.right - tr.right, 10);
  near(tr.top - h.top, 20);
  const bl = rect("bl");
  near(bl.left - h.left, 10);
  near(h.bottom - bl.bottom, 20);
});

test("overlap sets the stacking order", async () => {
  const { host } = await renderCanvas({
    customComponents: [
      {
        component: <div data-testid="over" />,
        position: COMPONENT_POSITIONS.TOP_LEFT,
        overlap: true,
      },
      {
        component: <div data-testid="under" />,
        position: COMPONENT_POSITIONS.TOP_RIGHT,
        overlap: false,
      },
    ],
  });
  const z = (id: string) =>
    (host.querySelector(`[data-testid="${id}"]`)?.parentElement as HTMLElement)
      .style.zIndex;
  expect(z("over")).toBe("20");
  expect(z("under")).toBe("1");
});

test("function components receive zoomState", async () => {
  let received: { scale: number } | undefined;
  const Probe = (props: { zoomState?: { scale: number } }) => {
    received = props.zoomState;
    return <div />;
  };
  await renderCanvas({ customComponents: [{ component: <Probe /> }] });
  expect(received?.scale).toBe(1);
});

test("background draws a dot pattern; backgroundConfig.disable removes it", async () => {
  const { host, rerender } = await renderCanvas();
  expect(host.querySelectorAll("pattern").length).toBe(1);
  await rerender({ backgroundConfig: { disable: true } });
  expect(host.querySelectorAll("pattern").length).toBe(0);
});
