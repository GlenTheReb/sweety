import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrendChart from "../src/components/TrendChart.jsx";
test("chart exposes actual reading values and an accessible chronological table", async () => {
  render(
    <TrendChart
      readings={[
        { id: "2", date: "2026-11-02", slot: "After lunch", value: 132 },
        { id: "1", date: "2026-11-01", slot: "Morning (fasting)", value: 94 },
      ]}
    />,
  );
  expect(screen.getByRole("img")).toHaveAccessibleName(
    /2 recorded glucose values/,
  );
  await userEvent.click(screen.getByText("View chart data"));
  const rows = screen.getAllByRole("row");
  expect(rows[1]).toHaveTextContent("1 Nov 2026Morning (fasting)94");
  expect(rows[2]).toHaveTextContent("2 Nov 2026After lunch132");
});
