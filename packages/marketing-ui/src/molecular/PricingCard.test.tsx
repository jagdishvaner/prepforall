import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PricingCard } from "./PricingCard";

describe("PricingCard", () => {
  const defaultProps = {
    tier: "Starter",
    description: "Up to 100 students",
    features: ["Platform access", "Support"],
    ctaLabel: "Contact Us",
    ctaHref: "/contact",
  };

  it("renders tier name and description", () => {
    render(<PricingCard {...defaultProps} />);
    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("Up to 100 students")).toBeInTheDocument();
  });

  it("renders all features", () => {
    render(<PricingCard {...defaultProps} />);
    expect(screen.getByText("Platform access")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();
  });

  it("shows popular badge when popular", () => {
    render(<PricingCard {...defaultProps} popular />);
    expect(screen.getByText("Most Popular")).toBeInTheDocument();
  });
});
