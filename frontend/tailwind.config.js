export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  important: '.liquid-metal-hero',
  corePlugins: { preflight: false, container: false },
  theme: { extend: { colors: {
    background: '#111713', foreground: '#f4f5f0',
    primary: { DEFAULT: '#b9d98b', foreground: '#182015' },
    secondary: { DEFAULT: '#28342b', foreground: '#f4f5f0' },
    destructive: { DEFAULT: '#dc3545', foreground: '#ffffff' },
    accent: { DEFAULT: '#28342b', foreground: '#f4f5f0' },
    card: { DEFAULT: '#1b231d', foreground: '#f4f5f0' },
    muted: { foreground: '#a6afa8' }, border: '#465348', input: '#465348', ring: '#b9d98b'
  } } },
  plugins: [],
};
