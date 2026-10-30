import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ChartBus } from "./chartBus";
import { defaultStudy } from "./studies";

const { useChartPreferencesMock } = vi.hoisted(() => ({
  useChartPreferencesMock: vi.fn(),
}));

vi.mock("@dylanpersonguy/opencharts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@dylanpersonguy/opencharts")>()),
  CHART_COLORS: { dark: { background: "#101010", text: "#999da5", grid: "#1b1b1b", crosshair: "#62656c", up: "#26a69a", down: "#ef5350", volumeUp: "#26a69a", volumeDown: "#ef5350", bidLine: "#0ecb81", askLine: "#f6465d", bidLabelBg: "#0ecb81", askLabelBg: "#f6465d", watermark: "#ffffff08", lastPriceUp: "#0ecb81", lastPriceDown: "#f6465d", orderLine: "#f0b90b", positionLong: "#0ecb81", positionShort: "#f6465d", tpLine: "#0ecb81", slLine: "#f6465d" } },
  buildChartSettingsOptions: () => ({}),
  ChartPanel: () => null,
  useChartPreferences: useChartPreferencesMock,
}));

import { StudyWorkspace } from "./StudyWorkspace";

const enabledStatusLine = {
  showStatusLineStudyTitle: true,
  showStatusLineStudyInputs: true,
  showStatusLineStudyValues: true,
  showStatusLineStudyBackground: true,
};

const bars = Array.from({ length: 25 }, (_, index) => {
  const close = 100 + index;
  return {
    time: 1_700_000_000_000 + index * 300_000,
    open: close - 0.5,
    high: close + 1,
    low: close - 1,
    close,
    volume: 10 + index,
  };
});

describe("shared study legend preferences", () => {
  it("renders shared study legend visibility preferences independently", () => {
    useChartPreferencesMock.mockReturnValue(enabledStatusLine);
    const props = {
      cell: "cell-1",
      bars,
      bus: new ChartBus(),
      settings: { EMA: defaultStudy("EMA") },
      active: ["EMA"] as ["EMA"],
      onSettings: vi.fn(),
      onEdit: vi.fn(),
      onRemove: vi.fn(),
      onOpenSettings: vi.fn(),
      drawingRailHost: null,
      panel: { timeframe: "5m" } as never,
    };
    const markup = () => renderToStaticMarkup(<StudyWorkspace {...props} />);
    const enabledMarkup = markup();

    expect(enabledMarkup).toContain("study-legend");
    expect(enabledMarkup).toContain("study-legend-title");
    expect(enabledMarkup).toContain("study-legend-inputs");
    expect(enabledMarkup).toContain("study-legend-values");
    expect(enabledMarkup).not.toContain("study-legend--transparent");

    const options = [
      ["showStatusLineStudyTitle", "study-legend-title"],
      ["showStatusLineStudyInputs", "study-legend-inputs"],
      ["showStatusLineStudyValues", "study-legend-values"],
      ["showStatusLineStudyBackground", "study-legend--transparent"],
    ] as const;
    for (const [key, target] of options) {
      useChartPreferencesMock.mockReturnValue({ ...enabledStatusLine, [key]: false });
      const updatedMarkup = markup();

      if (key === "showStatusLineStudyBackground") {
        expect(updatedMarkup).toContain(target);
        expect(updatedMarkup).toContain("study-legend-title");
        expect(updatedMarkup).toContain("study-legend-inputs");
        expect(updatedMarkup).toContain("study-legend-values");
      } else {
        expect(updatedMarkup).not.toContain(target);
        for (const [, otherTarget] of options) {
          if (otherTarget === target || otherTarget.startsWith("study-legend--")) continue;
          expect(updatedMarkup).toContain(otherTarget);
        }
        expect(updatedMarkup).not.toContain("study-legend--transparent");
      }
    }
  });

});
