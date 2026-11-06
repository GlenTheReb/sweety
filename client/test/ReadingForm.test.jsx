import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReadingForm from "../src/components/ReadingForm.jsx";
import { api } from "../src/lib.js";
vi.mock("../src/lib.js", async (importOriginal) => ({
  ...(await importOriginal()),
  api: vi.fn(),
}));
beforeEach(() => vi.resetAllMocks());
const props = () => ({
  date: "2026-11-06",
  maxDate: "2026-11-06",
  onSave: vi.fn(),
  onCancel: vi.fn(),
});
test("missing value explains the error without calling the API", async () => {
  render(<ReadingForm {...props()} />);
  await userEvent.click(screen.getByRole("button", { name: "Save reading" }));
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Please enter a glucose value.",
  );
  expect(api).not.toHaveBeenCalled();
});
test.each(["39", "601", "100.5"])(
  "rejects invalid glucose value %s before saving",
  async (value) => {
    render(<ReadingForm {...props()} />);
    await userEvent.type(screen.getByLabelText(/Glucose value/), value);
    await userEvent.click(screen.getByRole("button", { name: "Save reading" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "whole number between 40 and 600",
    );
    expect(api).not.toHaveBeenCalled();
  },
);
test("editing sends the selected date, slot and value to the owned reading route", async () => {
  const callbacks = props();
  api.mockResolvedValue({});
  render(
    <ReadingForm
      {...callbacks}
      reading={{
        id: "17",
        date: "2026-11-05",
        slot: "After lunch",
        value: 110,
      }}
    />,
  );
  const input = screen.getByLabelText(/Glucose value/);
  await userEvent.clear(input);
  await userEvent.type(input, "120");
  await userEvent.click(screen.getByRole("button", { name: "Save reading" }));
  await waitFor(() =>
    expect(callbacks.onSave).toHaveBeenCalledWith("2026-11-05"),
  );
  expect(api).toHaveBeenCalledWith("/readings/17", {
    method: "PUT",
    body: JSON.stringify({
      date: "2026-11-05",
      slot: "After lunch",
      value: "120",
    }),
  });
});
test("a server conflict stays visible without claiming a successful save", async () => {
  const callbacks = props();
  api.mockRejectedValue(
    new Error("You already have an After lunch reading for this date."),
  );
  render(
    <ReadingForm
      {...callbacks}
      reading={{ slot: "After lunch", value: 100 }}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Save reading" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "already have an After lunch",
  );
  expect(callbacks.onSave).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog")).toBeVisible();
});
test("a future date is rejected even if browser date constraints are bypassed", async () => {
  render(
    <ReadingForm {...props()} reading={{ date: "2026-11-07", value: 100 }} />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Save reading" }));
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Date cannot be in the future.",
  );
  expect(api).not.toHaveBeenCalled();
});
