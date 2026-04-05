import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardHeader, CardBody, CardFooter, Button } from "@prepforall/react";

const meta: Meta<typeof Card> = {
  title: "Molecular/Card",
  component: Card,
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card style={{ maxWidth: "400px" }}>
      <CardHeader>
        <h3 style={{ fontWeight: 600 }}>Two Sum</h3>
      </CardHeader>
      <CardBody>
        <p style={{ fontSize: "14px", color: "var(--color-neutral-600)" }}>
          Given an array of integers, return indices of the two numbers such that they add up to a specific target.
        </p>
      </CardBody>
      <CardFooter>
        <Button size="sm">Solve</Button>
      </CardFooter>
    </Card>
  ),
};
