export const ZOOM_CONFIGS = {
  DEFAULT_MIN_ZOOM: 0.1,
  DEFAULT_MAX_ZOOM: 4,
  FIT_TO_VIEW_MAX_ZOOM: 1,
  ZOOM_RATIO: 0.5,
  TIME_FRAME: 500,
  INITIAL_POSITION_X: 0,
  INITIAL_POSITION_Y: 0,
  SCROLL_POS_RATIO: 3,
  LAYOUT_FALLBACK: 500,
  DEFAULT_LAYOUT: 1000000,
  INITIAL_SCROLLBAR_SIZE: 50,
  MIN_SCROLLBAR_SIZE: 15,
  SCROLL_DELTA_DIFF: 1.5,
  NODE_Y_OFFSET: 110,
};

export const COMPONENT_POSITIONS = {
  TOP_LEFT: "top-left",
  TOP_RIGHT: "top-right",
  BOTTOM_LEFT: "bottom-left",
  BOTTOM_CENTER: "bottom-center",
};

export const SCROLL_NODE_POSITIONS = {
  ...COMPONENT_POSITIONS,
  TOP_CENTER: "top-center",
  BOTTOM_RIGHT: "bottom-right",
  CENTER_LEFT: "center-left",
  CENTER_RIGHT: "center-right",
  CENTER_CENTER: "center-center",
};

export const BLOCK_EVENTS_CLASS = {
  BLOCK_EVENTS: "react-infinite-canvas-block-events",
  BLOCK_SCROLL_CLASS: "react-infinite-canvas-block-scroll",
  BLOCK_ZOOM_CLASS: "react-infinite-canvas-block-zoom",
  BLOCK_PAN_CLASS: "react-infinite-canvas-block-pan",
};
