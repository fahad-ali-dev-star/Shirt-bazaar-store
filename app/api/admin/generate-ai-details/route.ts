import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { logServerError } from "@/lib/api/errors";

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

export async function POST(req: NextRequest) {
  const { authorized, user } = await requireAdmin();
  // Allow development mode convenience if user is logged in
  if (!authorized && !(process.env.NODE_ENV === "development" && user)) {
    return NextResponse.json({ error: "Unauthorized admin access" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "GEMINI_API_KEY is not configured in your environment variables. Please add GEMINI_API_KEY to your .env.local file.",
      },
      { status: 500 }
    );
  }

  try {
    const { imageUrl, currentName, currentCategory } = await req.json();
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "Please upload at least one image first so AI can analyze it." },
        { status: 400 }
      );
    }

    // Fetch image data from the provided URL
    let base64Data: string | null = null;
    let mimeType: string = "image/jpeg";

    if (imageUrl.startsWith("data:")) {
      const parts = imageUrl.split(",");
      const matches = imageUrl.match(/^data:(image\/[a-zA-Z+]+);base64,/);
      if (matches && matches[1]) {
        mimeType = matches[1];
      }
      base64Data = parts[1];
    } else {
      try {
        const imgRes = await fetch(imageUrl, { headers: { "User-Agent": "ShirtBazaar/1.0" } });
        if (imgRes.ok) {
          const contentType = imgRes.headers.get("content-type");
          if (contentType && contentType.startsWith("image/")) {
            mimeType = contentType.split(";")[0].trim();
          }
          const arrayBuffer = await imgRes.arrayBuffer();
          base64Data = Buffer.from(arrayBuffer).toString("base64");
        }
      } catch (fetchErr) {
        console.warn("Could not download image for AI analysis, will fallback to text prompt:", fetchErr);
      }
    }

    const prompt = `You are a professional fashion copywriter for "Shirt Bazaar", a premium men's clothing store in Pakistan.
Analyze this shirt photo ${currentName ? `(Draft title: "${currentName}")` : ""} and write high-converting, professional e-commerce product details.

Return a JSON object with EXACTLY these fields:
- "name": A catchy, elegant product title (e.g., "Classic Oxford Long-Sleeve Shirt", "Textured Indigo Chambray Shirt", "Oversized Heavyweight Cotton Tee").
- "description": A compelling 2-3 sentence description emphasizing fabric quality (100% premium combed cotton), tailored fit, stitching craftsmanship, and styling versatility for casual or smart-casual wear.
- "category": A single category slug chosen from: "oxford-shirts", "casual-shirts", "formal-shirts", "polos", "t-shirts", "oversized-tees", "denim-shirts", "linen-shirts".

Respond ONLY with valid JSON, with no markdown code blocks and no extra commentary.`;

    const parts: any[] = [{ text: prompt }];

    if (base64Data) {
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data,
        },
      });
    }

    const requestBody = {
      contents: [{ parts }],
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0.3,
      },
    };

    let generatedText: string | null = null;
    let lastError = "";

    // Try each valid Gemini model in order until one succeeds
    for (const model of GEMINI_MODELS) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (res.ok) {
          const resData = await res.json();
          const text = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            generatedText = text;
            break;
          }
        } else {
          const errBody = await res.text();
          lastError = `Model ${model} failed (${res.status}): ${errBody}`;
          console.warn(lastError);
        }
      } catch (modelErr: any) {
        lastError = modelErr?.message || "Network request failed";
      }
    }

    if (!generatedText) {
      logServerError("All Gemini models failed", lastError);
      return NextResponse.json(
        {
          error:
            "Gemini API could not generate details. Please check that your GEMINI_API_KEY is valid and has Gemini API enabled in Google AI Studio / Google Cloud Console.",
          details: lastError,
        },
        { status: 502 }
      );
    }

    // Clean JSON response (strip any ```json ... ``` wrapper if present)
    let cleanJson = generatedText.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsedData = JSON.parse(cleanJson);

    return NextResponse.json({
      success: true,
      data: {
        name: parsedData.name ?? "",
        description: parsedData.description ?? "",
        category: parsedData.category ?? currentCategory ?? "",
      },
    });
  } catch (err: unknown) {
    logServerError("AI product details generation failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate AI details" },
      { status: 500 }
    );
  }
}
