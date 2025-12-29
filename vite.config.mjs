import { resolve } from "node:path";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import react from "@vitejs/plugin-react";

const htmlEntries = {
  main: resolve(__dirname, "index.html"),
  legacy: resolve(__dirname, "old/index.html"),
  reactPreview: resolve(__dirname, "new/index.html"),
  about: resolve(__dirname, "about.html"),
  privacy: resolve(__dirname, "privacy.html"),
  testNewsNewer: resolve(__dirname, "test-news-newer.html"),
};

const staticAssets = [
  { src: "audio/**/*", dest: "audio" },
  { src: "help/**/*", dest: "help" },
  { src: "images/**/*", dest: "images" },
  { src: "lib/**/*", dest: "lib" },
  { src: "localization/**/*", dest: "localization" },
  { src: "styles/**/*", dest: "styles" },
  { src: "svg-paint/**/*", dest: "svg-paint" },
  { src: "browserconfig.xml", dest: "" },
  { src: "favicon.ico", dest: "" },
  { src: "manifest.webmanifest", dest: "" },
  { src: "CNAME", dest: "" },
];

export default defineConfig({
  root: ".",
  publicDir: false,
  appType: "mpa",
  server: {
    host: "0.0.0.0",
    port: 1999,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: htmlEntries,
    },
  },
  plugins: [
    react(),
    viteStaticCopy({
      targets: staticAssets,
    }),
  ],
});
