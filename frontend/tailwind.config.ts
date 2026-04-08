import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#080B09",
        deep: "#0D1410",
        surface: "#141D17",
        raised: "#1C2820",
        parchment: "#F5F0E8",
        gold: {
          dim: "#8B6914",
          mid: "#C9960C",
          bright: "#F0B429",
          shine: "#FFD166"
        }
      },
      fontFamily: {
        display: ["Cormorant Garamond", "Georgia", "serif"],
        body: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        legal: ["IM Fell English", "serif"]
      },
      animation: {
        "spin-slow": "spin 8s linear infinite",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite"
      },
      keyframes: {
        pulseGold: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(240,180,41,0)" },
          "50%": { boxShadow: "0 0 0 8px rgba(240,180,41,0.15)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      }
    }
  },
  plugins: []
};

export default config;
