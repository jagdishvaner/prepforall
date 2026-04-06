import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FeatureCard } from "./FeatureCard";

describe("FeatureCard", () => {
  it("renders title and description", () => {
    render(
      <FeatureCard
        icon={<span data-testid="icon">IC</span>}
        title="Practice"
        description="200+ DSA problems"
      />
    );
    expect(screen.getByText("Practice")).toBeInTheDocument();
    expect(screen.getByText("200+ DSA problems")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });
});
