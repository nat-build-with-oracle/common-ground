import type { NextConfig } from "next";

// OFFICE_HOSTED=1 builds the static page for town.buildwithoracle.com: no API routes
// (only app/**/{page,layout}.web.tsx are entries), data comes from ?host= in the browser.
const hosted = process.env.OFFICE_HOSTED === "1";

const config: NextConfig = {
  transpilePackages: ["three"],
  poweredByHeader: false,
  ...(hosted ? { output: "export" as const, pageExtensions: ["web.tsx"], env: { NEXT_PUBLIC_OFFICE_HOSTED: "1" }, images: { unoptimized: true } } : {}),
};

export default config;
