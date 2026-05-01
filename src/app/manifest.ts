import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Building Mind Map",
    short_name: "Mind Map",
    description: "Create, drag, and organize idea maps from any device.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f4ec",
    theme_color: "#f8f4ec",
    icons: [
      {
        src: "/icon?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
