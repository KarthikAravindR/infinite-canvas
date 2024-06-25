export const onMouseDown = () => {
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
