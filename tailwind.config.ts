import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    // shadcn placed files here during init
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // AssetFlow palette mapped to Tailwind utilities
        background: "#FFFFFF",
        "bg-subtle": "#F8F9FB",
        border: {
          DEFAULT: "#E5E7EB",
          strong: "#D1D5DB",
        },
        accent: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          light: "#EFF6FF",
          text: "#1D4ED8",
        },
        status: {
          green: "#16A34A",
          "green-bg": "#F0FDF4",
          amber: "#D97706",
          "amber-bg": "#FFFBEB",
          red: "#DC2626",
          "red-bg": "#FEF2F2",
          gray: "#6B7280",
          "gray-bg": "#F9FAFB",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04)",
        dropdown: "0 4px 16px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
