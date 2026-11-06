import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
afterEach(cleanup);
// jsdom has no modal implementation; actual focus/Escape behavior is browser-tested.
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
