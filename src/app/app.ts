import { Controller } from "./controllers/controller";
import { View } from "./views";

async function start(): Promise<void> {
  const view = new View(document);
  const controller = new Controller(view);
  await controller.start();
}

(function init() {
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    void start().catch((err) => {
      console.error("Panel bootstrap failed:", err);
    });
  } else {
    document.addEventListener(
      "DOMContentLoaded",
      () =>
        void start().catch((err) => {
          console.error("Panel bootstrap failed:", err);
        }),
    );
  }
})();
