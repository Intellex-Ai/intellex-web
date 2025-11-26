import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "var(--primary)",
                    foreground: "var(--primary-foreground)",
                    hover: "var(--primary-hover)",
                },
                muted: {
                    DEFAULT: "var(--muted)",
                    foreground: "var(--muted-foreground)",
                },
                border: "var(--border)",
                surface: {
                    DEFAULT: "var(--surface)",
                    foreground: "var(--foreground)",
                },
                success: "var(--success)",
                warning: "var(--warning)",
                error: "var(--error)",
                info: "var(--info)",
            },
            fontFamily: {
                mono: ["var(--font-mono)", "monospace"],
                sans: ["var(--font-inter)", "sans-serif"],
            },
            keyframes: {
                glitch: {
                    "0%": { clipPath: "inset(50% 0 30% 0)", transform: "translate(-5px, 0)" },
                    "20%": { clipPath: "inset(10% 0 60% 0)", transform: "translate(5px, 0)" },
                    "40%": { clipPath: "inset(40% 0 40% 0)", transform: "translate(-5px, 0)" },
                    "60%": { clipPath: "inset(80% 0 5% 0)", transform: "translate(5px, 0)" },
                    "80%": { clipPath: "inset(10% 0 70% 0)", transform: "translate(-5px, 0)" },
                    "100%": { clipPath: "inset(30% 0 50% 0)", transform: "translate(0, 0)" },
                },
                typing: {
                    "from": { width: "0" },
                    "to": { width: "100%" },
                },
                "blink-caret": {
                    "from, to": { borderColor: "transparent" },
                    "50%": { borderColor: "var(--primary)" },
                },
                slideUp: {
                    "from": { opacity: "0", transform: "translateY(20px)" },
                    "to": { opacity: "1", transform: "translateY(0)" },
                },
                fadeIn: {
                    "from": { opacity: "0" },
                    "to": { opacity: "1" },
                },
                pulseGlow: {
                    "0%, 100%": { boxShadow: "0 0 10px -5px var(--primary)" },
                    "50%": { boxShadow: "0 0 20px -5px var(--primary)" },
                },
                shine: {
                    "0%": { transform: "translateX(-100%)" },
                    "20%": { transform: "translateX(100%)" },
                    "100%": { transform: "translateX(100%)" },
                },
            },
            animation: {
                glitch: "glitch 0.3s cubic-bezier(.25, .46, .45, .94) both infinite",
                typing: "typing 3.5s steps(30, end), blink-caret 0.75s step-end infinite",
                "slide-up": "slideUp 0.3s cubic-bezier(0, 0, 0.2, 1) forwards",
                "fade-in": "fadeIn 0.2s cubic-bezier(0, 0, 0.2, 1) forwards",
                "pulse-glow": "pulseGlow 2s infinite",
                shine: "shine 5s infinite",
            },
        },
    },
    plugins: [],
};
export default config;
