export interface ReactInfiniteCanvasProps {
  children: JSX.Element;
  ref?: any;
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
  backgroundConfig?: {
    id?: string;
    size?: number;
    minSize?: number;
    maxZoom?: number;
    gap?: number;
    minOpacity?: number;
    maxOpacity?: number;
    elementColor?: string;
  };
  customComponents?: Array<{
    component: JSX.Element;
    position?: string;
    offset?: { x: number; y: number };
    overlap?: boolean;
    className?: string;
  }>;
  onCanvasMount?: (functions: ReactInfiniteCanvasHandle) => void;
}

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
  getCanvasState: () => any;
};
