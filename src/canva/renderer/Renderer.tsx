import { ReactInfiniteCanvasProps } from "../types";
import useChildrenStore from "../../store/children";
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { select } from "d3-selection";
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
import {
  ZOOM_CONFIGS,
  ZOOM_CONTROLS,
  COMPONENT_POSITIONS,
} from "../../helpers/constants";

import styles from "../../App.module.css";
import { ScrollBar } from "../../components/ScrollBar/scrollbar";
import { CustomComponentWrapper } from "../Wrapper";
import { ZOOM_KEY_CODES, isSafari } from "../constants";
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

    const child = useChildrenStore();

    const d3Zoom = useMemo(() => {
      return zoom<SVGAElement, unknown>().scaleExtent([minZoom, maxZoom]);
    }, [maxZoom, minZoom]);
    const d3Selection = useRef(select(canvasRef.current).call(d3Zoom));

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

    useEffect(
      function zoomShortcutHandler() {
        function onKeyDownHandler(e: KeyboardEvent) {
          const cmdPressed = e.metaKey || e.ctrlKey;
          if (!Object.values(ZOOM_KEY_CODES).includes(e.which) || !cmdPressed)
            return;
          e.preventDefault();
          switch (e.which) {
            case ZOOM_KEY_CODES.ZOOM_IN:
            case ZOOM_KEY_CODES.ZOOM_IN_2:
              onActionClick(ZOOM_CONTROLS.ZOOM_IN);
              break;
            case ZOOM_KEY_CODES.ZOOM_OUT:
            case ZOOM_KEY_CODES.ZOOM_OUT_2:
              onActionClick(ZOOM_CONTROLS.ZOOM_OUT);
              break;
            case ZOOM_KEY_CODES.FIT_TO_VIEW:
              onActionClick(ZOOM_CONTROLS.FIT_TO_VIEW);
              break;
            case ZOOM_KEY_CODES.FIT_TO_HUNDRED:
              onActionClick(ZOOM_CONTROLS.FIT_TO_HUNDRED);
              break;
            default:
              return;
          }
        }

        window.addEventListener("keydown", onKeyDownHandler);
        return () => {
          window.removeEventListener("keydown", onKeyDownHandler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
      },
      [onActionClick]
    );

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
                  {children}
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
