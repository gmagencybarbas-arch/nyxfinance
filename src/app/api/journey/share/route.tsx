import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * Card vertical tipo story (1080×1920) para compartilhar conquista.
 * Query: type=mission|reward&title=&subtitle=&progress=&phrase=
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") === "reward" ? "reward" : "mission";
  const title = (searchParams.get("title") || "Conquista").slice(0, 80);
  const subtitle = (searchParams.get("subtitle") || "").slice(0, 100);
  const progress = (searchParams.get("progress") || "").slice(0, 40);
  const phrase = (searchParams.get("phrase") || "").slice(0, 120);

  const headline =
    type === "reward" ? "Nova recompensa liberada" : "Missão concluída";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 64px",
          background:
            type === "reward"
              ? "linear-gradient(165deg, #1e1035 0%, #3b1d6e 45%, #7c5c1e 100%)"
              : "linear-gradient(165deg, #12081f 0%, #2a1560 50%, #0f766e 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              fontSize: 28,
              opacity: 0.85,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Mini-Nyx · Jornada
          </div>
          <div style={{ fontSize: 42, fontWeight: 700, opacity: 0.9 }}>
            {headline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            padding: "40px 36px",
            borderRadius: 32,
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.15 }}>
            {title}
          </div>
          {subtitle ? (
            <div style={{ fontSize: 30, opacity: 0.85 }}>{subtitle}</div>
          ) : null}
          {phrase ? (
            <div style={{ fontSize: 28, opacity: 0.9 }}>{phrase}</div>
          ) : null}
          {progress ? (
            <div
              style={{
                marginTop: 8,
                fontSize: 26,
                fontWeight: 600,
                color: "#bbf7d0",
              }}
            >
              {progress}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 26,
            opacity: 0.8,
          }}
        >
          <span>Pequenos passos. Menos bagunça.</span>
          <span style={{ fontWeight: 700 }}>Nyx</span>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  );
}
