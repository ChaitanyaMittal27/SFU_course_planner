import { Inter, Geist } from "next/font/google";

export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

// ============================================
// FONT STYLE CONSTANTS
// All typography in the app uses these.
// Never hardcode font sizes inline in JSX.
// ============================================

// Display — hero text, splash screen, big numbers
export const displayStyles = {
  lg: "font-display text-[2.5rem] font-semibold leading-[1.1]",
  md: "font-display text-[2rem] font-semibold leading-[1.1]",
  sm: "text-[1.5rem] font-semibold leading-[1.2]",

  // Responsive variants
  lgResponsive: "font-display text-[1.75rem] md:text-[2.5rem] font-semibold leading-[1.1]",
  mdResponsive: "font-display text-[1.5rem] md:text-[2rem] font-semibold leading-[1.1]",

  // Hero — splash screen / fullscreen takeover only
  hero: "font-display text-[3.75rem] md:text-[4.5rem] font-bold leading-[1.1] tracking-tight",
};

// Headers — page titles, section headings, card titles
export const headerStyles = {
  lg: "text-[1.25rem] font-semibold leading-[1.3]",
  md: "text-[1.125rem] font-semibold leading-[1.3]",
  sm: "text-[1rem] font-semibold leading-[1.4]",
  xs: "text-[0.875rem] font-semibold leading-[1.4]",

  // Responsive variants
  lgResponsive: "text-[1.125rem] md:text-[1.25rem] font-semibold leading-[1.3]",
  mdResponsive: "text-[1rem] md:text-[1.125rem] font-semibold leading-[1.3]",
};

// Body — paragraph text, descriptions, content
export const bodyStyles = {
  lg: "text-[1rem] font-normal leading-[1.6]",
  md: "text-[0.875rem] font-normal leading-[1.6]",
  sm: "text-[0.75rem] font-normal leading-[1.5]",
};

// Labels — UI labels, tags, meta info, table headers
export const labelStyles = {
  lg: "text-[0.875rem] font-medium leading-[1.2]",
  md: "text-[0.75rem] font-medium leading-[1.2]",
  sm: "text-[0.6875rem] font-medium leading-[1.2]",
};

// Buttons — CTA text, nav links, interactive elements
export const buttonStyles = {
  lg: "text-[1rem] font-medium leading-[1.2]",
  md: "text-[0.875rem] font-medium leading-[1.2]",
  sm: "text-[0.75rem] font-medium leading-[1.2]",
};
