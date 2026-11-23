import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

// jsdom lacks these; cmdk (shadcn Command) uses both.
if (typeof window !== "undefined") {
  window.HTMLElement.prototype.scrollIntoView ??= function scrollIntoView() {};
  globalThis.ResizeObserver ??= class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

afterEach(() => {
  cleanup();
});
