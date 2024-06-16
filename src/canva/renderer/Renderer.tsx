import { ReactInfiniteCanvasProps } from "../types";
import useChildrenStore from "../../store/children";
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { pointer, select } from "d3-selection";
import { drag } from "d3-drag";
import { zoom } from "d3-zoom";
import {
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  useRef,
} from "react";

import { Background } from "../../main";
import { ZOOM_CONFIGS, COMPONENT_POSITIONS } from "../../helpers/constants";

import styles from "../../App.module.css";
import { ScrollBar } from "../../components/ScrollBar/scrollbar";
import { CustomComponentWrapper } from "../Wrapper";
import { isSafari } from "../constants";
import {
  scrollNodeHandler,
  scrollNodeToCenterHandler,
} from "./core/exposed/scrollNodeHandler";
import { zoomAndPanHandler } from "./core/zoomAndPanHanlder";
import { scrollContentHorizontallyCenter } from "./core/exposed/scrollContentCenter";
import { fitContentToViewHandler } from "./core/exposed/fitContentToViewHandler";
import {
  ScrollDelta,
  onScrollDelta,
} from "./core/exposed/onScrollDeltaHandler";
import { d3Listeners } from "./core/d3Main";
import { getCanvasState } from "./core/exposed/getCanvasState";
import { actionClickHandler } from "./core/actionClickHandler";
import { zoomShortcutHandler } from "./core/zoomShortcutHandler";
import { defineDragBehavior } from "./core/drag";

interface ReactInfiniteCanvasRendererProps extends ReactInfiniteCanvasProps {
  children: any;
  innerRef: any;
}

export const ReactInfiniteCanvasRenderer = memo(
  ({
    children,
    innerRef: ref,
    minZoom = ZOOM_CONFIGS.DEFAULT_MIN_ZOOM,
    maxZoom = ZOOM_CONFIGS.DEFAULT_MAX_ZOOM,
    panOnScroll = true,
    customComponents = [],
    renderScrollBar = true,
    scrollBarConfig = {},
    backgroundConfig = {},
    onCanvasMount = () => {},
  }: ReactInfiniteCanvasRendererProps) => {
    const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
    const canvasWrapperBounds = useRef<any>(null);
    const canvasRef = useRef<SVGAElement | any>(null);
    const zoomContainerRef = useRef<any>(null);
    const scrollBarRef = useRef<any>(null);
    const flowRendererRef = children.ref;
    const isUserPressed = useRef<boolean | null>(null);

    const { childComponentRef } = useChildrenStore();

    const d3Zoom = useMemo(() => {
      return zoom<SVGAElement, unknown>().scaleExtent([minZoom, maxZoom]);
    }, [maxZoom, minZoom]);
    const d3Selection = useRef(select(canvasRef.current).call(d3Zoom));

    useEffect(() => {
      if (!canvasRef.current || !childComponentRef?.current) {
        return () => {};
      }

      const d3Setup = select(canvasRef.current).call(d3Zoom);
      d3Selection.current = d3Setup;

      if (childComponentRef?.current) {
        const childComponentSelection = select(
          `.${childComponentRef.current.className}`
        );

        defineDragBehavior({ childComponentRef, childComponentSelection });
      }

      return () => d3Setup.on(".zoom", null);
    }, [canvasRef, childComponentRef, d3Zoom]);

    const getCanvasStateMemoized = useCallback(
      () =>
        getCanvasState({
          d3Selection,
          d3Zoom,
          canvasRef,
          zoomContainerRef,
        }),
      [d3Selection, d3Zoom, canvasRef, zoomContainerRef]
    );

    const [zoomTransform, setZoomTransform] = useState({
      translateX: 0,
      translateY: 0,
      scale: 1,
    });

    const onScrollDeltaHandler = (scrollDelta: ScrollDelta) =>
      onScrollDelta({
        d3Selection,
        d3Zoom,
        scrollDelta,
      });

    const fitContentToView = useCallback(
      (args) =>
        fitContentToViewHandler({
          ...args,
          flowRendererRef,
          canvasRef,
          d3Selection,
          setZoomTransform,
          scrollBarRef,
          d3Zoom,
          minZoom,
          maxZoom,
        }),
      [
        canvasRef,
        d3Selection,
        d3Zoom,
        flowRendererRef,
        maxZoom,
        minZoom,
        scrollBarRef,
        setZoomTransform,
      ]
    );

    useImperativeHandle(ref, () => ({
      scrollNodeToCenter: scrollNodeToCenterHandler,
      scrollNodeHandler,
      scrollContentHorizontallyCenter,
      fitContentToView,
      getCanvasState: getCanvasStateMemoized,
    }));

    useEffect(() => {
      d3Selection.current = select(canvasRef.current).call(d3Zoom);
      canvasWrapperBounds.current = canvasWrapperRef.current
        ? canvasWrapperRef.current.getBoundingClientRect()
        : {};

      zoomAndPanHandler({
        d3Zoom,
        isUserPressed,
        canvasWrapperRef,
        styles,
        zoomContainerRef,
        setZoomTransform,
        onCanvasMount,
        scrollContentHorizontallyCenter: (args) =>
          scrollContentHorizontallyCenter({
            ...args,
            canvasRef,
            d3Selection,
            d3Zoom,
            flowRendererRef,
            setZoomTransform,
            zoomTransform,
          }),
        fitContentToView,
        getCanvasState: getCanvasStateMemoized,
      });
    }, []);

    d3Listeners({
      d3Selection,
      d3Zoom,
      panOnScroll,
      onScrollDeltaHandler,
      scrollBarRef,
    });

    const onActionClick = useCallback(
      (actionId) =>
        actionClickHandler(actionId, {
          d3Selection,
          d3Zoom,
          canvasRef,
          fitContentToView,
        }),
      [fitContentToView]
    );

    useEffect(() => {
      const cleanup = zoomShortcutHandler({ onActionClick });
      return cleanup;
    }, [onActionClick]);

    const getContainerOffset = useCallback(function offsetHandler(
      isVertical = true
    ) {
      const { x, y } = canvasWrapperBounds.current;
      return isVertical ? y : x;
    },
    []);

    return (
      <div className={styles.container}>
        <div ref={canvasWrapperRef} className={styles.canvasWrapper}>
          {isSafari ? (
            <div ref={canvasRef} className={styles.canvas}>
              <div ref={zoomContainerRef}>
                <div className={styles.contentWrapper}>{children}</div>
              </div>
            </div>
          ) : (
            <svg ref={canvasRef} className={styles.canvas}>
              <g ref={zoomContainerRef}>
                <foreignObject
                  x={ZOOM_CONFIGS.INITIAL_POSITION_X}
                  y={ZOOM_CONFIGS.INITIAL_POSITION_Y}
                  width={ZOOM_CONFIGS.DEFAULT_LAYOUT}
                  height={ZOOM_CONFIGS.DEFAULT_LAYOUT}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "rgba(35, 200, 200, 0.4)",
                    }}
                  >
                    {children}
                  </div>
                </foreignObject>
              </g>
            </svg>
          )}
        </div>
        <Background
          maxZoom={maxZoom}
          zoomTransform={zoomTransform}
          {...backgroundConfig}
        />
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
        {customComponents.map((config, index) => {
          const {
            component,
            position = COMPONENT_POSITIONS.BOTTOM_LEFT,
            offset = { x: 0, y: 0 },
            overlap = true,
            className = "",
          } = config;
          return (
            <CustomComponentWrapper
              key={index}
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
