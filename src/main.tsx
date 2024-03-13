import { createRef } from "react";
import ReactDOM from "react-dom/client";
import { ReactInfiniteCanvas, ReactWorkflowHandle } from "./App";
import { COMPONENT_POSITIONS } from "./helpers/constants";

const Play = () => {
  const canvasRef = createRef<ReactWorkflowHandle>();
  return (
    <div style={{ width: "700px", height: "400px", border: "1px solid red" }}>
      <ReactInfiniteCanvas
        ref={canvasRef}
        onFlowMount={(mountFunc: ReactWorkflowHandle) => {
          mountFunc.fitContentToView({ scale: 1 });
        }}
        customComponents={[
          {
            component: (
              <div
                style={{ width: "150px", height: "50px", background: "blue" }}
              >
                asdasd
              </div>
            ),
            position: COMPONENT_POSITIONS.TOP_LEFT,
            offset: { x: 120, y: 10 },
          },
        ]}
      >
        <div style={{ width: "200px", height: "200px", background: "red" }}>
          asdasdsdas
        </div>
      </ReactInfiniteCanvas>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(<Play />);

// export { ReactInfiniteCanvas } from "./App";
