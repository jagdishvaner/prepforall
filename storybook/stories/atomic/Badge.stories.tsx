import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "@prepforall/react";

const meta: Meta<typeof Badge> = {
  title: "Atomic/Badge",
  component: Badge,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "success", "error", "warning", "info"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = { args: { children: "Default" } };
export const Success: Story = { args: { children: "Accepted", variant: "success" } };
export const Error: Story = { args: { children: "Wrong Answer", variant: "error" } };
export const Warning: Story = { args: { children: "TLE", variant: "warning" } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "8px" }}>
      <Badge>Default</Badge>
      <Badge variant="success">AC</Badge>
      <Badge variant="error">WA</Badge>
      <Badge variant="warning">TLE</Badge>
      <Badge variant="info">Pending</Badge>
    </div>
  ),
};
