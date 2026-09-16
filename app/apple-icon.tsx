import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1E3A8A",
          borderRadius: "36px",
        }}
      >
        <svg
          width="128"
          height="128"
          viewBox="0 0 128 128"
          fill="none"
        >
          {/* Handle */}
          <path
            d="M46 42V30C46 20.0589 54.0589 12 64 12C73.9411 12 82 20.0589 82 30V42"
            stroke="#14B8A6"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Bag Body Outline */}
          <path
            d="M30 42L18.5 97.5C17.2 103.5 21.8 109 28 109H100C106.2 109 110.8 103.5 109.5 97.5L98 42C97.3 38.4 94.1 35.8 90.4 35.8H37.6C33.9 35.8 30.7 38.4 30 42Z"
            stroke="#14B8A6"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Upward Arrow Stem */}
          <path
            d="M22 96C32 94 46 86 54 74L68 56"
            stroke="#14B8A6"
            strokeWidth="9"
            strokeLinecap="round"
          />
          {/* Solid Arrow Head */}
          <path
            d="M78 44L48 54L68 74L78 44Z"
            fill="#14B8A6"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
