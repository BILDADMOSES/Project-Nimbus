import type { Config } from "tailwindcss";
import daisyui from "daisyui"


const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  plugins: [
    daisyui,
    require('tailwind-scrollbar-hide')
  ],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          ".nimbus-text": {
            "color": "#000"
          },
          ".nimbus-text-light": {
            "color": "#555"
          },
          ".nimbus-bg": {
            "background-color": "#eee",
          },
        }
      },
      {
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          ".nimbus-text": {
            "color": "#fff"
          },
          ".nimbus-text-light": {
            "color": "#aaa"
          },
          ".nimbus-bg": {
            "background-color": "#000",
          },
        }
      },
    ],
    
    
  },
};
export default config;
