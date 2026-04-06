import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SectionHeading } from "./SectionHeading";

describe("SectionHeading", () => {
  it("renders heading text", () => {
    render(<SectionHeading>Test Heading</SectionHeading>);
    expect(screen.getByText("Test Heading")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(<SectionHeading subtitle="Sub text">Heading</SectionHeading>);
    expect(screen.getByText("Sub text")).toBeInTheDocument();
  });

  it("applies center alignment by default", () => {
    render(<SectionHeading>Heading</SectionHeading>);
    const wrapper = screen.getByText("Heading").parentElement;
    expect(wrapper?.className).toContain("text-center");
  });

  it("applies left alignment when specified", () => {
    render(<SectionHeading align="left">Heading</SectionHeading>);
    const wrapper = screen.getByText("Heading").parentElement;
    expect(wrapper?.className).toContain("text-left");
  });
});
