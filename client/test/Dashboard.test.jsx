import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dashboard from "../src/components/Dashboard.jsx";
import { api } from "../src/lib.js";
vi.mock("../src/lib.js", async (importOriginal) => ({
  ...(await importOriginal()),
  api: vi.fn(),
  today: () => "2026-11-06",
}));
const reading = {
  id: "7",
  date: "2026-11-06",
  slot: "After lunch",
  value: 110,
};
const summary = {
  from: "2026-11-06",
  to: "2026-11-06",
  count: 1,
  highest: 110,
  lowest: 110,
  average: 110,
  readings: [reading],
};
const reports = {
  daily: summary,
  monthToDate: summary,
  monthly: { ...summary, count: 0, readings: [] },
};
const props = () => ({
  user: { name: "Demo member" },
  onLogout: vi.fn(),
  onSessionExpired: vi.fn(),
});
beforeEach(() => vi.resetAllMocks());
test("a failed report is an error, not an empty journal, and retry recovers", async () => {
  api
    .mockRejectedValueOnce(new Error("Service unavailable."))
    .mockResolvedValue(reports);
  render(<Dashboard {...props()} />);
  expect(
    await screen.findByText("We couldn’t load your readings"),
  ).toBeVisible();
  expect(
    screen.queryByText("A fresh page in your journal"),
  ).not.toBeInTheDocument();
  expect(screen.queryByText("No reading yet")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("1 of 4 recorded")).toBeVisible();
});
test("report tabs support arrow keys and expose the selected tab panel", async () => {
  api.mockResolvedValue(reports);
  render(<Dashboard {...props()} />);
  await screen.findByText("1 of 4 recorded");
  const daily = screen.getByRole("tab", { name: "Daily" });
  daily.focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(screen.getByRole("tab", { name: "Month to date" })).toHaveFocus();
  expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Month to date");
  await userEvent.keyboard("{End}");
  expect(screen.getByRole("tab", { name: "Previous month" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});
test("day navigation changes the request and cannot advance beyond today", async () => {
  api.mockResolvedValue(reports);
  render(<Dashboard {...props()} />);
  await screen.findByText("1 of 4 recorded");
  expect(screen.getByRole("button", { name: "Next day" })).toBeDisabled();
  await userEvent.click(screen.getByRole("button", { name: "Previous day" }));
  await waitFor(() =>
    expect(api).toHaveBeenLastCalledWith(
      "/reports?date=2026-11-05",
      expect.any(Object),
    ),
  );
  expect(screen.getByRole("button", { name: "Next day" })).toBeEnabled();
  await userEvent.click(
    screen.getByRole("button", { name: "Today", exact: true }),
  );
  await waitFor(() =>
    expect(api).toHaveBeenLastCalledWith(
      "/reports?date=2026-11-06",
      expect.any(Object),
    ),
  );
});
test("an expired session invokes sign-in recovery", async () => {
  const callbacks = props();
  api.mockRejectedValue(
    Object.assign(new Error("Please log in."), { status: 401 }),
  );
  render(<Dashboard {...callbacks} />);
  await waitFor(() =>
    expect(callbacks.onSessionExpired).toHaveBeenCalledOnce(),
  );
});
