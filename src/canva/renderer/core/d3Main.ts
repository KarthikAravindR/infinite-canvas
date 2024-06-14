import { pointer } from "d3-selection";
import { zoom } from "d3-zoom";

export const d3Listeners = ({
  d3Selection,
  d3Zoom,
  panOnScroll,
  onScrollDeltaHandler,
  scrollBarRef,
}) => {
  d3Selection.current
    .call(zoom)
    // Override the default wheel event listener
    .on(
      "wheel.zoom",
      (e) =>
        onWheelZoom(e, {
          d3Selection,
          d3Zoom,
          panOnScroll,
          onScrollDeltaHandler,
          scrollBarRef,
        }),
      { passive: false, capture: true }
    )
    .on("mousemove", onMouseMove);
};

const onMouseMove = (e) => {
  //   console.log(e);
};

type OnWheelZoomProps = {
  preventDefault: () => void;
  ctrlKey: any;
  deltaY: number;
  deltaX: any;
};

const onWheelZoom = (
  event: OnWheelZoomProps,
  { d3Selection, d3Zoom, panOnScroll, onScrollDeltaHandler, scrollBarRef }
) => {
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
};
