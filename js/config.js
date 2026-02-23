tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                idps: {
                    primary: '#2f7f33', // Official Green
                    secondary: '#d4af37', // Official Gold
                    accent: '#1e5424', // Darker green for interaction
                    dark: '#111827', // Dark gray for text
                    light: '#f9fafb', // Clean professional background (Gray-50)
                    surface: '#ffffff', // Card background
                    border: '#e5e7eb' // Light border
                }
            },
            fontFamily: {
                sans: ['Lexend', 'sans-serif'],
                display: ['Lexend', 'sans-serif']
            },
            boxShadow: {
                'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                'glow': '0 0 15px rgba(47, 127, 51, 0.3)',
            },
            animation: {
                'fade-in': 'fadeIn 0.6s ease-out forwards',
                'slide-up': 'slideUp 0.6s ease-out forwards',
                'pulse-slow': 'pulse 3s infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                }
            }
        }
    }
}
