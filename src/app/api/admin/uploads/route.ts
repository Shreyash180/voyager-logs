import type { NextRequest } from "next/server";
import crypto from "node:crypto";

import { withRoute } from "@/lib/http/route";
import { ApiError } from "@/lib/http/errors";
import { requireAdmin } from "@/lib/auth/require";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getServerEnv } from "@/lib/config/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 8 * 1024 * 1024;

function buildCloudinarySignature(params: Record<string, string>, apiSecret: string) {
  const query = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  return crypto.createHash("sha1").update(`${query}${apiSecret}`).digest("hex");
}

export async function POST(req: NextRequest) {
  return withRoute(async () => {
    requireAdmin(req);
    enforceRateLimit(req, {
      name: "admin-upload-thumbnail",
      max: 30,
      windowMs: 10 * 60 * 1000,
    });

    const env = getServerEnv();
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      throw new ApiError({
        status: 500,
        code: "UPLOAD_NOT_CONFIGURED",
        message: "Cloudinary environment variables are missing.",
      });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new ApiError({ status: 400, code: "INVALID_FILE", message: "File is required." });
    }

    if (!file.type.startsWith("image/")) {
      throw new ApiError({
        status: 400,
        code: "INVALID_FILE_TYPE",
        message: "Only image uploads are supported for thumbnails.",
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new ApiError({
        status: 400,
        code: "FILE_TOO_LARGE",
        message: "File is too large. Maximum allowed size is 8MB.",
      });
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = env.CLOUDINARY_FOLDER ?? "voyager-logs";
    const signature = buildCloudinarySignature(
      {
        folder,
        timestamp,
      },
      env.CLOUDINARY_API_SECRET,
    );

    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("api_key", env.CLOUDINARY_API_KEY);
    uploadForm.append("timestamp", timestamp);
    uploadForm.append("folder", folder);
    uploadForm.append("signature", signature);

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: uploadForm,
      },
    );

    if (!cloudinaryRes.ok) {
      const err = await cloudinaryRes.json().catch(() => null);
      throw new ApiError({
        status: 502,
        code: "UPLOAD_FAILED",
        message: err?.error?.message ?? "Cloudinary upload failed.",
      });
    }

    const result = (await cloudinaryRes.json()) as {
      secure_url: string;
      public_id: string;
      bytes: number;
      format: string;
    };

    return {
      image: {
        url: result.secure_url,
        publicId: result.public_id,
        bytes: result.bytes,
        format: result.format,
      },
    };
  });
}
