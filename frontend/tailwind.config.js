/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F6F5F0",
        stone: {
          50: "#FAF9F5",
          100: "#F6F5F0",
          200: "#ECEDE7",
          300: "#E2E4DC",
          400: "#C6C8BD",
          500: "#9DA094",
        },
        primary: {
          DEFAULT: "#202823",
          muted: "#727B74",
        },
        forest: {
          light: "#2E5F4C",
          DEFAULT: "#244D3D",
          dark: "#1E3028",
          darker: "#16231D",
        },
        lime: {
          DEFAULT: "#C9E66B",
          hover: "#BBE054",
          light: "#F2F9DE",
        },
        orange: {
          warm: "#E88B57",
          light: "#FDF0EA",
        },
        border: {
          subtle: "#E2E4DC",
          strong: "#CDD0C4",
        },
      },
      fontFamily: {
        sans: ["Manrope", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        heading: ["Space Grotesk", "Manrope", "-apple-system", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(32, 40, 35, 0.04), 0 4px 12px rgba(32, 40, 35, 0.03)",
        elevated: "0 4px 20px rgba(32, 40, 35, 0.06), 0 1px 3px rgba(32, 40, 35, 0.04)",
        card: "0 1px 3px rgba(32, 40, 35, 0.05)",
      },
    },
  },
  plugins: [],
};
