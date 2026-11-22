"use client";

import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const THEME_EVENT = "sfu-theme-change";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
}

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribeToTheme(listener: () => void) {
  const media = window.matchMedia?.(DARK_QUERY);
  window.addEventListener("storage", listener);
  window.addEventListener(THEME_EVENT, listener);
  media?.addEventListener?.("change", listener);

  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(THEME_EVENT, listener);
    media?.removeEventListener?.("change", listener);
  };
}

// An explicit saved choice wins; otherwise follow the OS preference.
function getThemeSnapshot(): Theme {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.(DARK_QUERY).matches ? "dark" : "light";
}

function getServerThemeSnapshot(): Theme {
  return "dark";
}

function subscribeToMount() {
  return () => undefined;
}

function getMountedSnapshot() {
  return true;
}

function getServerMountedSnapshot() {
  return false;
}

function saveTheme(theme: Theme) {
  localStorage.setItem("theme", theme);
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
  const mounted = useSyncExternalStore(subscribeToMount, getMountedSnapshot, getServerMountedSnapshot);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    if (!mounted) return;
    saveTheme(theme === "light" ? "dark" : "light");
  };

  const setThemeTo = (newTheme: Theme) => {
    if (!mounted) return;
    saveTheme(newTheme);
  };

  return { theme, toggleTheme, setThemeTo, mounted };
}
