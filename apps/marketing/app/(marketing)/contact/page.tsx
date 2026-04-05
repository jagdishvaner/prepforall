import type { Metadata } from "next";
import { SectionWrapper, SectionHeading } from "@prepforall/marketing-ui/atomic";
import { Mail, Phone, MapPin } from "lucide-react";
import { ContactPageForm } from "./ContactPageForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the PrepForAll team.",
};

export default function ContactPage() {
  return (
    <SectionWrapper background="white">
      <SectionHeading>Get in touch</SectionHeading>
      <div className="grid gap-12 lg:grid-cols-2">
        {/* Info */}
        <div>
          <p className="mb-8 text-gray-600">
            Have a question or want to learn more? Reach out and we&apos;ll get
            back to you within 24 hours.
          </p>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Mail className="mt-1 h-5 w-5 text-brand-primary" />
              <div>
                <p className="font-medium text-gray-900">Email</p>
                <a href="mailto:hello@prepforall.com" className="text-sm text-gray-600 hover:text-brand-primary">
                  hello@prepforall.com
                </a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="mt-1 h-5 w-5 text-brand-primary" />
              <div>
                <p className="font-medium text-gray-900">Phone</p>
                <a href="tel:+919876543210" className="text-sm text-gray-600 hover:text-brand-primary">
                  +91 98765 43210
                </a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <MapPin className="mt-1 h-5 w-5 text-brand-primary" />
              <div>
                <p className="font-medium text-gray-900">Office</p>
                <p className="text-sm text-gray-600">Chennai, Tamil Nadu, India</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <ContactPageForm />
      </div>
    </SectionWrapper>
  );
}
