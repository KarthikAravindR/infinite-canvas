import { ReactInfiniteCanvasProps } from "../types";
import useChildrenStore from "../../store/children";
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { pointer, select } from "d3-selection";
import { zoom, zoomIdentity } from "d3-zoom";
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

import { clampValue } from "../../helpers/utils";
import styles from "../../App.module.css";
import { ScrollBar } from "../../components/ScrollBar/scrollbar";
import { CustomComponentWrapper } from "../Wrapper";
import { TIME_TO_WAIT, ZOOM_KEY_CODES, isSafari } from "../constants";
import {
  scrollNodeHandler,
  scrollNodeToCenterHandler,
} from "./core/scrollNodeHandler";
import { zoomAndPanHandler } from "./core/zoomAndPanHanlder";
import { scrollContentHorizontallyCenter } from "./core/scrollContentCenter";
import { fitContentToViewHandler } from "./core/fitContentToViewHandler";

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

    const [zoomTransform, setZoomTransform] = useState({
      translateX: 0,
      translateY: 0,
      scale: 1,
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
      getCanvasState,
    }));

    useEffect(
      () => {
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
          getCanvasState,
        });
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );

    d3Selection.current
      .call(zoom)
      // Override the default wheel event listener
      .on(
        "wheel.zoom",
        (event: {
          preventDefault: () => void;
          ctrlKey: any;
          deltaY: number;
          deltaX: any;
        }) => {
          event.preventDefault();
          const currentZoom = d3Selection.current.property("__zoom").k || 1;

          if (panOnScroll && !event.ctrlKey) {
            const scrollDeltaValue = {
              deltaX: event.deltaX,
              deltaY: event.deltaY,
            };
            scrollBarRef.current?.onScrollDeltaChangeHandler(scrollDeltaValue);
            onScrollDeltaHandler(scrollDeltaValue);
          } else {
            const nextZoom = currentZoom * Math.pow(2, -event.deltaY * 0.01);
            d3Zoom.scaleTo(d3Selection.current, nextZoom, pointer(event));
          }
        },
        { passive: false, capture: true }
      )
      .on("mousemove", (e) => {
        if (child?.ref?.current) {
          console.log(e.target === child?.ref?.current);
        }
      });

    const onScrollDeltaHandler = (scrollDelta: {
      deltaX: number;
      deltaY: number;
    }) => {
      const currentZoom = d3Selection.current.property("__zoom").k || 1;
      d3Zoom.translateBy(
        d3Selection.current,
        -(scrollDelta.deltaX / currentZoom),
        -(scrollDelta.deltaY / currentZoom)
      );
    };

    const getCanvasState = () => {
      return {
        canvasNode: select(canvasRef.current),
        zoomNode: select(zoomContainerRef.current),
        currentPosition: d3Selection.current.property("__zoom"),
        d3Zoom,
      };
    };

    const onActionClick = useCallback(
      function actionClickHandler(actionId: string) {
        const canvasNode = select(canvasRef.current);
        const { k: currentScale } = d3Selection.current.property("__zoom");
        switch (actionId) {
          case ZOOM_CONTROLS.FIT_TO_VIEW:
            fitContentToView({});
            break;

          case ZOOM_CONTROLS.FIT_TO_HUNDRED:
            d3Zoom.scaleTo(
              // @ts-ignore
              canvasNode.transition().duration(ZOOM_CONFIGS.TIME_FRAME),
              1
            );
            break;

          case ZOOM_CONTROLS.ZOOM_IN:
            d3Zoom.scaleTo(
              // @ts-ignore
              canvasNode.transition().duration(ZOOM_CONFIGS.TIME_FRAME),
              currentScale + ZOOM_CONFIGS.ZOOM_RATIO
            );
            break;

          case ZOOM_CONTROLS.ZOOM_OUT:
            d3Zoom.scaleTo(
              // @ts-ignore
              canvasNode.transition().duration(ZOOM_CONFIGS.TIME_FRAME),
              currentScale - ZOOM_CONFIGS.ZOOM_RATIO
            );
            break;

          default:
            break;
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
