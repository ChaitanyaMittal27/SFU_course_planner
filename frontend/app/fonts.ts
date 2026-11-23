import { Geist, Geist_Mono } from "next/font/google";

// One UI font (Geist) plus Geist Mono for tabular data.
export const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// ============================================
// FONT STYLE CONSTANTS
// This file is the only type scale in the app.
// Never hardcode font sizes inline in JSX.
// ============================================

// Display — page titles and large headings
export const displayStyles = {
  sm: "text-[1.5rem] font-semibold leading-[1.2] tracking-tight",

  // Responsive page title
  mdResponsive: "text-[1.5rem] md:text-[2rem] font-semibold leading-[1.1] tracking-tight",

  // Landing — main landing page heading
  landing: "text-[2rem] md:text-[3.25rem] font-semibold leading-[1.04] tracking-tight",
};

// Headers — section headings, card titles
export const headerStyles = {
  lg: "text-[1.25rem] font-semibold leading-[1.3]",
  md: "text-[1.125rem] font-semibold leading-[1.3]",
  sm: "text-[1rem] font-semibold leading-[1.4]",
  xs: "text-[0.875rem] font-semibold leading-[1.4]",
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

// Buttons — nav links and other interactive text
export const buttonStyles = {
  md: "text-[0.875rem] font-medium leading-[1.2]",
  xl: "text-[1rem] font-medium leading-[1.2]",
};

// Numeric — seat counts, percentages, ratings, grades.
// Geist Mono with tabular figures so columns of numbers align.
export const numericStyles = {
  base: "font-mono tabular-nums",
  xl: "font-mono tabular-nums text-[2rem] font-semibold leading-none",
  // Summary-row values, e.g. median grade and fail rate (~22px)
  summary: "font-mono tabular-nums text-[1.375rem] font-semibold leading-tight",
  // Large single figure, e.g. a professor's overall rating (~36px)
  display: "font-mono tabular-nums text-[2.25rem] font-semibold leading-none tracking-tight",
  // Headline figures, e.g. the landing-page stats (~30px)
  stat: "font-mono tabular-nums text-[1.875rem] font-semibold leading-none tracking-tight",
  lg: "font-mono tabular-nums text-[1.25rem] font-medium leading-[1.2]",
  md: "font-mono tabular-nums text-[0.875rem] leading-[1.4]",
  sm: "font-mono tabular-nums text-[0.75rem] leading-[1.4]",
};
