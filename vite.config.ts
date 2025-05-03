import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [cloudflare(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      external: ['stripe']
    }
  },
  define: {
    'process.env.VITE_SUPABASE_URL': JSON.stringify('https://enryddelkevswwawmkyx.supabase.co'),
    'process.env.VITE_SUPABASE_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucnlkZGVsa2V2c3d3YXdta3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzMDEwNzUsImV4cCI6MjA1Njg3NzA3NX0.qLMdHoQaD47thhpV-Eq3U0Hyr1fYDbygf0SKfGphKx0'),
    'process.env.OPENAI_API_KEY': JSON.stringify('sk-')
  }
});
