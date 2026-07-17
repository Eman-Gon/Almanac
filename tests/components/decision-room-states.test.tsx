import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";

describe("ConfidenceIndicator", () => {
  it("announces low-confidence data without relying on color or icon", () => {
    render(<ConfidenceIndicator confidence="low" />);
    expect(screen.getByRole("status", { name: "Low confidence" })).toHaveTextContent("Low");
  });
});
