import { CSSProperties } from "react";
import { clampValue } from "../../helpers/utils";

import styles from "./styles.module.css";

export interface BackgroundProps {
  id?: string;
  disable?: boolean;
  size?: number;
  minSize?: number;
  maxZoom?: number;
  gap?: number;
  zoomTransform?: {
    scale: number;
    translateX: number;
    translateY: number;
  };
  className?: string;
  minOpacity?: number;
  maxOpacity?: number;
  elementColor?: string;
  backgroundColor?: CSSProperties["backgroundColor"];
}

export const Background = ({
  id = "",
  size = 1,
  minSize = 0.3,
  maxZoom = 4,
  gap = 20,
  zoomTransform = {
    scale: 1,
    translateX: 0,
    translateY: 0,
  },
  className = "",
  minOpacity = 0.8,
  maxOpacity = 1,
  elementColor = "#afb7c7",
  backgroundColor,
}: BackgroundProps) => {
  const { scale, translateX, translateY } = zoomTransform;
  const dynamicOpacity = clampValue({
    value: (scale * 10) / (maxZoom * 10),
    min: minOpacity,
    max: maxOpacity,
  });
  const scaledGap = gap * scale;
  const scaledSize = size * scale;
  const circleSize = Math.max(minSize, scaledSize);
  const patternId = `patternId-${id}`;

  return (
    <svg
      className={`${className} ${styles.dotSvgContainer}`}
      style={
        backgroundColor ? { backgroundColor: backgroundColor } : {}
      }
    >
        <pattern
          id={patternId}
          x={translateX % scaledGap}
          y={translateY % scaledGap}
          width={scaledGap}
          height={scaledGap}
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(-${scaledSize},-${scaledSize})`}
        >
          <circle
            cx={circleSize}
            cy={circleSize}
            r={circleSize}
            fill={elementColor}
            opacity={dynamicOpacity}
          />
        </pattern>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill={`url(#${patternId})`}
      />
    </svg>
  );
};
