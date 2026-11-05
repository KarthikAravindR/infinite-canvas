import { useEffect, useState } from "react";

import {
  BLOCK_EVENTS_CLASS,
  SCROLL_NODE_POSITIONS,
  ZOOM_CONFIGS,
} from "./constants";

export const useOnScreen = (
  ref: { current: Element },
  { rootMargin = "0px", triggerOnce = false } = {},
) => {
  const [isIntersecting, setIntersecting] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(function scrollObserve() {
    const element = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Update our state when observer callback fires
        setIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && triggerOnce) {
          observer.unobserve(element);
        }
      },
      {
        rootMargin,
      },
    );
    if (element) {
      observer.observe(element);
    }
    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  return isIntersecting;
};

export const clampValue = ({
  value,
  min = 0,
  max,
}: {
  value: number;
  min?: number;
  max: number;
}) => Math.min(Math.max(value, min), max);

export const getUpdatedNodePosition = ({
  position,
  svgBounds,
  nodeBounds,
  currentTranslateX,
  currentTranslateY,
  currentScale,
  updatedScale,
  customOffset,
}: {
  position: string;
  svgBounds: { x: number; y: number; width: number; height: number };
  nodeBounds: { x: number; y: number; width: number; height: number };
  currentTranslateX: number;
  currentTranslateY: number;
  currentScale: number;
  updatedScale: number;
  customOffset: { x: number; y: number };
}) => {
  const k = updatedScale / currentScale;
  const [vertical, horizontal] = position.split("-");
  if (!Object.values(SCROLL_NODE_POSITIONS).includes(position)) {
    return { updatedX: currentTranslateX * k, updatedY: currentTranslateY * k };
  }
  const align = (side: string, size: number, view: number) =>
    side === "left" || side === "top"
      ? 0
      : side === "center"
        ? (view - size) / 2
        : view - size;
  return {
    updatedX:
      align(horizontal, nodeBounds.width * k, svgBounds.width) -
      (nodeBounds.x - svgBounds.x) * k +
      currentTranslateX * k +
      customOffset.x,
    updatedY:
      align(vertical, nodeBounds.height * k, svgBounds.height) -
      (nodeBounds.y - svgBounds.y) * k +
      currentTranslateY * k +
      customOffset.y,
  };
};

export const getScrollSize = (scale: number) => {
  const [verticalRatio, horizontalRatio] = [Math.max(scale - 0.2, 0.2), scale];
  return [
    ZOOM_CONFIGS.INITIAL_SCROLLBAR_SIZE / verticalRatio,
    ZOOM_CONFIGS.INITIAL_SCROLLBAR_SIZE / horizontalRatio,
  ];
};

const getScrollData = ({
  isVertical,
  state,
  scrollDelta,
}: {
  isVertical: boolean;
  state: {
    verticalPos: number;
    horizontalPos: number;
    verticalSize: number;
    horizontalSize: number;
    verticalSizeDecrease: number;
    horizontalSizeDecrease: number;
  };
  scrollDelta: { deltaX: number; deltaY: number };
}) => {
  const scrollPos = isVertical ? state.verticalPos : state.horizontalPos;
  const scrollSize = isVertical ? state.verticalSize : state.horizontalSize;
  const scrollSizeDecrease = isVertical
    ? state.verticalSizeDecrease
    : state.horizontalSizeDecrease;
  const deltaValue = isVertical ? scrollDelta.deltaY : scrollDelta.deltaX;

  return { scrollPos, scrollSize, scrollSizeDecrease, deltaValue };
};

export const onScrollHandler = ({
  isVertical = true,
  state,
  scrollDelta,
  scrollLength,
}: {
  isVertical?: boolean;
  state: {
    verticalPos: number;
    horizontalPos: number;
    verticalSize: number;
    horizontalSize: number;
    verticalSizeDecrease: number;
    horizontalSizeDecrease: number;
  };
  scrollDelta: { deltaX: number; deltaY: number };
  scrollLength: number;
}) => {
  const { scrollPos, scrollSize, scrollSizeDecrease, deltaValue } =
    getScrollData({
      isVertical,
      state,
      scrollDelta,
    });
  const scrollRatio = deltaValue / 10 || 0;
  const sizeRatio = deltaValue / 100 || 0;
  let [newScrollData, newSizeDecrease] = [
    scrollPos + scrollRatio,
    scrollSizeDecrease,
  ];
  if (newScrollData < 1) {
    newScrollData = 0;
    newSizeDecrease -= Math.abs(sizeRatio);
  } else if (newScrollData + scrollSize > scrollLength) {
    const scrollLimit =
      scrollLength -
      Math.max(
        ZOOM_CONFIGS.MIN_SCROLLBAR_SIZE,
        scrollSize - Math.abs(newSizeDecrease),
      );
    newScrollData = Math.min(
      scrollLength - (scrollSize + newSizeDecrease),
      scrollLimit,
    );
    newSizeDecrease -= sizeRatio;
  } else if (newSizeDecrease !== 0) {
    const isUserAtEnd = newScrollData > scrollLength / 2;
    newScrollData = isUserAtEnd ? scrollLength - scrollSize : 0;
    if (isUserAtEnd) {
      newSizeDecrease -= sizeRatio;
      if (newSizeDecrease <= 0) newSizeDecrease = 0;
    } else {
      newSizeDecrease += Math.abs(sizeRatio);
      if (newSizeDecrease >= 0) newSizeDecrease = 0;
    }
  }
  return [newScrollData, newSizeDecrease];
};

export const getBlockClassName = (
  shouldBlockScroll: boolean,
  shouldBlockZoom: boolean,
  shouldBlockPan: boolean,
) => {
  if (shouldBlockScroll && shouldBlockZoom && shouldBlockPan) {
    return `${BLOCK_EVENTS_CLASS.BLOCK_EVENTS}`;
  }

  return [
    shouldBlockScroll && `${BLOCK_EVENTS_CLASS.BLOCK_SCROLL_CLASS}`,
    shouldBlockZoom && `${BLOCK_EVENTS_CLASS.BLOCK_ZOOM_CLASS}`,
    shouldBlockPan && `${BLOCK_EVENTS_CLASS.BLOCK_PAN_CLASS}`,
  ]
    .filter(Boolean)
    .join(" ");
};

export const shouldBlockPanEvent = (event: { target: HTMLElement }) => {
  const target = event.target as HTMLElement;
  if (
    target.closest(`.${BLOCK_EVENTS_CLASS.BLOCK_PAN_CLASS}`) ||
    target.closest(`.${BLOCK_EVENTS_CLASS.BLOCK_EVENTS}`)
  ) {
    return true;
  }
  return false;
};

export const shouldBlockEvent = (event: {
  target: HTMLElement;
  ctrlKey: boolean;
  metaKey: boolean;
}) => {
  const target = event.target as HTMLElement;

  if (target.closest(`.${BLOCK_EVENTS_CLASS.BLOCK_EVENTS}`)) return true;

  const isCtrlKeyPressed = event.ctrlKey || event.metaKey;
  if (
    !isCtrlKeyPressed &&
    target.closest(`.${BLOCK_EVENTS_CLASS.BLOCK_SCROLL_CLASS}`)
  ) {
    return true;
  }
  if (
    isCtrlKeyPressed &&
    target.closest(`.${BLOCK_EVENTS_CLASS.BLOCK_ZOOM_CLASS}`)
  ) {
    return true;
  }
  return false;
};
