import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { Input } from "./Input";

describe("Input", () => {
  it("renders with label", () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("shows error message", () => {
    render(<Input label="Email" error="Required field" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Required field");
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows helper text when no error", () => {
    render(<Input label="Email" helperText="Enter your email" />);
    expect(screen.getByText("Enter your email")).toBeInTheDocument();
  });
});
