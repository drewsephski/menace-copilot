import type { Metadata } from "next";

import { TemplateGalleryCard } from "./template-gallery-card";

export const metadata: Metadata = {
  title: "Templates — Sky Agent",
  description: "Site templates with live preview thumbnails.",
};

const PREVIEW_IMAGE = "/preview-2026-09-11-v1-poster.jpg";
const PREVIEW_VIDEO = "/preview-2026-09-11-v1.mp4";

export default function TemplatesPage() {
  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-16 text-[#f7f7f2]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c41e3a]">Templates</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Sky Agent site template</h1>
          <p className="text-base leading-relaxed text-[#a8a89e]">
            Live preview thumbnail captured from the production Menace Agent landing page.
          </p>
        </header>

        <div className="max-w-md">
          <TemplateGalleryCard
            description="Dark-first SaaS landing with Sterling navigation, broadcast prompter hero, magnified bento features, and premium plan picker."
            name="Sky Agent"
            previewImage={PREVIEW_IMAGE}
            previewVideo={PREVIEW_VIDEO}
          />
        </div>
      </div>
    </main>
  );
}
