import { cloneElement, useMemo } from "react";
import { COMPONENT_POSITIONS } from "../main";

export const CustomComponentWrapper = ({
  component,
  position,
  offset,
  overlap,
  zoomState,
  className,
}: {
  component: any;
  position: string;
  offset: { x: number; y: number };
  overlap: boolean;
  zoomState: any;
  className: string;
}) => {
  const positionStyle = useMemo(() => {
    const updatedPos = Object.values(COMPONENT_POSITIONS).includes(position)
      ? position
      : COMPONENT_POSITIONS.BOTTOM_LEFT;

    const [positionY, positionX] = updatedPos.split("-");
    return {
      [positionX]: offset.x,
      [positionY]: offset.y,
    };
  }, [position, offset]);

  const updatedComponent = cloneElement(component, {
    zoomState,
  });

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
