import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeleteReadingDialog from "../src/components/DeleteReadingDialog.jsx";
import { api } from "../src/lib.js";
vi.mock("../src/lib.js", async (importOriginal) => ({
  ...(await importOriginal()),
  api: vi.fn(),
}));
const props = () => ({
  reading: { id: "7", date: "2026-11-06", slot: "After lunch", value: 110 },
  onCancel: vi.fn(),
  onDeleted: vi.fn(),
});
beforeEach(() => vi.resetAllMocks());
test("keeping a reading never deletes it", async () => {
  const callbacks = props();
  render(<DeleteReadingDialog {...callbacks} />);
  await userEvent.click(screen.getByRole("button", { name: "Keep reading" }));
  expect(callbacks.onCancel).toHaveBeenCalledOnce();
  expect(api).not.toHaveBeenCalled();
});
test("delete errors remain visible and never claim success", async () => {
  const callbacks = props();
  api.mockRejectedValue(new Error("Could not delete."));
  render(<DeleteReadingDialog {...callbacks} />);
  await userEvent.click(
    screen.getByRole("button", { name: "Delete reading", exact: true }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not delete.",
  );
  expect(callbacks.onDeleted).not.toHaveBeenCalled();
});
test("a pending delete prevents dismissal and reports success only after confirmation", async () => {
  let finish;
  api.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const callbacks = props();
  render(<DeleteReadingDialog {...callbacks} />);
  await userEvent.click(
    screen.getByRole("button", { name: "Delete reading", exact: true }),
  );
  expect(screen.getByRole("button", { name: "Keep reading" })).toBeDisabled();
  const cancel = new Event("cancel", { cancelable: true });
  fireEvent(screen.getByRole("dialog"), cancel);
  expect(cancel.defaultPrevented).toBe(true);
  expect(callbacks.onDeleted).not.toHaveBeenCalled();
  finish({});
  await waitFor(() => expect(callbacks.onDeleted).toHaveBeenCalledOnce());
  expect(api).toHaveBeenCalledWith("/readings/7", { method: "DELETE" });
});
