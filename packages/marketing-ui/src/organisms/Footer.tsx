/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";

export interface FooterColumn {
  title: string;
  links: Array<{ label: string; href: string }>;
}

export interface SocialLink {
  platform: string;
  href: string;
  icon: ReactNode;
}

export interface FooterProps {
  logoSrc: string;
  tagline: string;
  columns: FooterColumn[];
  socialLinks: SocialLink[];
  copyright: string;
}

export function Footer({
  logoSrc,
  tagline,
  columns,
  socialLinks,
  copyright,
}: FooterProps) {
  return (
    <footer className="bg-brand-dark px-6 py-20 text-gray-400">
      <div className="mx-auto max-w-[1080px]">
        <div className="grid gap-12 md:grid-cols-5">
          {/* Brand column */}
          <div className="md:col-span-2">
            <img
              src={logoSrc}
              alt="PrepForAll"
              className="h-10 w-auto brightness-0 invert"
            />
            <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-gray-400">
              {tagline}
            </p>
            <div className="mt-8 flex gap-5">
              {socialLinks.map((social) => (
                <a
                  key={social.platform}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 transition-colors hover:text-white"
                  aria-label={social.platform}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
                {col.title}
              </h3>
              <ul className="space-y-4">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-[15px] transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-white/10 pt-8 text-center text-sm text-gray-500">
          {copyright}
        </div>
      </div>
    </footer>
  );
}
