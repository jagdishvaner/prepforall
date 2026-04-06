import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Header } from "./Header";

describe("Header", () => {
  const props = {
    logoSrc: "/logo.svg",
    navLinks: [
      { label: "Problems", href: "/problems" },
      { label: "Features", href: "/features" },
    ],
    loginHref: "https://app.prepforall.com",
    ctaLabel: "Request Demo",
    ctaHref: "/for-universities",
  };

  it("renders navigation links", () => {
    render(<Header {...props} />);
    expect(screen.getByText("Problems")).toBeInTheDocument();
    expect(screen.getByText("Features")).toBeInTheDocument();
  });

  it("renders CTA button", () => {
    render(<Header {...props} />);
    expect(screen.getAllByText("Request Demo").length).toBeGreaterThan(0);
  });
});
