import "../../../App.css";
import { act } from "react";
import { createRoot } from "react-dom/client";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import tailwindConfig from "../../../../tailwind.config.js";
import CollectionOverview from "../CollectionOverview";

const mountCollectionOverview = () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(<CollectionOverview />));

  const layout = container.querySelector("[data-testid='collection-overview']");
  return {
    layout,
    cleanup: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
};

describe("CollectionOverview", () => {
  it("renders the expected Tailwind utility classes", () => {
    const { layout, cleanup } = mountCollectionOverview();
    expect(layout).toBeInTheDocument();
    expect(layout).toHaveClass("flex", "bg-background", "text-on-background");

    cleanup();
  });

  it("lets Tailwind compile the configured palette into real CSS", async () => {
    const cssToCompile = `
      @tailwind base;
      @tailwind components;
      @tailwind utilities;
      .check-bg {
        @apply bg-background text-on-background;
      }
    `;

    const result = await postcss([tailwindcss(tailwindConfig)]).process(cssToCompile, {
      from: undefined,
    });

    expect(result.css).toContain("background-color: rgb(11 19 38 / var(--tw-bg-opacity))");
    expect(result.css).toContain("color: rgb(218 226 253 / var(--tw-text-opacity))");
  });
});
