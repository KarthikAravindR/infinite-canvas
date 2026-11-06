# Changelog

## [3.5.0](https://github.com/KarthikAravindR/infinite-canvas/compare/v3.4.1...v3.5.0) (2026-11-06)


### Features

* **a11y:** pan to focused elements; hide decorative parts from screen readers ([#68](https://github.com/KarthikAravindR/infinite-canvas/issues/68)) ([41034e3](https://github.com/KarthikAravindR/infinite-canvas/commit/41034e36cec4db36447f5d5b75be1cf279786e31))
* **a11y:** panOnFocus is on by default, so set panOnFocus={false} to keep 3.4.1's behavior of not panning to focused elements ([647a990](https://github.com/KarthikAravindR/infinite-canvas/commit/647a990e36ce87e7f37f569969b36ca2ea0fc43b))
* **a11y:** the canvas now has role="group" instead of role="application", so tests that query getByRole("application") must change; the background and scrollbars are now hidden from screen readers ([647a990](https://github.com/KarthikAravindR/infinite-canvas/commit/647a990e36ce87e7f37f569969b36ca2ea0fc43b))
* onZoom reports translateX, translateY and scale ([#67](https://github.com/KarthikAravindR/infinite-canvas/issues/67)) ([f099932](https://github.com/KarthikAravindR/infinite-canvas/commit/f09993275b59d5d253e2aeaf2812afe390f9dda8))
* onZoom's type changed from (event: Event) =&gt; void to (zoomState: ZoomState) =&gt; void, and ZoomState is a new export; the old callback was never called ([647a990](https://github.com/KarthikAravindR/infinite-canvas/commit/647a990e36ce87e7f37f569969b36ca2ea0fc43b))


### Bug Fixes

* a bottom-center custom component's centering transform overrides any transform from its className ([647a990](https://github.com/KarthikAravindR/infinite-canvas/commit/647a990e36ce87e7f37f569969b36ca2ea0fc43b))
* block panning before the gesture starts, let mousedown reach React, pan with the primary button only ([#62](https://github.com/KarthikAravindR/infinite-canvas/issues/62)) ([d7d15ca](https://github.com/KarthikAravindR/infinite-canvas/commit/d7d15ca9d0b58c058baa1303a51d184715e82f55))
* ctrl+wheel over a scroll-only EventBlocker now zooms the canvas, and ctrl+wheel or pinch over a zoom-only blocker is left to the browser ([647a990](https://github.com/KarthikAravindR/infinite-canvas/commit/647a990e36ce87e7f37f569969b36ca2ea0fc43b))
* imperative methods work in Safari, and the package imports without a browser ([#61](https://github.com/KarthikAravindR/infinite-canvas/issues/61)) ([92fe0d3](https://github.com/KarthikAravindR/infinite-canvas/commit/92fe0d3d4f679020f283b1bd0bcc0123cbe064a1))
* no React 19 warnings, centered bottom-center components, and a separate background pattern per canvas ([#65](https://github.com/KarthikAravindR/infinite-canvas/issues/65)) ([71996d7](https://github.com/KarthikAravindR/infinite-canvas/commit/71996d761d1fc06eb799965897c66fff982dd0a7))
* **package:** correct exports and types for every module resolution; build with Vite 8 ([675f35c](https://github.com/KarthikAravindR/infinite-canvas/commit/675f35c77e91dd299baffb81f24cb0779e22b96a))
* scroll-to-node lands correctly after zoom changes and for off-screen nodes ([#66](https://github.com/KarthikAravindR/infinite-canvas/issues/66)) ([34bc2dd](https://github.com/KarthikAravindR/infinite-canvas/commit/34bc2dd991794208be9f49501bc2a6771bf9fd78))
* scrollbars appear on mount, follow container resizes, and drag at a steady speed ([#64](https://github.com/KarthikAravindR/infinite-canvas/issues/64)) ([dba340b](https://github.com/KarthikAravindR/infinite-canvas/commit/dba340b5a61a1bbfcb416f6127f767f2d34c45bc))
* the canvas and its methods stop updating, and stop calling onZoom, once the canvas unmounts ([647a990](https://github.com/KarthikAravindR/infinite-canvas/commit/647a990e36ce87e7f37f569969b36ca2ea0fc43b))
* the default background pattern id is now ric-pattern-&lt;id&gt; instead of patternId-, and DOM-element custom components no longer receive a zoomState prop ([647a990](https://github.com/KarthikAravindR/infinite-canvas/commit/647a990e36ce87e7f37f569969b36ca2ea0fc43b))
* the imperative methods run on the next animation frame instead of when the browser is idle ([647a990](https://github.com/KarthikAravindR/infinite-canvas/commit/647a990e36ce87e7f37f569969b36ca2ea0fc43b))
* **types:** CanvasState.d3Zoom is typed with SVGSVGElement instead of SVGAElement ([647a990](https://github.com/KarthikAravindR/infinite-canvas/commit/647a990e36ce87e7f37f569969b36ca2ea0fc43b))
* wheel works from the first render, zoom-only blockers stop ctrl+wheel, and zoom limits can change after mount ([#63](https://github.com/KarthikAravindR/infinite-canvas/issues/63)) ([829eae0](https://github.com/KarthikAravindR/infinite-canvas/commit/829eae0e06ae96c6612d1ddd532f3df6504c13bb))

## [3.4.1](https://github.com/KarthikAravindR/infinite-canvas/compare/v3.4.0...v3.4.1) (2025-03-19)


### Bug Fixes

* added run build in release ([94b9dbb](https://github.com/KarthikAravindR/infinite-canvas/commit/94b9dbb96e5230859c445e3c1cb227a27077f9ab))

## [3.3.2](https://github.com/KarthikAravindR/infinite-canvas/compare/v3.3.1...v3.3.2) (2025-03-19)


### Bug Fixes

* auto release creation ([7734705](https://github.com/KarthikAravindR/infinite-canvas/commit/7734705229686f00801cc128b2faf29403dad2e9))

## [3.3.1](https://github.com/KarthikAravindR/infinite-canvas/compare/v3.3.0...v3.3.1) (2025-03-19)


### Bug Fixes

* added tag log in release action ([500d2c0](https://github.com/KarthikAravindR/infinite-canvas/commit/500d2c08e52a0018bf199c8659838e8d0e689d39))

# 3.3.0 (2025-03-19)

### History: All changes

- publish action test ([abc4ea5](https://github.com/KarthikAravindR/infinite-canvas/commit/abc4ea5b753db068ba6628e6f312e484675187e6))
