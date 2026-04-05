"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { SectionWrapper } from "../atomic/SectionWrapper";
import { SectionHeading } from "../atomic/SectionHeading";

export interface ProductTab {
  label: string;
  screenshotSrc: string;
  screenshotAlt: string;
}

export interface ProductPreviewProps {
  heading: string;
  subtitle?: string;
  tabs: ProductTab[];
}

export function ProductPreview({ heading, subtitle, tabs }: ProductPreviewProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <SectionWrapper background="gray">
      <SectionHeading subtitle={subtitle}>{heading}</SectionHeading>
      <div className="mb-8 flex justify-center gap-2">
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(index)}
            className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
              index === activeTab
                ? "bg-brand-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex h-8 items-center gap-2 border-b border-gray-200 bg-gray-100 px-4">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <img
            src={tabs[activeTab].screenshotSrc}
            alt={tabs[activeTab].screenshotAlt}
            width={896}
            height={560}
            className="w-full"
          />
        </div>
      </div>
    </SectionWrapper>
  );
}
