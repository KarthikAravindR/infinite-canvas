import {
  useEffect,
  useImperativeHandle,
  useCallback,
  Fragment,
  forwardRef,
  useRef,
  useState
} from "react";
import type { DragEvent } from "react";

import { ZOOM_CONFIGS } from "../../helpers/constants.ts";
import {
  clampValue,
  getScrollSize,
  onScrollHandler
} from "../../helpers/utils.ts";

import styles from "./styles.module.css";

export const ScrollBar = forwardRef(
  (
    {
      scale,
      startingPosition,
      offset = { x: 0, y: 0 },
      color = "gray",
      thickness = "8px",
      minSize = "15px",
      verticalOffsetHeight,
      horizontalOffsetWidth,
      onScrollDeltaHandler,
      getContainerOffset
    }: {
      scale: number;
      startingPosition?: { x: number; y: number };
      offset?: { x: number; y: number };
      color?: string;
      thickness?: string;
      minSize?: string;
      verticalOffsetHeight: number;
      horizontalOffsetWidth: number;
      onScrollDeltaHandler: (scrollDelta: {
        deltaX: number;
        deltaY: number;
      }) => void;
      getContainerOffset: (isVertical: boolean) => number;
    },
    ref
  ) => {
    const [initialVerticalSize, initialHorizontalSize] = getScrollSize(scale);
    const verticalScrollBarRef = useRef<HTMLDivElement | null>(null);
    const horizontalScrollBarRef = useRef<HTMLDivElement | null>(null);
    const userDragConfig = useRef<{
      isDragging: boolean;
      vertical: boolean;
      initialOffset: number;
    }>({
      isDragging: false,
      vertical: true,
      initialOffset: 0
    });

    const [scrollConfig, setScrollConfig] = useState<{
      scale: number;
      horizontalSize: number;
      horizontalPos: number;
      horizontalSizeDecrease: number;
      verticalSize: number;
      verticalPos: number;
      verticalSizeDecrease: number;
    }>({
      scale,
      horizontalSize: initialHorizontalSize,
      horizontalPos: startingPosition
        ? startingPosition.x
        : (horizontalOffsetWidth ?? 0) / ZOOM_CONFIGS.SCROLL_POS_RATIO,
      horizontalSizeDecrease: 0,
      verticalSize: initialVerticalSize,
      verticalPos: startingPosition
        ? startingPosition.y
        : (verticalOffsetHeight ?? 0) / ZOOM_CONFIGS.SCROLL_POS_RATIO,
      verticalSizeDecrease: 0
    });

    useImperativeHandle(ref, () => ({
      resetScrollPos: () => {
        setScrollConfig((state) => ({
          ...state,
          horizontalPos:
            (horizontalOffsetWidth ?? 0) / ZOOM_CONFIGS.SCROLL_POS_RATIO,
          verticalPos:
            (verticalOffsetHeight ?? 0) / ZOOM_CONFIGS.SCROLL_POS_RATIO,
          verticalSizeDecrease: 0,
          horizontalSizeDecrease: 0
        }));
      },
      onScrollDeltaChangeHandler,
      onMouseUp: handleMouseUp
    }));

    useEffect(
      function onScaleChangeHandler() {
        setScrollConfig((state) => {
          let newScrollPos: { horizontalPos: number; verticalPos: number };
          const [newVerticalSize, newHorizontalSize] = getScrollSize(scale);
          const ratio = scale / state.scale || 0;
          if (scale < state.scale) {
            newScrollPos = {
              horizontalPos: state.horizontalPos - ratio,
              verticalPos: state.verticalPos - ratio
            };
            return {
              ...state,
              scale,
              horizontalSize: newHorizontalSize,
              verticalSize: newVerticalSize,
              ...newScrollPos
            };
          }

          newScrollPos = {
            horizontalPos: state.horizontalPos + ratio,
            verticalPos: state.verticalPos + ratio
          };
          return {
            ...state,
            scale,
            horizontalSize: newHorizontalSize,
            verticalSize: newVerticalSize,
            ...newScrollPos
          };
        });
      },
      [scale]
    );

    function onScrollDeltaChangeHandler(scrollDelta: {
      deltaX: number;
      deltaY: number;
    }) {
      if (userDragConfig.current.isDragging) return;
      setScrollConfig((state) => {
        const [newVerticalScrollData, newVerticalSizeDecrease] =
          onScrollHandler({
            state,
            scrollDelta,
            scrollLength: verticalOffsetHeight ?? 0
          });
        const [newHorizontalScrollData, newHorizontalSizeDecrease] =
          onScrollHandler({
            isVertical: false,
            state,
            scrollDelta,
            scrollLength: horizontalOffsetWidth ?? 0
          });
        return {
          ...state,
          horizontalPos: newHorizontalScrollData,
          horizontalSizeDecrease: newHorizontalSizeDecrease,
          verticalPos: newVerticalScrollData,
          verticalSizeDecrease: newVerticalSizeDecrease
        };
      });
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    const handleScroll = useCallback(
      function resizeHandler(event: MouseEvent, isVertical: boolean) {
        if (!userDragConfig.current.isDragging) return;
        event.stopPropagation();
        const { movementX, movementY, clientX, clientY, offsetX, offsetY } =
          event;

        if (userDragConfig.current.initialOffset < 1) {
          userDragConfig.current.initialOffset = isVertical ? offsetY : offsetX;
        }

        const diff = isVertical ? movementY : movementX;
        const scrollPos =
          (isVertical ? clientY : clientX) -
          userDragConfig.current.initialOffset -
          getContainerOffset(isVertical);

        const getConfigValues = (config: typeof scrollConfig) => {
          if (isVertical) {
            return [
              "verticalPos",
              config.verticalSize,
              verticalOffsetHeight ?? 0,
              offset.y
            ] as const;
          }
          return [
            "horizontalPos",
            config.horizontalSize,
            horizontalOffsetWidth ?? 0,
            offset.x
          ] as const;
        };

        setScrollConfig((state) => {
          const [stateKey, scrollSize, scrollLimit, scrollOffset] =
            getConfigValues(state);
          return {
            ...state,
            [stateKey]: clampValue({
              value: scrollPos,
              min: scrollOffset,
              max: scrollLimit - scrollSize
            })
          };
        });

        const newDeltaValue = () => {
          const newDelta =
            diff > 0
              ? diff + ZOOM_CONFIGS.SCROLL_DELTA_DIFF
              : diff - ZOOM_CONFIGS.SCROLL_DELTA_DIFF;
          return isVertical
            ? { deltaX: 0, deltaY: newDelta }
            : {
                deltaX: newDelta,
                deltaY: 0
              };
        };

        const endLimit =
          (isVertical
            ? (verticalOffsetHeight ?? 0)
            : (horizontalOffsetWidth ?? 0)) -
          (isVertical
            ? scrollConfig.verticalSize
            : scrollConfig.horizontalSize);
        const isEndReached = scrollPos <= 0 || scrollPos >= endLimit;

        if (!isEndReached && diff !== 0) onScrollDeltaHandler(newDeltaValue());
      },
      [verticalOffsetHeight, horizontalOffsetWidth, offset.y, offset.x]
    );

    const handleMouseUp = useCallback(
      function mouseUpHandler() {
        userDragConfig.current.isDragging = false;
        userDragConfig.current.initialOffset = 0;
        window.removeEventListener("mousemove", (event) =>
          handleScroll(event, userDragConfig.current.vertical)
        );
        window.removeEventListener("mouseup", handleMouseUp);
      },
      [handleScroll]
    );

    const handleMouseDown = useCallback(
      function mouseDownHandler() {
        window.addEventListener("mousemove", (event) =>
          handleScroll(event, userDragConfig.current.vertical)
        );
        window.addEventListener("mouseup", handleMouseUp);
      },
      [handleScroll, handleMouseUp]
    );

    const dragHandler = (event: DragEvent) => {
      event.stopPropagation();
    };

    return (
      <Fragment>
        <div
          className={styles.verticalScrollBar}
          style={{ width: thickness }}
          ref={verticalScrollBarRef}
        >
          <div
            data-id="vertical-scrollbar"
            style={{
              insetBlockStart: `${clampValue({
                value: scrollConfig.verticalPos,
                min: offset.y,
                max: verticalOffsetHeight
              })}px`,
              height: `${
                scrollConfig.verticalSize + scrollConfig.verticalSizeDecrease
              }px`,
              background: color,
              minHeight: minSize
            }}
            onMouseDownCapture={(event) => {
              event.stopPropagation();
              userDragConfig.current = {
                ...userDragConfig.current,
                isDragging: true,
                vertical: true
              };
              handleMouseDown();
            }}
            onDragEnterCapture={dragHandler}
            onDragCapture={dragHandler}
            onDragEndCapture={dragHandler}
          />
        </div>
        <div
          className={styles.horizontalScrollBar}
          ref={horizontalScrollBarRef}
          style={{ height: thickness }}
        >
          <div
            data-id="horizontal-scrollbar"
            style={{
              insetInlineStart: `${clampValue({
                value: scrollConfig.horizontalPos,
                min: offset.x,
                max: horizontalOffsetWidth
              })}px`,
              width: `${
                scrollConfig.horizontalSize +
                scrollConfig.horizontalSizeDecrease
              }px`,
              background: color,
              minWidth: minSize
            }}
            onMouseDownCapture={(event) => {
              event.stopPropagation();
              userDragConfig.current = {
                ...userDragConfig.current,
                isDragging: true,
                vertical: false
              };
              handleMouseDown();
            }}
            onDragEnterCapture={dragHandler}
            onDragCapture={dragHandler}
            onDragEndCapture={dragHandler}
          />
        </div>
      </Fragment>
    );
  }
);
