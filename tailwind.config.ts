import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					hover: 'hsl(var(--accent-hover))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				energy: {
					high: 'hsl(var(--energy-high))',
					medium: 'hsl(var(--energy-medium))',
					low: 'hsl(var(--energy-low))',
					grid: 'hsl(var(--energy-grid))'
				},
				orchestra: 'hsl(var(--orchestra))',
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-energy': 'var(--gradient-energy)',
				'gradient-subtle': 'var(--gradient-subtle)',
				'gradient-glow': 'var(--gradient-glow)'
			},
			boxShadow: {
				'fleet-sm': 'var(--shadow-sm)',
				'fleet-md': 'var(--shadow-md)',
				'fleet-lg': 'var(--shadow-lg)',
				'glow': 'var(--shadow-glow)',
				'glow-sm': 'var(--shadow-glow-sm)',
				'glow-accent': 'var(--shadow-glow-accent)',
				'glow-energy': 'var(--shadow-energy-glow)',
				'backdrop-glow': 'var(--backdrop-glow)',
				'neon': 'var(--neon-glow)',
				'pulse': 'var(--pulse-glow)',
				'intense': 'var(--intense-glow)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in-up': {
					from: { opacity: '0', transform: 'translateY(12px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-in-scale': {
					from: { opacity: '0', transform: 'scale(0.96)' },
					to: { opacity: '1', transform: 'scale(1)' }
				},
				'shimmer-luxury': {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				},
				'number-tick': {
					from: { transform: 'translateY(-100%)', opacity: '0' },
					to: { transform: 'translateY(0)', opacity: '1' }
				},
				'pulse-ring': {
					'0%': { boxShadow: '0 0 0 0 hsl(var(--primary) / 0.4)' },
					'100%': { boxShadow: '0 0 0 12px hsl(var(--primary) / 0)' }
				},
				'pulse-energy': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.6' }
				},
				'slide-up': {
					from: { transform: 'translateY(10px)', opacity: '0' },
					to: { transform: 'translateY(0)', opacity: '1' }
				},
				'glow-pulse': {
					'0%, 100%': { 
						boxShadow: 'var(--shadow-glow-sm)', 
						transform: 'scale(1)' 
					},
					'50%': { 
						boxShadow: 'var(--shadow-glow)', 
						transform: 'scale(1.02)' 
					}
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-2px)' }
				},
				'shimmer': {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				},
				'neon-pulse': {
					'0%, 100%': { 
						textShadow: '0 0 5px hsl(var(--primary) / 0.8), 0 0 10px hsl(var(--primary) / 0.6)',
						filter: 'brightness(1)' 
					},
					'50%': { 
						textShadow: '0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary) / 0.8), 0 0 30px hsl(var(--primary) / 0.6)',
						filter: 'brightness(1.2)' 
					}
				},
				'cyber-fade': {
					'0%': { opacity: '0.4' },
					'50%': { opacity: '0.8' },
					'100%': { opacity: '0.4' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-energy': 'pulse-energy 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'slide-up': 'slide-up 0.5s ease-out',
				'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
				'float': 'float 3s ease-in-out infinite',
				'shimmer': 'shimmer 2s linear infinite',
				'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
				'cyber-fade': 'cyber-fade 4s ease-in-out infinite',
				'fade-in-up': 'fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
				'fade-in-scale': 'fade-in-scale 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
				'shimmer-luxury': 'shimmer-luxury 2.5s linear infinite',
				'number-tick': 'number-tick 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
				'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
