import { NextRequest, NextResponse } from "next/server";
import { logServerError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

const BUCKET = "product-images";
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB – banners are larger than product thumbs
const MAX_MULTIPART_SIZE = 9 * 1024 * 1024;

const ALLOWED_TYPES = new Map([
  [
    "image/jpeg",
    {
      ext: "jpg",
      signature: (b: Buffer) =>
        b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
    },
  ],
  [
    "image/png",
    {
      ext: "png",
      signature: (b: Buffer) =>
        b.length >= 8 &&
        b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    },
  ],
  [
    "image/webp",
    {
      ext: "webp",
      signature: (b: Buffer) =>
        b.length >= 12 &&
        b.subarray(0, 4).toString() === "RIFF" &&
        b.subarray(8, 12).toString() === "WEBP",
    },
  ],
]);

export async function POST(req: NextRequest) {
  const { authorized } = await requireAdmin();
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_SIZE) {
      return NextResponse.json({ error: "Upload is too large (max 8 MB)" }, { status: 413 });
    }

    const formData = await req.formData();
    const files = formData.getAll("file");
    if (files.length !== 1 || !(files[0] instanceof File)) {
      return NextResponse.json({ error: "Exactly one image file is required" }, { status: 400 });
    }

    for (const [key, value] of formData.entries()) {
      if (key !== "file" || !(value instanceof File)) {
        return NextResponse.json({ error: "Unexpected upload fields" }, { status: 400 });
      }
    }

    const file = files[0];
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Banner image must be between 1 byte and 8 MB" },
        { status: 400 },
      );
    }

    const type = ALLOWED_TYPES.get(file.type);
    if (!type) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP images are allowed" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length !== file.size || !type.signature(buffer)) {
      return NextResponse.json({ error: "Uploaded file is not a valid image" }, { status: 400 });
    }

    const objectPath = `banners/${randomUUID()}.${type.ext}`;

    const supabase = createAdminClient();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, buffer, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      logServerError("Banner image upload failed", uploadError);
      return NextResponse.json({ error: "Failed to upload banner image" }, { status: 500 });
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
    if (!data.publicUrl) {
      await supabase.storage.from(BUCKET).remove([objectPath]);
      return NextResponse.json({ error: "Failed to create image URL" }, { status: 500 });
    }

    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    logServerError("Banner image upload request failed", err);
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  }
}
