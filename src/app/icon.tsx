import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(180deg, rgb(248, 244, 236) 0%, rgb(239, 231, 219) 100%)",
          color: "rgb(31, 41, 55)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 360,
            height: 360,
            borderRadius: 88,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(180deg, rgb(255, 228, 207), rgb(255, 182, 121))",
            boxShadow: "0 24px 60px rgba(129, 95, 27, 0.2)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 112,
              left: 66,
              width: 86,
              height: 24,
              borderRadius: 999,
              background: "rgb(255, 248, 234)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 168,
              left: 204,
              width: 90,
              height: 24,
              borderRadius: 999,
              background: "rgb(255, 248, 234)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 228,
              left: 104,
              width: 98,
              height: 24,
              borderRadius: 999,
              background: "rgb(255, 248, 234)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 170,
              left: 146,
              width: 72,
              height: 8,
              transform: "rotate(24deg)",
              transformOrigin: "left center",
              background: "rgba(49, 33, 15, 0.6)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 184,
              left: 146,
              width: 58,
              height: 8,
              transform: "rotate(-28deg)",
              transformOrigin: "left center",
              background: "rgba(49, 33, 15, 0.6)",
            }}
          />
          <div
            style={{
              width: 108,
              height: 32,
              borderRadius: 999,
              background: "rgb(49, 33, 15)",
            }}
          />
        </div>
      </div>
    ),
    size
  );
}
