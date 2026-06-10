"use client";

import { useState, useRef, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface AvatarUploadProps {
  avatarKey?: string;
  fallback?: React.ReactNode;
  onUpload: (key: string) => void;
  onRemove: () => void;
  className?: string;
}

async function compressImage(file: File): Promise<File> {
  const MAX_DIM = 256;
  const QUALITY = 0.8;

  const img = new Image();
  const url = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        QUALITY
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}

export function AvatarUpload({ avatarKey, fallback, onUpload, onRemove, className }: AvatarUploadProps) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const avatarSrc = avatarKey ? `/api/avatar/serve?key=${encodeURIComponent(avatarKey)}` : undefined;

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return; // pre-check before compress

    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed);

      const res = await fetch("/api/avatar/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Upload failed: ${res.status}`);
      }
      const { key } = await res.json();
      onUpload(key);
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }, [handleFile]);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className={cn(
          "relative group cursor-pointer",
          uploading && "pointer-events-none"
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <Avatar className="h-20 w-20 ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all">
          {avatarSrc && <AvatarImage src={avatarSrc} />}
          <AvatarFallback className="text-2xl font-black bg-primary text-primary-foreground">
            {fallback}
          </AvatarFallback>
        </Avatar>

        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </div>

        {avatarKey && !uploading && (
          <button
            type="button"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/80"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {dragging && (
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary bg-primary/10 flex items-center justify-center">
            <span className="text-xs text-primary font-medium">{t("players.dropImage")}</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onChange}
      />

      <span className="text-xs text-muted-foreground">
        {uploading ? t("players.uploadingAvatar") : t("players.clickToUploadAvatar")}
      </span>
    </div>
  );
}
