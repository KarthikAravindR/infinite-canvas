import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  useRef,
  type JSX
} from "react";
import { pointer, select, type Selection } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";

import {
  Background,
  type BackgroundProps
} from "./components/Background/background.tsx";
import {
  ZOOM_CONFIGS,
  SCROLL_NODE_POSITIONS,
  COMPONENT_POSITIONS
} from "./helpers/constants.ts";
import {
  clampValue,
  getUpdatedNodePosition,
  shouldBlockEvent,
  shouldBlockPanEvent
} from "./helpers/utils.ts";

import styles from "./App.module.css";
import { ScrollBar } from "./components/ScrollBar/scrollbar.tsx";

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const TIME_TO_WAIT = isSafari ? 600 : 300;

export interface ReactInfiniteCanvasProps {
  children: JSX.Element;
  className?: string;
  ref?: React.ForwardedRef<ReactInfiniteCanvasHandle>;
  minZoom?: number;
  maxZoom?: number;
  panOnScroll?: boolean;
  renderScrollBar?: boolean;
  scrollBarConfig?: {
    startingPosition?: {
      x: number;
      y: number;
    };
    offset?: {
      x: number;
      y: number;
    };
    color?: string;
    thickness?: string;
    minSize?: string;
  };
  backgroundConfig?: BackgroundProps;
  customComponents?: Array<{
    component: JSX.Element;
    position?: string;
    offset?: { x: number; y: number };
    overlap?: boolean;
    className?: string;
  }>;
  onCanvasMount?: (functions: ReactInfiniteCanvasHandle) => void;
  onZoom?: (event: Event) => void;
}

interface CanvasState {
  canvasNode: Selection<
    SVGSVGElement | HTMLDivElement | null,
    unknown,
    null,
    undefined
  >;
  zoomNode: Selection<
    SVGGElement | HTMLDivElement | null,
    unknown,
    null,
    undefined
  >;
  currentPosition: { k: number; x: number; y: number };
  d3Zoom: ZoomBehavior<HTMLDivElement | SVGAElement, unknown>;
}

export type ReactInfiniteCanvasHandle = {
  scrollNodeToCenter: ({
    nodeElement,
    offset,
    scale,
    shouldUpdateMaxScale,
    maxScale,
    transitionDuration
  }: {
    nodeElement?: HTMLElement;
    offset?: { x: number; y: number };
    scale?: number;
    shouldUpdateMaxScale?: boolean;
    maxScale?: number;
    transitionDuration?: number;
  }) => void;
  scrollNodeHandler: ({
    nodeElement,
    offset,
    scale,
    shouldUpdateMaxScale,
    maxScale,
    transitionDuration,
    position
  }: {
    nodeElement?: HTMLElement;
    offset?: { x: number; y: number };
    scale?: number;
    shouldUpdateMaxScale?: boolean;
    maxScale?: number;
    transitionDuration?: number;
    position?: string;
  }) => void;
  scrollContentHorizontallyCenter: ({
    offset,
    transitionDuration
  }: {
    offset?: number;
    transitionDuration?: number;
  }) => void;
  fitContentToView: ({
    duration,
    offset,
    scale,
    maxZoomLimit
  }: {
    duration?: number;
    offset?: { x: number; y: number };
    scale?: number;
    maxZoomLimit?: number;
  }) => void;
  getCanvasState: () => CanvasState;
};

interface ReactInfiniteCanvasRendererProps extends ReactInfiniteCanvasProps {
  children: React.ReactElement<object, string>;
  innerRef: React.ForwardedRef<ReactInfiniteCanvasHandle>;
}

export const ReactInfiniteCanvas: React.FC<ReactInfiniteCanvasProps> =
  forwardRef<ReactInfiniteCanvasHandle, ReactInfiniteCanvasProps>(
    ({ children, ...restProps }, ref) => {
      const wrapperRef = React.useRef<HTMLDivElement>(null);
      return (
        <ReactInfiniteCanvasRenderer innerRef={ref} {...restProps}>
          <div
            ref={wrapperRef}
            style={{ width: "max-content", height: "max-content" }}
          >
            {children}
          </div>
        </ReactInfiniteCanvasRenderer>
      );
    }
  );

