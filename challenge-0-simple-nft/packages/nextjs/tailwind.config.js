/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [require("daisyui")],
  darkTheme: "dark",
  darkMode: ["selector", "[data-theme='dark']"],

  daisyui: {
    themes: [
      {
        light: {
          primary: "#00D1FF",
          "primary-content": "#000000",

          secondary: "#7F5AF0",
          "secondary-content": "#ffffff",

          accent: "#FF9F1C",
          "accent-content": "#000000",

          neutral: "#1F2937",
          "neutral-content": "#F3F4F6",

          "base-100": "#0F172A",
          "base-200": "#1E293B",
          "base-300": "#334155",
          "base-400": "#475569",
          "base-content": "#F8FAFC",

          info: "#38BDF8",
          success: "#22C55E",
          warning: "#FBBF24",
          error: "#EF4444",

          "--rounded-btn": "0.75rem",

          ".tooltip": {
            "--tooltip-tail": "6px",
            "--tooltip-color": "#1F2937",
            color: "#F8FAFC", // ✅ 白色文字
            backgroundColor: "#1F2937", // ✅ 深灰背景
            border: "1px solid #475569",
          },

          ".modal": {
            color: "#F8FAFC", // ✅ 保证 modal 文字可读
          },

          ".link": {
            textUnderlineOffset: "2px",
            color: "#00D1FF",
          },
          ".link:hover": {
            opacity: "0.8",
            textDecoration: "underline",
          },
        },
      },
      {
        dark: {
          primary: "#026262",
          "primary-content": "#C8F5FF",
          secondary: "#107575",
          "secondary-content": "#E9FBFF",
          accent: "#C8F5FF",
          "accent-content": "#088484",
          neutral: "#E9FBFF",
          "neutral-content": "#11ACAC",
          "base-100": "#11ACAC",
          "base-200": "#088484",
          "base-300": "#026262",
          "base-content": "#E9FBFF",
          info: "#C8F5FF",
          success: "#34EEB6",
          warning: "#FFCF72",
          error: "#FF8863",

          "--rounded-btn": "9999rem",

          ".tooltip": {
            "--tooltip-tail": "6px",
            "--tooltip-color": "oklch(var(--p))",
            color: "#026262",
            backgroundColor: "#C8F5FF",
            border: "1px solid #11ACAC",
          },

          ".link": {
            textUnderlineOffset: "2px",
          },
          ".link:hover": {
            opacity: "80%",
          },
        },
      },
    ],
  },

  theme: {
    extend: {
      fontFamily: {
        "space-grotesk": ["Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        center: "0 0 12px -2px rgb(0 0 0 / 0.05)",
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
};
