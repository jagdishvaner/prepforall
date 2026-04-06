"use client";

import { usePathname } from "next/navigation";
import { Header, type HeaderProps } from "@prepforall/marketing-ui/organisms";

export function MarketingHeader(props: HeaderProps) {
  const pathname = usePathname();
  return <Header {...props} currentPath={pathname} />;
}
