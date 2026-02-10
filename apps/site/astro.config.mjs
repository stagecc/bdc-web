import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const rootDir = dirname(fileURLToPath(import.meta.url));
const uswdsPackages = join(rootDir, "../../node_modules/@uswds/uswds/packages");

export default defineConfig({
  integrations: [react()],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: [uswdsPackages],
          silenceDeprecations: ["import", "global-builtin", "if-function"],
        },
      },
    },
  },
});
