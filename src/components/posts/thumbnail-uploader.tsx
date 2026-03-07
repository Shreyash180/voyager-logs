"use client";

import { useEffect, useMemo } from "react";

import { NeonButton } from "@/components/ui/neon-button";

export function ThumbnailUploader({
  file,
  previewUrl,
  onFileChange,
  onUpload,
  uploading,
  disabled,
}: {
  file: File | null;
  previewUrl?: string | null;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
  uploading: boolean;
  disabled?: boolean;
}) {
  const localPreview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const activePreview = localPreview ?? previewUrl ?? null;

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 text-xs font-medium hover:bg-white/[0.05]">
          Choose image
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/jpg"
            className="hidden"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
        </label>
        <NeonButton
          type="button"
          onClick={onUpload}
          disabled={!file || uploading || disabled}
          className="h-9 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-55"
        >
          {uploading ? "Uploading..." : "Upload thumbnail"}
        </NeonButton>
        <span className="text-xs text-foreground/60">PNG/JPG/WebP up to 5MB</span>
      </div>

      <div className="glass-panel overflow-hidden rounded-xl border border-white/10">
        <div className="aspect-video w-full">
          {activePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={activePreview} alt="Thumbnail preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-foreground/55">
              Thumbnail preview will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
