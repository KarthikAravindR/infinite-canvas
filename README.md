# React-Infinite-Canvas

An Infinite Canvas Component for React where you can place your component anywhere on the canvas with zoom in, zoom out and panning functionality. It also supports custom components to control the canvas.

![Screen Recording 2024-04-17 at 12 25 16 PM](https://github.com/KarthikAravindR/infinite-canvas/assets/41736896/33c9a983-0b8c-4740-95ab-4172fa9cfe55)

### Contents

- [Installation](#installation)
- [Usage](#usage)
- [Props](#props)
- [Handle methods](#handle-methods)
- [EventBlocker](#eventblocker)
- [Accessibility](#accessibility)
- [Support policy](#support-policy)

## Installation

```sh
npm install react-infinite-canvas
```

## Usage

StackBlitz Example: https://stackblitz.com/edit/react-infinite-canvas-workflow?file=src/App.tsx&terminal=dev

Give the canvas a parent with a fixed size. The canvas fills its parent. The example uses `createRoot`, which needs React 18 or later. On React 17, use `ReactDOM.render`.

```tsx
import { useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  COMPONENT_POSITIONS,
  ReactInfiniteCanvas,
  type ReactInfiniteCanvasHandle,
  type ZoomState,
} from "react-infinite-canvas";

// A custom component that is a React component (not a DOM element)
// receives a `zoomState` prop.
const ZoomLabel = ({
  zoomState,
}: {
  zoomState?: ZoomState & { minZoom: number; maxZoom: number };
}) => <span>Zoom: {zoomState?.scale.toFixed(2)}</span>;

const InfiniteCanvas = () => {
  const canvasRef = useRef<ReactInfiniteCanvasHandle>(null);
  return (
    <div style={{ width: "700px", height: "400px", border: "1px solid red" }}>
      <ReactInfiniteCanvas
        ref={canvasRef}
        onCanvasMount={(canvas) => {
          canvas.fitContentToView({ scale: 1 });
        }}
        onZoom={({ translateX, translateY, scale }) => {
          console.log(translateX, translateY, scale);
        }}
        customComponents={[
          {
            component: <ZoomLabel />,
            position: COMPONENT_POSITIONS.TOP_LEFT,
            offset: { x: 120, y: 10 },
          },
        ]}
      >
        <div style={{ width: "200px", height: "200px", background: "red" }}>
          Content
        </div>
      </ReactInfiniteCanvas>
    </div>
  );
};

createRoot(document.getElementById("root")!).render(<InfiniteCanvas />);
```

## Props

`ReactInfiniteCanvas` takes these props. Only `children` is required.

| Prop               | Type                                          | Default | Description                                                                                                           |
| ------------------ | --------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------- |
| `children`         | `JSX.Element`                                 | -       | One element to place on the canvas.                                                                                   |
| `className`        | `string`                                      | `""`    | Class name added to the element that holds the canvas.                                                                |
| `ref`              | `ReactInfiniteCanvasHandle`                   | -       | Gives access to the [handle methods](#handle-methods).                                                                |
| `minZoom`          | `number`                                      | `0.1`   | Lowest scale the user can zoom to.                                                                                    |
| `maxZoom`          | `number`                                      | `4`     | Highest scale the user can zoom to.                                                                                   |
| `panOnScroll`      | `boolean`                                     | `true`  | `true`: the wheel pans, and ctrl+wheel zooms. `false`: the wheel zooms.                                               |
| `panOnFocus`       | `boolean`                                     | `true`  | Pans to center an element that gets focus while it is outside the visible area. See [Pan on focus](#pan-on-focus).    |
| `scrollBarConfig`  | `object`                                      | `{}`    | Scrollbar settings. The scrollbar is off unless `renderScrollBar` is `true`. See [scrollBarConfig](#scrollbarconfig). |
| `backgroundConfig` | `BackgroundProps`                             | `{}`    | Settings for the dotted background. See [backgroundConfig](#backgroundconfig).                                        |
| `customComponents` | `Array<object>`                               | `[]`    | Components drawn on top of the canvas that do not move with it. See [customComponents](#customcomponents).            |
| `onCanvasMount`    | `(handle: ReactInfiniteCanvasHandle) => void` | -       | Called once per mount (twice under React Strict Mode in development). Gets the [handle methods](#handle-methods).     |
| `onZoom`           | `(zoomState: ZoomState) => void`              | -       | Called on every transform change. See [onZoom](#onzoom).                                                              |

### onZoom

`onZoom` receives `{ translateX, translateY, scale }`. The canvas calls it for every change:

- panning and wheel scrolling
- ctrl+wheel zoom
- every animation frame of `fitContentToView`, `scrollNodeToCenter`, `scrollNodeHandler` and `scrollContentHorizontallyCenter`

The canvas always calls the latest `onZoom` you passed.

### Pan on focus

When an element inside the canvas gets focus and sits partly or fully outside the visible area, the canvas pans to center it. This lets keyboard users reach every element.

- It does not pan when the element is already fully visible.
- It does not pan during a press (mouse, touch or pen).
- It still pans for focus inside an `EventBlocker` that blocks panning, so keyboard users can reach it.

Set `panOnFocus={false}` to turn this off.

### scrollBarConfig

The scrollbar is **off** by default. Set `renderScrollBar: true` to show it.

| Field              | Type                       | Default                                  | Description                       |
| ------------------ | -------------------------- | ---------------------------------------- | --------------------------------- |
| `renderScrollBar`  | `boolean`                  | `undefined` (off)                        | Shows the scrollbars when `true`. |
| `startingPosition` | `{ x: number; y: number }` | one third of the canvas width and height | Starting position of the thumbs.  |
| `offset`           | `{ x: number; y: number }` | `{ x: 0, y: 0 }`                         | Moves the scrollbars.             |
| `color`            | `string`                   | `"gray"`                                 | Color of the thumbs.              |
| `thickness`        | `string`                   | `"8px"`                                  | Width of the bars.                |
| `minSize`          | `string`                   | `"15px"`                                 | Smallest size of a thumb.         |

### backgroundConfig

The canvas draws a dotted background. Use `backgroundConfig` to change it, or `backgroundConfig={{ disable: true }}` to remove it. You can also render `Background` yourself.

| Field             | Type      | Default     | Description                                        |
| ----------------- | --------- | ----------- | -------------------------------------------------- |
| `disable`         | `boolean` | `undefined` | Removes the background when `true`.                |
| `id`              | `string`  | `""`        | Id for the SVG pattern. Generated when empty.      |
| `size`            | `number`  | `1`         | Dot size at scale 1.                               |
| `minSize`         | `number`  | `0.3`       | Smallest dot size, however far the user zooms out. |
| `gap`             | `number`  | `20`        | Space between dots at scale 1.                     |
| `className`       | `string`  | `""`        | Class name for the background element.             |
| `minOpacity`      | `number`  | `0.8`       | Lowest dot opacity.                                |
| `maxOpacity`      | `number`  | `1`         | Highest dot opacity.                               |
| `elementColor`    | `string`  | `"#afb7c7"` | Dot color.                                         |
| `backgroundColor` | CSS color | `undefined` | Background color.                                  |

`maxZoom` and `zoomTransform` also exist on `Background`. The canvas sets both for you. A value you pass in `backgroundConfig` overrides the canvas's value.

### customComponents

Each item draws one component on top of the canvas. It stays in place while the canvas moves.

| Field       | Type                       | Default                           | Description                                                                               |
| ----------- | -------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------- |
| `component` | `JSX.Element`              | required                          | The element to draw.                                                                      |
| `position`  | `string`                   | `COMPONENT_POSITIONS.BOTTOM_LEFT` | One of the `COMPONENT_POSITIONS` values. An unknown value falls back to the default.      |
| `offset`    | `{ x: number; y: number }` | `{ x: 0, y: 0 }`                  | Distance in pixels from the chosen edge. For `BOTTOM_CENTER`, `x` shifts from the center. |
| `overlap`   | `boolean`                  | `true`                            | `true`: draws above the canvas content (`z-index` 20). `false`: `z-index` 1.              |
| `className` | `string`                   | `""`                              | Class name for the wrapper around the component.                                          |

`COMPONENT_POSITIONS` has `TOP_LEFT`, `TOP_RIGHT`, `BOTTOM_LEFT` and `BOTTOM_CENTER`.

If `component` is a React component, it receives a `zoomState` prop: `{ translateX, translateY, scale, minZoom, maxZoom }`. DOM elements such as `<button>` do not receive it.

## Handle methods

Get the handle from the `ref` or from `onCanvasMount`. All five methods take one options object. Every field is optional unless noted.

| Method                                     | What it does                                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `scrollNodeToCenter(options)`              | Moves an element to the center of the view.                                                                |
| `scrollNodeHandler(options)`               | Moves an element to a position you choose.                                                                 |
| `scrollContentHorizontallyCenter(options)` | Centers the content horizontally. Keeps the vertical position and scale.                                   |
| `fitContentToView(options)`                | Scales the content to fit the view and centers it horizontally. See [fitContentToView](#fitcontenttoview). |
| `getCanvasState()`                         | Returns the current position and the d3 objects (d3-zoom, the library this canvas uses for pan and zoom).  |

The animated methods call `onZoom` on every frame.

### scrollNodeToCenter and scrollNodeHandler

`scrollNodeToCenter` is `scrollNodeHandler` with `position` set to `SCROLL_NODE_POSITIONS.CENTER_CENTER`.

| Option                 | Type                       | Default                            | Description                                                                                                                 |
| ---------------------- | -------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `nodeElement`          | `HTMLElement`              | -                                  | The element to move. Without it, nothing happens.                                                                           |
| `offset`               | `{ x: number; y: number }` | `{ x: 0, y: 0 }`                   | Extra shift in pixels.                                                                                                      |
| `scale`                | `number`                   | current scale                      | Scale to end at.                                                                                                            |
| `shouldUpdateMaxScale` | `boolean`                  | `true`                             | Applies only when you pass `scale`. `true`: the end scale is at least the current scale. `false`: `scale` is used as given. |
| `maxScale`             | `number`                   | none                               | Upper limit for the end scale.                                                                                              |
| `transitionDuration`   | `number`                   | `300`                              | Animation time in milliseconds.                                                                                             |
| `position`             | `string`                   | `SCROLL_NODE_POSITIONS.TOP_CENTER` | `scrollNodeHandler` only. Where the element ends up. An unknown value keeps the current position.                           |

`SCROLL_NODE_POSITIONS` has `TOP_LEFT`, `TOP_RIGHT`, `TOP_CENTER`, `BOTTOM_LEFT`, `BOTTOM_CENTER`, `BOTTOM_RIGHT`, `CENTER_LEFT`, `CENTER_RIGHT` and `CENTER_CENTER`.

### scrollContentHorizontallyCenter

| Option               | Type     | Default | Description                       |
| -------------------- | -------- | ------- | --------------------------------- |
| `offset`             | `number` | `0`     | Extra horizontal shift in pixels. |
| `transitionDuration` | `number` | `300`   | Animation time in milliseconds.   |

### fitContentToView

It always centers the content horizontally. It centers the content vertically only when the content's width divided by its height is larger than the view's. Otherwise the content sits at the top. `offset` then shifts it.

| Option         | Type                       | Default          | Description                                                                                      |
| -------------- | -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| `duration`     | `number`                   | `500`            | Animation time in milliseconds.                                                                  |
| `offset`       | `{ x: number; y: number }` | `{ x: 0, y: 0 }` | Extra shift in pixels.                                                                           |
| `scale`        | `number`                   | fitted scale     | Scale to use. Without it, the canvas picks the scale that fits, between `minZoom` and `maxZoom`. |
| `maxZoomLimit` | `number`                   | `1`              | Highest scale the fitted scale can reach. Ignored when you pass `scale`.                         |

### getCanvasState

Returns `{ canvasNode, zoomNode, currentPosition, d3Zoom }`. `canvasNode` and `zoomNode` are d3 selections. `currentPosition` is a d3 `ZoomTransform`: `{ k, x, y }` plus methods. `d3Zoom` is the d3 zoom behavior.

## EventBlocker

Wrap content in `EventBlocker` when it needs its own mouse or wheel behavior, such as a scrollable list or a map. Each flag defaults to `true`.

```tsx
import { EventBlocker } from "react-infinite-canvas";

<EventBlocker shouldBlockScroll shouldBlockZoom={false}>
  <div style={{ overflow: "auto", height: 200 }}>...</div>
</EventBlocker>;
```

| Prop                | Type      | Default | Effect over the blocker                                                                            |
| ------------------- | --------- | ------- | -------------------------------------------------------------------------------------------------- |
| `shouldBlockPan`    | `boolean` | `true`  | Dragging does not pan the canvas.                                                                  |
| `shouldBlockScroll` | `boolean` | `true`  | The plain wheel does not pan the canvas. Ctrl+wheel still zooms it.                                |
| `shouldBlockZoom`   | `boolean` | `true`  | Ctrl+wheel does not zoom the canvas, and cmd+wheel does not pan it. The plain wheel still pans it. |

With `shouldBlockScroll` and `shouldBlockZoom` both `true`, the canvas ignores every wheel event over the blocker.

With the default `panOnScroll`, the canvas zooms only on ctrl+wheel. Most browsers report a trackpad pinch as ctrl+wheel, so a pinch zooms too. Cmd+wheel pans.

Over a blocker with `shouldBlockZoom`, the canvas does not handle ctrl+wheel or a pinch, so the browser's own page zoom may apply.

## Accessibility

- The canvas has `role="group"` and `aria-label="Infinite canvas"`.
- The background and the scrollbars are hidden from screen readers.
- `panOnFocus` brings focused elements into view.

## Support policy

| Area                         | 3.x                                                | v4                                         |
| ---------------------------- | -------------------------------------------------- | ------------------------------------------ |
| React                        | 17-19 (tests run on 18 and 19)                     | `^18.0.0 \|\| ^19.0.0` (tests run on both) |
| Browsers                     | Latest 2 versions of Chrome, Edge, Firefox, Safari | Same                                       |
| Node (server rendering only) | 20.19+                                             | Active LTS lines                           |
| TypeScript (consumers)       | Types checked with 5.9 and 7.x                     | Same                                       |
