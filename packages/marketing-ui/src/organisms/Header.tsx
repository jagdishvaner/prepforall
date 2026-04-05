"use client";

import { useState, useEffect } from "react";

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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-white/95 backdrop-blur transition-shadow duration-300 ${
        scrolled ? "shadow-[0_2px_4px_rgba(33,51,67,0.12)]" : ""
      }`}
    >
      <div className="mx-auto flex h-20 max-w-[1080px] items-center justify-between px-6">
        <a href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt="PrepForAll"
            className="h-10 w-auto object-cover object-top"
            style={{ objectPosition: "top", clipPath: "inset(0 0 52% 0)" }}
          />
          <span className="text-xl font-bold tracking-tight text-text-primary">
            Prep<span className="text-brand-primary">ForAll</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-[15px] font-medium transition-colors ${
                link.href === currentPath
                  ? "font-semibold text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <a
            href={loginHref}
            className="rounded-lg px-5 py-2.5 text-[15px] font-medium text-text-secondary transition-colors hover:bg-gray-100 hover:text-text-primary"
          >
            Login
          </a>
          <a
            href={ctaHref}
            className="rounded-lg bg-brand-primary px-6 py-2.5 text-[15px] font-medium text-white transition-all hover:brightness-110"
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
        <div className="border-t border-gray-100 bg-white px-6 py-4 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block py-3 text-[15px] font-medium text-text-secondary"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="mt-4 flex flex-col gap-3">
            <a href={loginHref} className="rounded-lg border border-gray-200 px-4 py-2.5 text-center text-[15px] font-medium">
              Login
            </a>
            <a href={ctaHref} className="rounded-lg bg-brand-primary px-4 py-2.5 text-center text-[15px] font-medium text-white">
              {ctaLabel}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