const ReactInfiniteCanvasRenderer = memo(
  ({
    children,
    className = "",
    innerRef: ref,
    minZoom = ZOOM_CONFIGS.DEFAULT_MIN_ZOOM,
    maxZoom = ZOOM_CONFIGS.DEFAULT_MAX_ZOOM,
    panOnScroll = true,
    customComponents = [],
    renderScrollBar = true,
    scrollBarConfig = {},
    backgroundConfig = {},
    onCanvasMount = () => {}
  }: ReactInfiniteCanvasRendererProps) => {
    const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
    const canvasWrapperBounds = useRef<DOMRect | null>(null);
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const canvasRef = useRef<any>(null);
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const zoomContainerRef = useRef<any>(null);
    const scrollBarRef = useRef<{
      onScrollDeltaChangeHandler: (scrollDelta: {
        deltaX: number;
        deltaY: number;
      }) => void;
      resetScrollPos: () => void;
    }>(null);
    const flowRendererRef = (
      children as React.ReactElement & { ref: React.RefObject<HTMLElement> }
    ).ref;
    const isUserPressed = useRef<boolean | null>(null);

    const d3Zoom = useMemo(() => {
      return zoom<SVGAElement | HTMLDivElement, unknown>().scaleExtent([
        minZoom,
        maxZoom
      ]);
    }, [maxZoom, minZoom]);
    const d3Selection = useRef(select(canvasRef.current).call(d3Zoom));

    const [zoomTransform, setZoomTransform] = useState({
      translateX: 0,
      translateY: 0,
      scale: 1
    });

    useImperativeHandle(ref, () => ({
      scrollNodeToCenter: ({
        nodeElement,
        offset,
        scale,
        shouldUpdateMaxScale,
        maxScale,
        transitionDuration
      }: {
        nodeElement?: HTMLElement | undefined;
        offset?: { x: number; y: number };
        scale?: number;
        shouldUpdateMaxScale?: boolean;
        maxScale?: number;
        transitionDuration?: number;
      }) =>
        scrollNodeHandler({
          nodeElement,
          offset,
          scale,
          shouldUpdateMaxScale,
          maxScale,
          transitionDuration,
          position: SCROLL_NODE_POSITIONS.CENTER_CENTER
        }),
      scrollNodeHandler,
      scrollContentHorizontallyCenter,
      fitContentToView,
      getCanvasState
    }));

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(function zoomAndPanHandler() {
      d3Selection.current = select(canvasRef.current).call(d3Zoom);
      const zoomNode = select(zoomContainerRef.current);
      canvasWrapperBounds.current = canvasWrapperRef.current
        ? canvasWrapperRef.current.getBoundingClientRect()
        : null;

      d3Zoom
        .filter((event: { type: string; ctrlKey: boolean }) => {
          if (event.type === "mousedown" && !isUserPressed.current) {
            isUserPressed.current = true;
            onMouseDown();
          }

          return event.ctrlKey || event.type !== "wheel";
        })
        .on(
          "zoom",
          (event: {
            sourceEvent: { ctrlKey: boolean };
            type: string;
            transform: { k: number; x: number; y: number };
          }) => {
            const nativeTarget = (event.sourceEvent as MouseEvent)
              ?.target as HTMLElement;
            if (nativeTarget && shouldBlockPanEvent({ target: nativeTarget }))
              return;
            if (event.sourceEvent?.ctrlKey === false && event.type === "zoom") {
              canvasWrapperRef.current?.classList.add(styles.panning);
            }

            const zoomTransform = event.transform;
            const { x: translateX, y: translateY, k: scale } = zoomTransform;
            const div = zoomContainerRef.current;
            setZoomTransform({ translateX, translateY, scale });
            if (isSafari && div) {
              div.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
            } else {
              zoomNode.attr(
                "transform",
                `translate(${translateX},${translateY}) scale(${scale})`
              );
            }
          }
        );

      d3Zoom.on("end", () => {
        isUserPressed.current = false;
        canvasWrapperRef.current?.classList.remove(styles.panning);
      });

      onCanvasMount({
        scrollNodeToCenter: ({
          nodeElement,
          offset,
          scale,
          shouldUpdateMaxScale,
          maxScale,
          transitionDuration
        }: {
          nodeElement?: HTMLElement;
          offset?: { x: number; y: number };
          scale?: number;
          shouldUpdateMaxScale?: boolean;
          maxScale?: number;
          transitionDuration?: number;
        }) =>
          scrollNodeHandler({
            nodeElement,
            offset,
            scale,
            shouldUpdateMaxScale,
            maxScale,
            transitionDuration,
            position: SCROLL_NODE_POSITIONS.CENTER_CENTER
          }),
        scrollNodeHandler,
        scrollContentHorizontallyCenter,
        fitContentToView,
        getCanvasState
      });
    }, []);

    d3Selection.current
      .call(zoom)
      // Override the default wheel event listener
      .on(
        "wheel.zoom",
        (event: {
          preventDefault: () => void;
          ctrlKey: boolean;
          metaKey: boolean;
          deltaY: number;
          deltaX: number;
          target: EventTarget;
        }) => {
          if (
            shouldBlockEvent({ ...event, target: event.target as HTMLElement })
          )
            return;

          event.preventDefault();

          const currentZoom = d3Selection.current.property("__zoom").k || 1;

          if (panOnScroll && !event.ctrlKey) {
            const scrollDeltaValue = {
              deltaX: event.deltaX,
              deltaY: event.deltaY
            };
            scrollBarRef.current?.onScrollDeltaChangeHandler(scrollDeltaValue);
            onScrollDeltaHandler(scrollDeltaValue);
          } else {
            const nextZoom = currentZoom * 2 ** (-event.deltaY * 0.01);
            const selection = d3Selection.current;
            if (selection) {
              d3Zoom.scaleTo(
                selection as Selection<
                  SVGAElement | HTMLDivElement,
                  unknown,
                  null,
                  undefined
                >,
                nextZoom,
                pointer(event)
              );
            }
          }
        },
        { passive: false, capture: true }
      );

    const onScrollDeltaHandler = (scrollDelta: {
      deltaX: number;
      deltaY: number;
    }) => {
      const currentZoom = d3Selection.current.property("__zoom").k || 1;
      const selection = d3Selection.current;
      if (selection) {
        d3Zoom.translateBy(
          selection as Selection<
            SVGAElement | HTMLDivElement,
            unknown,
            null,
            undefined
          >,
          -(scrollDelta.deltaX / currentZoom),
          -(scrollDelta.deltaY / currentZoom)
        );
      }
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    const fitContentToView = useCallback(
      function fitContentHandler({
        duration = 500,
        offset = { x: 0, y: 0 },
        scale,
        maxZoomLimit = ZOOM_CONFIGS.FIT_TO_VIEW_MAX_ZOOM,
        disableVerticalCenter = false
      }: {
        duration?: number;
        offset?: { x: number; y: number };
        scale?: number;
        maxZoomLimit?: number;
        disableVerticalCenter?: boolean;
      }) {
        requestIdleCallback(
          () => {
            if (!flowRendererRef.current) return;
            const canvasNode = select(canvasRef.current);
            const contentBounds =
              flowRendererRef.current.getBoundingClientRect();
            const currentZoom = d3Selection.current.property("__zoom").k || 1;
            const containerBounds = canvasRef.current?.getBoundingClientRect();
            const { width: containerWidth = 0, height: containerHeight = 0 } =
              containerBounds || {};
            const scaleDiff = 1 / currentZoom;
            const contentWidth = contentBounds.width * scaleDiff;
            const contentHeight = contentBounds.height * scaleDiff;
            const heightRatio = containerHeight / contentHeight;
            const widthRatio = containerWidth / contentWidth;

            const newScale =
              scale ??
              clampValue({
                value: Math.min(
                  maxZoomLimit,
                  Math.min(heightRatio, widthRatio)
                ),
                min: minZoom,
                max: maxZoom
              });

            // below code calculates the translateX and translateY values to
            // center the content horizontally and if disableVerticalCenter is false center the content vertically
            const newWidth = containerWidth - contentWidth * newScale;
            const newHeight = containerHeight - contentHeight * newScale;

            const canCenterVertically =
              !disableVerticalCenter && heightRatio > widthRatio;

            const baseTranslateX = newWidth / 2;
            const baseTranslateY = canCenterVertically ? newHeight / 2 : 0;

            const translateX = baseTranslateX + offset.x;
            const translateY = baseTranslateY + offset.y;

            const newTransform = zoomIdentity
              .translate(translateX, translateY)
              .scale(newScale);
            setZoomTransform({ translateX, translateY, scale: newScale });
            scrollBarRef.current?.resetScrollPos();

            canvasNode
              .transition()
              .duration(duration)
              .call(d3Zoom.transform, newTransform);
          },
          { timeout: TIME_TO_WAIT }
        );
      },
      [maxZoom, minZoom]
    );

    const scrollNodeHandler = ({
      nodeElement,
      offset = { x: 0, y: 0 },
      scale,
      shouldUpdateMaxScale = true,
      maxScale,
      transitionDuration = 300,
      position = SCROLL_NODE_POSITIONS.TOP_CENTER
    }: {
      nodeElement?: HTMLElement;
      offset?: { x: number; y: number };
      scale?: number;
      shouldUpdateMaxScale?: boolean;
      maxScale?: number;
      transitionDuration?: number;
      position?: string;
    }) => {
      requestIdleCallback(
        () => {
          if (!nodeElement) return;
          const zoomLevel = d3Selection.current.property("__zoom");
          const {
            k: currentScale,
            x: currentTranslateX,
            y: currentTranslateY
          } = zoomLevel;
          const canvasNode = select(canvasRef.current);

          const getUpdatedScale = () => {
            const getClampedScale = (scale: number) => {
              if (!maxScale) return scale;
              return Math.min(maxScale, scale);
            };

            if (!scale) return getClampedScale(currentScale);
            let updatedScale = scale;
            if (shouldUpdateMaxScale) {
              updatedScale = Math.max(scale, currentScale);
            }
            return getClampedScale(updatedScale);
          };

          const updatedScale = getUpdatedScale();

          // calculating svgBounds again because its width might be different if rightPanel is opened
          const svgBounds = canvasRef.current.getBoundingClientRect();
          const nodeBounds = nodeElement.getBoundingClientRect();
          const { updatedX, updatedY } = getUpdatedNodePosition({
            position,
            svgBounds,
            nodeBounds,
            currentTranslateX,
            currentTranslateY,
            currentScale,
            updatedScale,
            customOffset: { x: offset.x, y: offset.y }
          });

          const newTransform = zoomIdentity
            .translate(updatedX, updatedY)
            .scale(updatedScale);

          canvasNode
            // @ts-ignore
            .transition()
            .duration(transitionDuration)
            .call(d3Zoom.transform, newTransform);
        },
        { timeout: TIME_TO_WAIT }
      );
    };

    const scrollContentHorizontallyCenter = ({
      offset = 0,
      transitionDuration = 300
    }: {
      offset?: number;
      transitionDuration?: number;
    }) => {
      if (!flowRendererRef.current) return;
      requestIdleCallback(
        () => {
          const zoomLevel = d3Selection.current.property("__zoom");
          const { k: scale, y: translateY } = zoomLevel;
          const canvasNode = select(canvasRef.current);

          // calculating svgBounds again because its width might be different if rightPanel is opened
          const svgBounds = canvasRef.current.getBoundingClientRect();
          const nodeBounds = flowRendererRef.current.getBoundingClientRect();
          const scaleDiff = 1 / scale;
          const nodeBoundsWidth = nodeBounds.width * scaleDiff;

          const updatedX =
            (svgBounds.width - nodeBoundsWidth * scale) / 2 + offset;

          setZoomTransform({
            ...zoomTransform,
            translateX: updatedX
          });

          const newTransform = zoomIdentity
            .translate(updatedX, translateY)
            .scale(scale);

          canvasNode
            // @ts-ignore
            .transition()
            .duration(transitionDuration)
            .call(d3Zoom.transform, newTransform);
        },
        { timeout: TIME_TO_WAIT }
      );
    };

    const getCanvasState = () => {
      return {
        canvasNode: select(canvasRef.current),
        zoomNode: select(zoomContainerRef.current),
        currentPosition: d3Selection.current.property("__zoom"),
        d3Zoom
      };
    };

    const onMouseDown = () => {
      const bodyElement = document.body;

      if (bodyElement) {
        const mouseDownEvent = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          view: window
        });

        // Dispatch the mousedown event on the body element
        bodyElement.dispatchEvent(mouseDownEvent);
      }
    };

    const getContainerOffset = useCallback(function offsetHandler(
      isVertical = true
    ) {
      const bounds = canvasWrapperBounds.current;
      return isVertical ? (bounds?.top ?? 0) : (bounds?.left ?? 0);
    }, []);

    return (
      <div className={styles.container}>
        <div
          ref={canvasWrapperRef}
          className={`${styles.canvasWrapper} ${className}`}
        >
          {isSafari ? (
            <div ref={canvasRef} className={styles.canvas}>
              <div ref={zoomContainerRef}>
                <div className={styles.contentWrapper}>{children}</div>
              </div>
            </div>
          ) : (
            <svg
              ref={canvasRef}
              className={styles.canvas}
              aria-label="Infinite canvas"
              role="application"
            >
              <g ref={zoomContainerRef}>
                <foreignObject
                  x={ZOOM_CONFIGS.INITIAL_POSITION_X}
                  y={ZOOM_CONFIGS.INITIAL_POSITION_Y}
                  width={ZOOM_CONFIGS.DEFAULT_LAYOUT}
                  height={ZOOM_CONFIGS.DEFAULT_LAYOUT}
                >
                  {children}
                </foreignObject>
              </g>
            </svg>
          )}
        </div>
        {backgroundConfig.disable ? null : (
          <Background
            maxZoom={maxZoom}
            zoomTransform={zoomTransform}
            {...backgroundConfig}
          />
        )}
        {renderScrollBar && canvasWrapperRef.current && (
          <ScrollBar
            ref={scrollBarRef}
            scale={zoomTransform.scale}
            {...scrollBarConfig}
            verticalOffsetHeight={canvasWrapperRef.current.offsetHeight}
            horizontalOffsetWidth={canvasWrapperRef.current.offsetWidth}
            getContainerOffset={getContainerOffset}
            onScrollDeltaHandler={onScrollDeltaHandler}
          />
        )}
        {customComponents.map((config) => {
          const {
            component,
            position = COMPONENT_POSITIONS.BOTTOM_LEFT,
            offset = { x: 0, y: 0 },
            overlap = true,
            className = ""
          } = config;
          const componentKey = `${position}-${offset.x}-${offset.y}-${overlap}`;
          return (
            <CustomComponentWrapper
              key={componentKey}
              component={component}
              position={position}
              offset={offset}
              overlap={overlap}
              zoomState={{ ...zoomTransform, minZoom, maxZoom }}
              className={className}
            />
          );
        })}
      </div>
    );
  }
);

const CustomComponentWrapper = ({
  component,
  position,
  offset,
  overlap,
  zoomState,
  className
}: {
  component: JSX.Element;
  position: string;
  offset: { x: number; y: number };
  overlap: boolean;
  zoomState: {
    translateX: number;
    translateY: number;
    scale: number;
    minZoom: number;
    maxZoom: number;
  };
  className: string;
}) => {
  const positionStyle = useMemo(() => {
    const updatedPos = Object.values(COMPONENT_POSITIONS).includes(position)
      ? position
      : COMPONENT_POSITIONS.BOTTOM_LEFT;

    const [positionY, positionX] = updatedPos.split("-");
    return {
      [positionX]: offset.x,
      [positionY]: offset.y
    };
  }, [position, offset]);

  const updatedComponent = React.cloneElement(component, {
    zoomState
  });

  return (
    <div
      style={{
        position: "absolute",
        ...positionStyle,
        zIndex: overlap ? 20 : 1
      }}
      className={className}
    >
      {updatedComponent}
    </div>
  );
};
