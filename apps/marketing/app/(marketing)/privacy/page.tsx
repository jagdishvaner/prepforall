import type { Metadata } from "next";
import { SectionWrapper } from "@prepforall/marketing-ui/atomic";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "PrepForAll privacy policy.",
};

export default function PrivacyPage() {
  return (
    <SectionWrapper background="white">
      <div className="prose prose-gray mx-auto max-w-3xl">
        <h1>Privacy Policy</h1>
        <p className="text-gray-500">Last updated: April 2026</p>

        <h2>1. Information We Collect</h2>
        <p>
          We collect information that your university or training partner provides
          when enrolling you on the platform, including your name, email address,
          and institutional affiliation.
        </p>

        <h2>2. How We Use Your Information</h2>
        <p>
          Your information is used to provide the PrepForAll platform services,
          including delivering coding practice, assessments, and analytics to you
          and your institution.
        </p>

        <h2>3. Data Sharing</h2>
        <p>
          We share performance analytics with your institution&apos;s authorized
          trainers and administrators. We do not sell your data to third parties.
        </p>

        <h2>4. Data Security</h2>
        <p>
          We use industry-standard encryption and security practices to protect
          your data, including encrypted connections and secure infrastructure.
        </p>

        <h2>5. Contact</h2>
        <p>
          For privacy-related questions, contact us at{" "}
          <a href="mailto:privacy@prepforall.com">privacy@prepforall.com</a>.
        </p>
      </div>
    </SectionWrapper>
  );
}
