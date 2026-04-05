"use client";

import { useActionState } from "react";
import { ContactForm } from "@prepforall/marketing-ui/organisms";
import { submitDemoRequest, type DemoRequestState } from "./actions";

const initialState: DemoRequestState = { success: false };

const formFields = [
  { name: "institution" as const, label: "Institution Name", type: "text" as const, placeholder: "e.g. SRM University", required: true },
  { name: "name" as const, label: "Your Name", type: "text" as const, placeholder: "Full name", required: true },
  { name: "email" as const, label: "Email", type: "email" as const, placeholder: "you@university.edu", required: true },
  { name: "phone" as const, label: "Phone", type: "tel" as const, placeholder: "+91 98765 43210", required: false },
  {
    name: "studentCount" as const,
    label: "Number of Students",
    type: "select" as const,
    placeholder: "Select range",
    required: false,
    options: ["Under 100", "100-300", "300-500", "500+"],
  },
  { name: "message" as const, label: "Message", type: "textarea" as const, placeholder: "Tell us about your training needs...", required: false },
];

export function DemoForm() {
  const [state, formAction, isPending] = useActionState(
    submitDemoRequest,
    initialState
  );

  if (state.success) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <p className="text-lg font-semibold text-green-800">
          Thank you! We&apos;ll be in touch within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <>
      {state.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <ContactForm
        fields={formFields}
        submitLabel="Request a Demo"
        onSubmit={formAction}
        pending={isPending}
      />
    </>
  );
}
