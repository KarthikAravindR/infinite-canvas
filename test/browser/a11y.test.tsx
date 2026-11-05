import { expect, test } from "vitest";
import { renderCanvas } from "./helpers";

// B15: keyboard focus on an off-screen element does not pan it into view.
test.fails("focusing an off-screen element pans it into view", async () => {
  const { host } = await renderCanvas(
    {},
    {},
    {
      extraContent: (
        <button
          type="button"
          data-testid="far"
          style={{ position: "absolute", left: 1500, top: 900 }}
        >
          far
        </button>
      ),
    },
  );
  const button = host.querySelector('[data-testid="far"]') as HTMLElement;
  button.focus();
  await expect
    .poll(() => {
      const b = button.getBoundingClientRect();
      const h = host.getBoundingClientRect();
      return (
        b.left >= h.left &&
        b.top >= h.top &&
        b.right <= h.right &&
        b.bottom <= h.bottom
      );
    })
    .toBe(true);
});
