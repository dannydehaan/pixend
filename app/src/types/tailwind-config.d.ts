declare module "*.config.js" {
  import type { Config } from "tailwindcss";
  const config: Config;
  export default config;
}
