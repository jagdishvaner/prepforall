import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@prepforall/react";

const meta: Meta<typeof Tabs> = {
  title: "Molecular/Tabs",
  component: Tabs,
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultTab="description">
      <TabsList>
        <TabsTrigger value="description">Description</TabsTrigger>
        <TabsTrigger value="solution">Solution</TabsTrigger>
        <TabsTrigger value="submissions">Submissions</TabsTrigger>
      </TabsList>
      <TabsContent value="description">
        <p style={{ fontSize: "14px", color: "var(--color-neutral-600)" }}>
          Given an array of integers nums and an integer target, return indices of the two numbers
          such that they add up to target.
        </p>
      </TabsContent>
      <TabsContent value="solution">
        <pre style={{ fontSize: "13px", padding: "12px", background: "var(--color-neutral-50)", borderRadius: "8px" }}>
{`function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
}`}
        </pre>
      </TabsContent>
      <TabsContent value="submissions">
        <p style={{ fontSize: "14px", color: "var(--color-neutral-500)" }}>No submissions yet.</p>
      </TabsContent>
    </Tabs>
  ),
};
