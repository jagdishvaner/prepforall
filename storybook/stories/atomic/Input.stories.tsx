import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "@prepforall/react";

const meta: Meta<typeof Input> = {
  title: "Atomic/Input",
  component: Input,
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: "Enter text..." },
};

export const WithLabel: Story = {
  args: { label: "Email", placeholder: "you@example.com" },
};

export const WithError: Story = {
  args: { label: "Email", error: "This field is required", value: "" },
};

export const WithHelper: Story = {
  args: { label: "Username", helperText: "Must be at least 3 characters" },
};
