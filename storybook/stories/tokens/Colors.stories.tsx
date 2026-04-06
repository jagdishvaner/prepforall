import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Tokens/Colors",
};

export default meta;

const colorTokens = [
  { name: "--color-brand-primary", label: "Brand Primary" },
  { name: "--color-brand-accent", label: "Brand Accent" },
  { name: "--color-neutral-50", label: "Neutral 50" },
  { name: "--color-neutral-100", label: "Neutral 100" },
  { name: "--color-neutral-500", label: "Neutral 500" },
  { name: "--color-neutral-900", label: "Neutral 900" },
  { name: "--color-success", label: "Success" },
  { name: "--color-error", label: "Error" },
  { name: "--color-warning", label: "Warning" },
  { name: "--color-info", label: "Info" },
];

export const AllColors: StoryObj = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
      {colorTokens.map(({ name, label }) => (
        <div key={name} style={{ textAlign: "center" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "8px",
              backgroundColor: `var(${name})`,
              border: "1px solid var(--color-neutral-200)",
              margin: "0 auto 8px",
            }}
          />
          <div style={{ fontSize: "12px", fontWeight: 500 }}>{label}</div>
          <div style={{ fontSize: "11px", color: "var(--color-neutral-500)" }}>{name}</div>
        </div>
      ))}
    </div>
  ),
};
