export type ScrollDelta = {
  deltaX: number;
  deltaY: number;
};

type OnScrollDeltaProps = {
  d3Selection: any;
  d3Zoom: any;
};

export const onScrollDelta = ({
  scrollDelta,
  d3Selection,
  d3Zoom,
}: { scrollDelta: ScrollDelta } & OnScrollDeltaProps) => {
  const currentZoom = d3Selection.current.property("__zoom").k || 1;
  d3Zoom.translateBy(
    d3Selection.current,
    -(scrollDelta.deltaX / currentZoom),
    -(scrollDelta.deltaY / currentZoom)
  );
};
