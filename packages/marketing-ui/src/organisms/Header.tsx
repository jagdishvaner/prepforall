"use client";

import { useState } from "react";

export interface NavLink {
  label: string;
  href: string;
}

export interface HeaderProps {
  logoSrc: string;
  navLinks: NavLink[];
  loginHref: string;
  ctaLabel: string;
  ctaHref: string;
  currentPath?: string;
}

export function Header({
  logoSrc,
  navLinks,
  loginHref,
  ctaLabel,
  ctaHref,
  currentPath,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1080px] items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="PrepForAll" width={140} height={32} />
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                link.href === currentPath
                  ? "font-semibold text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={loginHref}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            Login
          </a>
          <a
            href={ctaHref}
            className="rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90"
          >
            {ctaLabel}
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white px-6 py-4 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block py-2 text-sm font-medium text-gray-600"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="mt-4 flex flex-col gap-2">
            <a href={loginHref} className="rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium">
              Login
            </a>
            <a href={ctaHref} className="rounded-lg bg-brand-primary px-4 py-2 text-center text-sm font-semibold text-white">
              {ctaLabel}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
