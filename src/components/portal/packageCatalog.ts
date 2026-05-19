import { type PackageType } from "@/lib/types";

export type PackageCatalogItem = {
  type: PackageType;
  title: string;
  shortTitle: string;
  category: string;
  color: string;
  description: string;
};

export const PACKAGE_CATALOG: PackageCatalogItem[] = [
  {
    type: "Launch",
    title: "Launch Suite",
    shortTitle: "Launch",
    category: "Suite",
    color: "#0064E0",
    description:
      "For businesses preparing a professional launch, website rollout, brand presence, or customer-facing digital system.",
  },
  {
    type: "Impact",
    title: "Impact Suite",
    shortTitle: "Impact",
    category: "Suite",
    color: "#E61525",
    description:
      "For NGOs, campaigns, social initiatives, and mission-driven projects that need visibility, credibility, and donation readiness.",
  },
  {
    type: "Growth",
    title: "Growth Suite",
    shortTitle: "Growth",
    category: "Suite",
    color: "#29BE3E",
    description:
      "For existing businesses that want stronger sales structure, automation, conversion flow, and digital growth systems.",
  },
  {
    type: "Partner",
    title: "Partner Suite",
    shortTitle: "Partner",
    category: "Suite",
    color: "#5300D9",
    description:
      "For long-term execution support, strategic collaboration, managed project delivery, and continuous business improvement.",
  },
  {
    type: "WebsiteStarter",
    title: "Website Dev. Starter",
    shortTitle: "Website Starter",
    category: "Website",
    color: "#0064E0",
    description:
      "For a clean starter website or landing page that helps a business look credible, clear, and ready for enquiries.",
  },
  {
    type: "WebsiteProBiz",
    title: "Website Dev. Pro-Biz",
    shortTitle: "Website Pro-Biz",
    category: "Website",
    color: "#FC7E24",
    description:
      "For a complete business website with stronger structure, conversion flow, content sections, and professional presentation.",
  },
  {
    type: "WebsiteAdvance",
    title: "Website Dev. Advance",
    shortTitle: "Website Advance",
    category: "Website",
    color: "#29BE3E",
    description:
      "For advanced websites, e-commerce, landing pages, integrations, or custom digital experiences requiring deeper delivery.",
  },
  {
    type: "BrandingStarter",
    title: "Branding Starter",
    shortTitle: "Branding Starter",
    category: "Branding",
    color: "#E61525",
    description:
      "For a clean starter identity covering logo, visual direction, brand guide, and essential business materials.",
  },
  {
    type: "BrandingProBiz",
    title: "Branding Pro-Biz",
    shortTitle: "Branding Pro-Biz",
    category: "Branding",
    color: "#FC7E24",
    description:
      "For a stronger brand system with social assets, presentation materials, and more complete professional rollout.",
  },
  {
    type: "BrandingAdvance",
    title: "Branding Advance",
    shortTitle: "Branding Advance",
    category: "Branding",
    color: "#5300D9",
    description:
      "For premium identity systems with deeper brand personality, packaging, brochure, signage, and wider applications.",
  },
  {
    type: "LeapRegistration",
    title: "Leap / Registration",
    shortTitle: "Leap",
    category: "Leap",
    color: "#0064E0",
    description:
      "For business registration, CAC/TIN readiness, compliance support, licensing guidance, and founder setup structure.",
  },
  {
    type: "Custom",
    title: "Custom",
    shortTitle: "Custom",
    category: "Custom",
    color: "#5300D9",
    description:
      "For special projects that need a custom delivery structure, mixed services, or a scope outside a standard package.",
  },
];

export function getPackageCatalogItem(packageType?: string) {
  return (
    PACKAGE_CATALOG.find((item) => item.type === packageType) ??
    PACKAGE_CATALOG[0]
  );
}

export function getPackageTitle(packageType?: string) {
  return getPackageCatalogItem(packageType).title;
}