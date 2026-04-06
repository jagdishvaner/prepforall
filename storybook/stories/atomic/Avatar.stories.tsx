import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "@prepforall/react";

const meta: Meta<typeof Avatar> = {
  title: "Atomic/Avatar",
  component: Avatar,
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  args: { src: "https://avatars.githubusercontent.com/u/1?v=4", alt: "User", size: "md" },
};

export const WithFallback: Story = {
  args: { fallback: "SS", size: "md" },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <Avatar fallback="S" size="sm" />
      <Avatar fallback="M" size="md" />
      <Avatar fallback="L" size="lg" />
    </div>
  ),
};
