import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Modal, Button } from "@prepforall/react";

const meta: Meta<typeof Modal> = {
  title: "Molecular/Modal",
  component: Modal,
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal open={open} onClose={() => setOpen(false)} title="Confirm Action">
          <p style={{ fontSize: "14px", color: "var(--color-neutral-600)", marginBottom: "16px" }}>
            Are you sure you want to proceed with this action?
          </p>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => setOpen(false)}>Confirm</Button>
          </div>
        </Modal>
      </>
    );
  },
};
