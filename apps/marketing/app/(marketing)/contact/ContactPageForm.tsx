"use client";

import { useActionState } from "react";
import { ContactForm } from "@prepforall/marketing-ui/organisms";
import { submitContactForm, type ContactFormState } from "./actions";

const initialState: ContactFormState = { success: false };

const formFields = [
  { name: "name" as const, label: "Name", type: "text" as const, placeholder: "Your name", required: true },
  { name: "email" as const, label: "Email", type: "email" as const, placeholder: "you@example.com", required: true },
  { name: "subject" as const, label: "Subject", type: "text" as const, placeholder: "How can we help?", required: false },
  { name: "message" as const, label: "Message", type: "textarea" as const, placeholder: "Your message...", required: true },
];

export function ContactPageForm() {
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    initialState
  );

  if (state.success) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <p className="text-lg font-semibold text-green-800">
          Message sent! We&apos;ll respond within 24 hours.
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
        submitLabel="Send Message"
        onSubmit={formAction}
        pending={isPending}
      />
    </>
  );
}
