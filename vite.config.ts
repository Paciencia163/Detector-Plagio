import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Configuração final para Vite + React (produção no Vercel)
export default defineConfig({
  // Base correta para Vercel (SPA)
  base: "/",

  // Plugins
  plugins: [
    react(),
  ],

  // Resolução de caminhos (alias @/)
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Build otimizado
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
