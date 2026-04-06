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
    <SectionWrapper background="cream">
      <SectionHeading subtitle={subtitle}>{heading}</SectionHeading>
      <div className="mb-10 flex justify-center">
        <div className="inline-flex gap-1 rounded-xl bg-white p-1 shadow-sm">
          {tabs.map((tab, index) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(index)}
              className={`rounded-lg px-6 py-3 text-[15px] font-medium transition-all ${
                index === activeTab
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-text-secondary hover:bg-surface-warm hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          {/* Browser chrome */}
          <div className="flex h-10 items-center gap-2 border-b border-gray-200 bg-gray-50 px-4">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
            <div className="ml-4 h-5 flex-1 max-w-xs rounded bg-gray-200" />
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
