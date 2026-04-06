import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HeroBlock } from "./HeroBlock";

describe("HeroBlock", () => {
  const props = {
    heading: "Build your coding skills",
    subtext: "Your end-to-end coding platform",
    primaryCta: { label: "Request Demo", href: "/demo" },
    secondaryCta: { label: "Explore Problems", href: "/problems" },
    screenshotSrc: "/screenshot.png",
    screenshotAlt: "Platform screenshot",
  };

  it("renders heading and subtext", () => {
    render(<HeroBlock {...props} />);
    expect(screen.getByText("Build your coding skills")).toBeInTheDocument();
    expect(screen.getByText("Your end-to-end coding platform")).toBeInTheDocument();
  });

  it("renders CTA buttons", () => {
    render(<HeroBlock {...props} />);
    expect(screen.getByText("Request Demo")).toBeInTheDocument();
  });
});
