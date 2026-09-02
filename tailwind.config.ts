import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#10b981",
          dark: "#059669",
          light: "#34d399",
        },
        background: "hsl(0 0% 3.9%)",
        foreground: "hsl(0 0% 98%)",
        muted: "hsl(0 0% 14.9%)",
        "muted-foreground": "hsl(0 0% 63.9%)",
        border: "hsl(0 0% 14.9%)",
        input: "hsl(0 0% 14.9%)",
        card: "hsl(0 0% 3.9%)",
        "card-foreground": "hsl(0 0% 98%)",
        primary: "hsl(0 0% 98%)",
        "primary-foreground": "hsl(0 0% 9%)",
        secondary: "hsl(0 0% 14.9%)",
        "secondary-foreground": "hsl(0 0% 98%)",
        destructive: "hsl(0 62.8% 30.6%)",
        "destructive-foreground": "hsl(0 0% 98%)",
        accent: "hsl(0 0% 14.9%)",
        "accent-foreground": "hsl(0 0% 98%)",
        popover: "hsl(0 0% 3.9%)",
        "popover-foreground": "hsl(0 0% 98%)",
        ring: "hsl(0 0% 83.1%)",
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
      animation: {
        ticker: "ticker 30s linear infinite",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;