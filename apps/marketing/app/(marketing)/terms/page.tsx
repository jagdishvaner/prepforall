import type { Metadata } from "next";
import { SectionWrapper } from "@prepforall/marketing-ui/atomic";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "PrepForAll terms of service.",
};

export default function TermsPage() {
  return (
    <SectionWrapper background="white">
      <div className="prose prose-gray mx-auto max-w-3xl">
        <h1>Terms of Service</h1>
        <p className="text-gray-500">Last updated: April 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing PrepForAll, you agree to these terms. Access is provided
          through institutional partnerships -- there is no public self-registration.
        </p>

        <h2>2. Platform Usage</h2>
        <p>
          You agree to use the platform for educational purposes only. Code
          submissions are executed in sandboxed environments and must not contain
          malicious content.
        </p>

        <h2>3. Intellectual Property</h2>
        <p>
          Problem content, editorial solutions, and platform design are the
          intellectual property of PrepForAll. Your code submissions remain yours.
        </p>

        <h2>4. Institutional Agreements</h2>
        <p>
          Access is governed by the MOU between PrepForAll and your institution.
          Specific terms may vary by partnership agreement.
        </p>

        <h2>5. Limitation of Liability</h2>
        <p>
          PrepForAll is provided &quot;as is.&quot; We are not liable for service
          interruptions or data loss beyond our reasonable control.
        </p>

        <h2>6. Contact</h2>
        <p>
          Questions about these terms: <a href="mailto:legal@prepforall.com">legal@prepforall.com</a>.
        </p>
      </div>
    </SectionWrapper>
  );
}
