import { createContext, useState, useMemo } from "react";
import { createTheme, Theme } from "@mui/material/styles";

export type ColorMode = "dark" | "light";

export interface TokenColors {
  grey: Record<number, string>;
  primary: Record<number, string>;
  greenAccent: Record<number, string>;
  redAccent: Record<number, string>;
  blueAccent: Record<number, string>;
}

export const tokens = (mode: ColorMode): TokenColors => ({
  ...(mode === "dark"
    ? {
        grey: {
          900: "#141414",
          800: "#292929",
          700: "#3d3d3d",
          600: "#525252",
          500: "#666666",
          400: "#858585",
          300: "#a3a3a3",
          200: "#c2c2c2",
          100: "#e0e0e0",
        },
        primary: {
          900: "#040509",
          800: "#080b12",
          700: "#0c101b",
          600: "#101624",
          500: "#141b2d",
          400: "#434957",
          300: "#727681",
          200: "#a1a4ab",
          100: "#d0d1d5",
        },
        greenAccent: {
          900: "#f0eeff",
          800: "#d0ccfb",
          700: "#aaa4f5",
          600: "#9188f0",
          500: "#766be8",
          400: "#9188f0",
          300: "#aaa4f5",
          200: "#d0ccfb",
          100: "#f0eeff",
        },
        redAccent: {
          900: "#2c100f",
          800: "#58201e",
          700: "#832f2c",
          600: "#af3f3b",
          500: "#db4f4a",
          400: "#e2726e",
          300: "#e99592",
          200: "#f1b9b7",
          100: "#f8dcdb",
        },
        blueAccent: {
          900: "#151632",
          800: "#2a2d64",
          700: "#3e4396",
          600: "#535ac8",
          500: "#6870fa",
          400: "#868dfb",
          300: "#a4a9fc",
          200: "#c3c6fd",
          100: "#e1e2fe",
        },
      }
    : {
        grey: {
          100: "#141414",
          200: "#292929",
          300: "#3d3d3d",
          400: "#525252",
          500: "#666666",
          600: "#858585",
          700: "#a3a3a3",
          800: "#c2c2c2",
          900: "#e0e0e0",
        },
        primary: {
          100: "#040509",
          200: "#080b12",
          300: "#0c101b",
          400: "#f2f0f0",
          500: "#141b2d",
          600: "#434957",
          700: "#727681",
          800: "#a1a4ab",
          900: "#d0d1d5",
        },
        greenAccent: {
          100: "#342780",
          200: "#4e43ae",
          300: "#5f52d9",
          400: "#6256d9",
          500: "#5f52d9",
          600: "#8980ee",
          700: "#aaa4f5",
          800: "#d0ccfb",
          900: "#f0eeff",
        },
        redAccent: {
          100: "#2c100f",
          200: "#58201e",
          300: "#832f2c",
          400: "#af3f3b",
          500: "#db4f4a",
          600: "#e2726e",
          700: "#e99592",
          800: "#f1b9b7",
          900: "#f8dcdb",
        },
        blueAccent: {
          100: "#151632",
          200: "#2a2d64",
          300: "#3e4396",
          400: "#535ac8",
          500: "#6870fa",
          600: "#868dfb",
          700: "#a4a9fc",
          800: "#c3c6fd",
          900: "#e1e2fe",
        },
      }),
});

export const themeSettings = (mode: ColorMode) => {
  const colors = tokens(mode);
  return {
    palette: {
      mode: mode,
      primary: {
        main: mode === "dark" ? "#a79eff" : "#5f52d9",
        light: mode === "dark" ? "#c9c3ff" : "#8d83ed",
        dark: mode === "dark" ? "#766be8" : "#4e43ae",
        contrastText: "#ffffff",
      },
      secondary: { main: mode === "dark" ? "#f0a6d9" : "#b951a9", light: "#f2b7df", dark: "#963b8a", contrastText: "#ffffff" },
      success: { main: mode === "dark" ? "#69c99d" : "#267b58" },
      error: { main: mode === "dark" ? "#f08e9b" : "#b93549" },
      text: { primary: mode === "dark" ? "#f5f3ff" : "#1a1a2e", secondary: mode === "dark" ? "#c1bdd3" : "#66748c" },
      divider: mode === "dark" ? "#3c3852" : "#e7e4f5",
      neutral: {
        dark: colors.grey[700],
        main: colors.grey[500],
        light: colors.grey[100],
      },
      background: {
        default: mode === "dark" ? "#1b1928" : "#fbfaff",
        paper: mode === "dark" ? "#242133" : "#ffffff",
      },
    },
    typography: {
      fontFamily: ["Tajawal", "Segoe UI", "sans-serif"].join(","),
      fontSize: 14,
      h1: { fontSize: 40 },
      h2: { fontSize: 32 },
      h3: { fontSize: 24 },
      h4: { fontSize: 20 },
      h5: { fontSize: 16 },
      h6: { fontSize: 14 },
    },
  };
};

export interface ColorModeContextType {
  toggleColorMode: () => void;
}

export const ColorModeContext = createContext<ColorModeContextType>({
  toggleColorMode: () => {},
});

export const useMode = (): [Theme, ColorModeContextType] => {
  const [mode, setMode] = useState<ColorMode>("light");

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () =>
        setMode((prev) => (prev === "light" ? "dark" : "light")),
    }),
    []
  );

  const theme = useMemo(() => createTheme(themeSettings(mode) as any), [mode]);

  return [theme, colorMode];
};
