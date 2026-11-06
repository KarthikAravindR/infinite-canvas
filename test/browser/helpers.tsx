import {
  type ComponentProps,
  createRef,
  type ReactNode,
  StrictMode,
} from "react";
import { test } from "vitest";
import { server } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  EventBlocker,
  ReactInfiniteCanvas,
  type ReactInfiniteCanvasHandle,
} from "../../src/main";

export type Point = { x: number; y: number };

/** Messages passed to console.error/warn in the current test (filled by setup.ts). */
export const consoleCalls: string[] = [];

/** `failsOn("webkit")("name", fn)` is test.fails on those browsers, plain test elsewhere. */
export const failsOn = (
  ...browsers: Array<"chromium" | "firefox" | "webkit">
): typeof test.fails =>
  (browsers as string[]).includes(server.browser) ? test.fails : test;

export const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** Wait one frame, then for CSS transitions (the Safari path has a 10ms one) to end. */
export async function settle() {
  await nextFrame();
  await Promise.all(
    document.getAnimations().map((a) => a.finished.catch(() => {})),
  );
}

/** On-screen top-left of an element: the public surface the tests assert on. */
export const contentPosition = (el: Element): Point => {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top };
};

export const center = (el: Element): Point => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/** Dispatch a MouseEvent on whatever element is at (x, y), like a real pointer. */
export function fire(type: string, { x, y }: Point, init: MouseEventInit = {}) {
  const target = document.elementFromPoint(x, y);
  if (!target) throw new Error(`no element at ${x},${y}`);
  target.dispatchEvent(
    new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window, // d3 reads event.view to attach its window listeners
      clientX: x,
      clientY: y,
      screenX: x,
      screenY: y,
      button: 0,
      buttons: type === "mouseup" ? 0 : 1,
      ...init,
    }),
  );
  return target;
}

/** mousedown at `from`, `steps` mousemoves (one per frame), mouseup at `to`. */
export async function drag(
  from: Point,
  to: Point,
  steps = 5,
  init: MouseEventInit = {},
) {
  fire("mousedown", from, init);
  let prev = from;
  for (let i = 1; i <= steps; i++) {
    const p = {
      x: from.x + ((to.x - from.x) * i) / steps,
      y: from.y + ((to.y - from.y) * i) / steps,
    };
    fire("mousemove", p, {
      ...init,
      movementX: p.x - prev.x,
      movementY: p.y - prev.y,
    });
    prev = p;
    await nextFrame();
  }
  fire("mouseup", to, init);
  await settle();
}

export async function wheel(at: Point, init: WheelEventInit) {
  const target = document.elementFromPoint(at.x, at.y);
  if (!target) throw new Error(`no element at ${at.x},${at.y}`);
  target.dispatchEvent(
    new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX: at.x,
      clientY: at.y,
      ...init,
    }),
  );
  await settle();
}

type CanvasProps = Partial<ComponentProps<typeof ReactInfiniteCanvas>>;

/**
 * 600x400 canvas host. Content is 400x300 at the canvas origin: a pan-blocked
 * box at (0,0)-(200,150), an 80x60 node at (300,220). (500,330) is empty canvas.
 */
export async function renderCanvas(
  props: CanvasProps = {},
  blockedProps: ComponentProps<"div"> = {},
  options: { strict?: boolean; extraContent?: ReactNode } = {},
) {
  const ref = createRef<ReactInfiniteCanvasHandle>();
  const ui = (p: CanvasProps) => {
    const tree = (
      <div data-testid="host" style={{ width: 600, height: 400 }}>
        <ReactInfiniteCanvas ref={ref} {...p}>
          <div
            data-testid="content"
            style={{ width: 400, height: 300, position: "relative" }}
          >
            <EventBlocker
              shouldBlockPan
              shouldBlockScroll={false}
              shouldBlockZoom={false}
            >
              <div
                data-testid="blocked"
                style={{ width: 200, height: 150 }}
                {...blockedProps}
              />
            </EventBlocker>
            <div
              data-testid="node"
              style={{
                position: "absolute",
                left: 300,
                top: 220,
                width: 80,
                height: 60,
              }}
            />
            {options.extraContent}
          </div>
        </ReactInfiniteCanvas>
      </div>
    );
    return options.strict ? <StrictMode>{tree}</StrictMode> : tree;
  };
  const screen = await render(ui(props));
  await settle();
  const el = (id: string) => screen.getByTestId(id).element();
  const host = el("host");
  const at = (x: number, y: number): Point => {
    const r = host.getBoundingClientRect();
    return { x: r.left + x, y: r.top + y };
  };
  return {
    ref,
    host,
    content: el("content"),
    node: el("node"),
    blocked: el("blocked"),
    empty: at(500, 330),
    at,
    unmount: screen.unmount,
    rerender: async (next: CanvasProps) => {
      await screen.rerender(ui(next));
      await settle();
    },
  };
}
