import { type Selection, pointer, select } from "d3-selection";
import { type ZoomBehavior, zoom, zoomIdentity } from "d3-zoom";
import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  useRef,
  type JSX,
} from "react";

import {
  Background,
  type BackgroundProps,
} from "./components/Background/background";
import {
  COMPONENT_POSITIONS,
  SCROLL_NODE_POSITIONS,
  ZOOM_CONFIGS,
} from "./helpers/constants";
import {
  clampValue,
  getUpdatedNodePosition,
  shouldBlockEvent,
  shouldBlockPanEvent,
} from "./helpers/utils";

import styles from "./App.module.css";
import { ScrollBar } from "./components/ScrollBar/scrollbar";

const isSafari =
  typeof navigator !== "undefined" &&
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export interface ReactInfiniteCanvasProps {
  children: JSX.Element;
  className?: string;
  ref?: React.ForwardedRef<ReactInfiniteCanvasHandle>;
  minZoom?: number;
  maxZoom?: number;
  panOnScroll?: boolean;
  panOnFocus?: boolean;
  scrollBarConfig?: {
    renderScrollBar?: boolean;
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
  onZoom?: (zoomState: ZoomState) => void;
}

export interface CanvasState {
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
  d3Zoom: ZoomBehavior<HTMLDivElement | SVGSVGElement, unknown>;
}

export type ZoomState = {
  translateX: number;
  translateY: number;
  scale: number;
};

export type ReactInfiniteCanvasHandle = {
  scrollNodeToCenter: ({
    nodeElement,
    offset,
    scale,
    shouldUpdateMaxScale,
    maxScale,
    transitionDuration,
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
    position,
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
    transitionDuration,
  }: {
    offset?: number;
    transitionDuration?: number;
  }) => void;
  fitContentToView: ({
    duration,
    offset,
    scale,
    maxZoomLimit,
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
  contentRef: React.RefObject<HTMLDivElement | null>;
}

export const ReactInfiniteCanvas: React.FC<ReactInfiniteCanvasProps> =
  forwardRef<ReactInfiniteCanvasHandle, ReactInfiniteCanvasProps>(
    ({ children, ...restProps }, ref) => {
      const wrapperRef = React.useRef<HTMLDivElement>(null);
      return (
        <ReactInfiniteCanvasRenderer
          {...restProps}
          innerRef={ref}
          contentRef={wrapperRef}
        >
          <div
            ref={wrapperRef}
            style={{ width: "max-content", height: "max-content" }}
          >
            {children}
          </div>
        </ReactInfiniteCanvasRenderer>
      );
    },
  );

const ReactInfiniteCanvasRenderer = memo(
  ({
    children,
    className = "",
    innerRef: ref,
    contentRef: flowRendererRef,
    minZoom = ZOOM_CONFIGS.DEFAULT_MIN_ZOOM,
    maxZoom = ZOOM_CONFIGS.DEFAULT_MAX_ZOOM,
    panOnScroll = true,
    panOnFocus = true,
    customComponents = [],
    scrollBarConfig = {},
    backgroundConfig = {},
    onCanvasMount = () => {},
    onZoom,
  }: ReactInfiniteCanvasRendererProps) => {
    const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
    const canvasWrapperBounds = useRef<DOMRect | null>(null);
    const canvasRef = useRef<any>(null);
    const zoomContainerRef = useRef<any>(null);
    const scrollBarRef = useRef<{
      onScrollDeltaChangeHandler: (scrollDelta: {
        deltaX: number;
        deltaY: number;
      }) => void;
      resetScrollPos: () => void;
    }>(null);
    const isUserPressed = useRef<boolean | null>(null);
    const [wrapperSize, setWrapperSize] = useState<{
      width: number;
      height: number;
    } | null>(null);

    // Created once: the mount effect attaches it, so a replacement would never be attached.
    const [d3Zoom] = useState(() =>
      zoom<SVGSVGElement | HTMLDivElement, unknown>(),
    );
    useEffect(() => {
      d3Zoom.scaleExtent([minZoom, maxZoom]);
    }, [d3Zoom, minZoom, maxZoom]);
    const d3Selection = useRef<Selection<
      SVGSVGElement | HTMLDivElement,
      unknown,
      null,
      undefined
    > | null>(null);
    // Props the mount-time listeners read at event time.
    const latest = useRef({ panOnScroll, panOnFocus, onZoom });
    useEffect(() => {
      latest.current = { panOnScroll, panOnFocus, onZoom };
    });

    const [zoomTransform, setZoomTransform] = useState({
      translateX: 0,
      translateY: 0,
      scale: 1,
    });

    useImperativeHandle(ref, () => ({
      scrollNodeToCenter: ({
        nodeElement,
        offset,
        scale,
        shouldUpdateMaxScale,
        maxScale,
        transitionDuration,
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
          position: SCROLL_NODE_POSITIONS.CENTER_CENTER,
        }),
      scrollNodeHandler,
      scrollContentHorizontallyCenter,
      fitContentToView,
      getCanvasState,
    }));

    useEffect(function zoomAndPanHandler() {
      const selection = select(
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- canvasRef is any because it holds a <div> or an <svg>; v4 types it
        canvasRef.current as SVGSVGElement | HTMLDivElement,
      ).call(d3Zoom);
      d3Selection.current = selection;
      // Same name as the wheel listener d3 registered in .call() above, so it
      // replaces d3's: plain wheel pans, ctrl+wheel (or panOnScroll={false}) zooms.
      selection.on(
        "wheel.zoom",
        (event: WheelEvent) => {
          // Pass the fields explicitly: spreading an event drops ctrlKey/metaKey.
          if (
            shouldBlockEvent({
              // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a wheel event's target is always an element
              target: event.target as HTMLElement,
              ctrlKey: event.ctrlKey,
              metaKey: event.metaKey,
            })
          ) {
            return;
          }
          event.preventDefault();

          const currentZoom = selection.property("__zoom").k || 1;

          if (latest.current.panOnScroll && !event.ctrlKey) {
            const scrollDeltaValue = {
              deltaX: event.deltaX,
              deltaY: event.deltaY,
            };
            scrollBarRef.current?.onScrollDeltaChangeHandler(scrollDeltaValue);
            onScrollDeltaHandler(scrollDeltaValue);
          } else {
            const nextZoom = currentZoom * 2 ** (-event.deltaY * 0.01);
            d3Zoom.scaleTo(selection, nextZoom, pointer(event));
          }
        },
        { passive: false, capture: true },
      );
      const zoomNode = select(zoomContainerRef.current);
      canvasWrapperBounds.current = canvasWrapperRef.current
        ? canvasWrapperRef.current.getBoundingClientRect()
        : null;

      d3Zoom
        .filter((event: MouseEvent | WheelEvent | TouchEvent) => {
          if (event.type === "wheel") return event.ctrlKey;
          // d3's default: primary button only, no ctrl+click
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- d3 passes any; a TouchEvent has no button, and undefined is falsy, as in d3's default filter
          if ((event as MouseEvent).button || event.ctrlKey) return false;
          if (
            event.target instanceof Element &&
            shouldBlockPanEvent({ target: event.target })
          )
            return false;
          if (event.type === "mousedown" && !isUserPressed.current) {
            isUserPressed.current = true;
            onMouseDown();
          }
          return true;
        })
        .on(
          "zoom",
          (event: {
            sourceEvent: { ctrlKey: boolean } | null;
            type: string;
            transform: { k: number; x: number; y: number };
          }) => {
            // Unmounted: a drag can still emit zoom events after the cleanup.
            if (!canvasWrapperRef.current) return;
            if (event.sourceEvent?.ctrlKey === false && event.type === "zoom") {
              canvasWrapperRef.current?.classList.add(styles.panning);
            }

            const transform = event.transform;
            const { x: translateX, y: translateY, k: scale } = transform;
            const div = zoomContainerRef.current;
            setZoomTransform({ translateX, translateY, scale });
            if (isSafari && div) {
              div.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
            } else {
              zoomNode.attr(
                "transform",
                `translate(${translateX},${translateY}) scale(${scale})`,
              );
            }
            latest.current.onZoom?.({ translateX, translateY, scale });
          },
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
          transitionDuration,
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
            position: SCROLL_NODE_POSITIONS.CENTER_CENTER,
          }),
        scrollNodeHandler,
        scrollContentHorizontallyCenter,
        fitContentToView,
        getCanvasState,
      });

      const wrapper = canvasWrapperRef.current;
      const measure = () =>
        wrapper &&
        setWrapperSize((prev) =>
          prev?.width === wrapper.offsetWidth &&
          prev.height === wrapper.offsetHeight
            ? prev
            : { width: wrapper.offsetWidth, height: wrapper.offsetHeight },
        );
      measure();
      // jsdom has no ResizeObserver; the size is then only measured on mount.
      const resizeObserver =
        typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(measure);
      if (wrapper) resizeObserver?.observe(wrapper);

      // A press (mouse, touch or pen) focuses what it lands on; panning then would
      // move the content under the pointer. Tracked here because d3's filter
      // returns before it sees presses on pan-blocked targets.
      let pressed = false;
      const onDown = () => {
        pressed = true;
      };
      const onUp = () => {
        pressed = false;
      };

      // Keyboard focus on an off-screen element pans it into view. The browser also
      // scrolls the overflow:hidden wrapper to reveal it; undo that hidden offset.
      const onFocusIn = (event: FocusEvent) => {
        const target = event.target;
        if (!latest.current.panOnFocus || pressed || !wrapper) return;
        if (!(target instanceof HTMLElement)) return;
        const t = target.getBoundingClientRect();
        const w = wrapper.getBoundingClientRect();
        if (
          t.left < w.left ||
          t.top < w.top ||
          t.right > w.right ||
          t.bottom > w.bottom
        ) {
          scrollNodeHandler({
            nodeElement: target,
            position: SCROLL_NODE_POSITIONS.CENTER_CENTER,
          });
        }
      };
      const resetScroll = () => {
        if (wrapper) {
          wrapper.scrollTop = 0;
          wrapper.scrollLeft = 0;
        }
      };
      wrapper?.addEventListener("pointerdown", onDown, true);
      window.addEventListener("pointerup", onUp, true);
      window.addEventListener("pointercancel", onUp, true);
      wrapper?.addEventListener("focusin", onFocusIn);
      wrapper?.addEventListener("scroll", resetScroll);

      // On unmount (and Strict Mode's simulated one), remove d3's listeners and ours.
      return () => {
        selection.interrupt(); // stop an in-flight transition
        wrapper?.removeEventListener("pointerdown", onDown, true);
        window.removeEventListener("pointerup", onUp, true);
        window.removeEventListener("pointercancel", onUp, true);
        wrapper?.removeEventListener("focusin", onFocusIn);
        wrapper?.removeEventListener("scroll", resetScroll);
        resizeObserver?.disconnect();
        selection.on(".zoom", null);
      };
      // oxlint-disable-next-line react-hooks/exhaustive-deps -- known bug: the onCanvasMount handle keeps mount-time props such as maxZoom, fixed in a follow-up fix: PR
    }, []);

    const onScrollDeltaHandler = (scrollDelta: {
      deltaX: number;
      deltaY: number;
    }) => {
      const selection = d3Selection.current;
      if (selection) {
        const currentZoom = selection.property("__zoom").k || 1;
        d3Zoom.translateBy(
          selection,
          -(scrollDelta.deltaX / currentZoom),
          -(scrollDelta.deltaY / currentZoom),
        );
      }
    };

    const fitContentToView = useCallback(
      function fitContentHandler({
        duration = 500,
        offset = { x: 0, y: 0 },
        scale,
        maxZoomLimit = ZOOM_CONFIGS.FIT_TO_VIEW_MAX_ZOOM,
        disableVerticalCenter = false,
      }: {
        duration?: number;
        offset?: { x: number; y: number };
        scale?: number;
        maxZoomLimit?: number;
        disableVerticalCenter?: boolean;
      }) {
        requestAnimationFrame(() => {
          if (!flowRendererRef.current || !canvasRef.current) return;
          const canvasNode = select(canvasRef.current);
          const contentBounds = flowRendererRef.current.getBoundingClientRect();
          const currentZoom = d3Selection.current?.property("__zoom").k || 1;
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
              value: Math.min(maxZoomLimit, Math.min(heightRatio, widthRatio)),
              min: minZoom,
              max: maxZoom,
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
            // oxlint-disable-next-line typescript/unbound-method -- zoom.transform reads its first argument, never this; .call passes the selection as that argument
            .call(d3Zoom.transform, newTransform);
        });
      },
      // oxlint-disable-next-line react-hooks/exhaustive-deps -- d3Zoom and flowRendererRef never change identity
      [maxZoom, minZoom],
    );

    const scrollNodeHandler = ({
      nodeElement,
      offset = { x: 0, y: 0 },
      scale,
      shouldUpdateMaxScale = true,
      maxScale,
      transitionDuration = 300,
      position = SCROLL_NODE_POSITIONS.TOP_CENTER,
    }: {
      nodeElement?: HTMLElement;
      offset?: { x: number; y: number };
      scale?: number;
      shouldUpdateMaxScale?: boolean;
      maxScale?: number;
      transitionDuration?: number;
      position?: string;
    }) => {
      requestAnimationFrame(() => {
        if (!nodeElement || !canvasRef.current) return;
        const zoomLevel = d3Selection.current?.property("__zoom");
        const {
          k: currentScale,
          x: currentTranslateX,
          y: currentTranslateY,
        } = zoomLevel;
        const canvasNode = select(canvasRef.current);

        const getUpdatedScale = () => {
          const getClampedScale = (value: number) => {
            if (!maxScale) return value;
            return Math.min(maxScale, value);
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
          customOffset: { x: offset.x, y: offset.y },
        });

        const newTransform = zoomIdentity
          .translate(updatedX, updatedY)
          .scale(updatedScale);

        canvasNode
          // @ts-ignore
          .transition()
          .duration(transitionDuration)
          // oxlint-disable-next-line typescript/unbound-method -- zoom.transform reads its first argument, never this; .call passes the selection as that argument
          .call(d3Zoom.transform, newTransform);
      });
    };

    const scrollContentHorizontallyCenter = ({
      offset = 0,
      transitionDuration = 300,
    }: {
      offset?: number;
      transitionDuration?: number;
    }) => {
      if (!flowRendererRef.current) return;
      requestAnimationFrame(() => {
        if (!canvasRef.current || !flowRendererRef.current) return;
        const zoomLevel = d3Selection.current?.property("__zoom");
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
          translateX: updatedX,
        });

        const newTransform = zoomIdentity
          .translate(updatedX, translateY)
          .scale(scale);

        canvasNode
          // @ts-ignore
          .transition()
          .duration(transitionDuration)
          // oxlint-disable-next-line typescript/unbound-method -- zoom.transform reads its first argument, never this; .call passes the selection as that argument
          .call(d3Zoom.transform, newTransform);
      });
    };

    const getCanvasState = () => {
      return {
        canvasNode: select(canvasRef.current),
        zoomNode: select(zoomContainerRef.current),
        currentPosition: d3Selection.current?.property("__zoom"),
        d3Zoom,
      };
    };

    const onMouseDown = () => {
      const bodyElement = document.body;

      if (bodyElement) {
        const mouseDownEvent = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          view: window,
        });

        // Dispatch the mousedown event on the body element
        bodyElement.dispatchEvent(mouseDownEvent);
      }
    };

    const getContainerOffset = useCallback(function offsetHandler(
      isVertical = true,
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
            <div
              ref={canvasRef}
              className={styles.canvas}
              aria-label="Infinite canvas"
              // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a <fieldset> cannot be the zoom surface
              role="group"
            >
              <div ref={zoomContainerRef}>
                <div className={styles.contentWrapper}>{children}</div>
              </div>
            </div>
          ) : (
            <svg
              ref={canvasRef}
              className={styles.canvas}
              aria-label="Infinite canvas"
              // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a <fieldset> cannot be the zoom surface
              role="group"
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
        {scrollBarConfig.renderScrollBar && wrapperSize && (
          <ScrollBar
            ref={scrollBarRef}
            scale={zoomTransform.scale}
            {...scrollBarConfig}
            verticalOffsetHeight={wrapperSize.height}
            horizontalOffsetWidth={wrapperSize.width}
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
            className: componentClassName = "",
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
              className={componentClassName}
            />
          );
        })}
      </div>
    );
  },
);

const CustomComponentWrapper = ({
  component,
  position,
  offset,
  overlap,
  zoomState,
  className,
}: {
  component: JSX.Element;
  position: string;
  offset: { x: number; y: number };
  overlap: boolean;
  zoomState: ZoomState & { minZoom: number; maxZoom: number };
  className: string;
}) => {
  const positionStyle = useMemo(() => {
    const updatedPos = Object.values(COMPONENT_POSITIONS).includes(position)
      ? position
      : COMPONENT_POSITIONS.BOTTOM_LEFT;

    const [positionY, positionX] = updatedPos.split("-");
    return {
      ...(positionX === "center"
        ? {
            left: "50%",
            transform: `translateX(calc(-50% + ${offset.x}px))`,
          }
        : { [positionX]: offset.x }),
      [positionY]: offset.y,
    };
  }, [position, offset]);

  // DOM elements (string types) would pass zoomState on to the DOM and warn.
  const updatedComponent =
    typeof component.type === "string"
      ? component
      : React.cloneElement(component, { zoomState });

  return (
    <div
      style={{
        position: "absolute",
        ...positionStyle,
        zIndex: overlap ? 20 : 1,
      }}
      className={className}
    >
      {updatedComponent}
    </div>
  );
};
