import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 } as const;

export const ogContentType = "image/png";

export const OG_INSTALL_LINE = "curl -fsSL yoink.codes/install.sh | bash";

export type OgImageInput = {
  title: string;
  subtitle?: string;
};

const palette = {
  background: "#0a0908",
  ink: "#f5f4f2",
  muted: "rgba(245, 244, 242, 0.68)",
  faint: "rgba(245, 244, 242, 0.5)",
  brand: "#facc15",
} as const;

const fontsDir = join(process.cwd(), "assets", "fonts");

const readFont = (file: string): Buffer => readFileSync(join(fontsDir, file));

const fonts = [
  { name: "Archivo", data: readFont("Archivo-Bold.woff"), weight: 700, style: "normal" },
  { name: "Archivo", data: readFont("Archivo-SemiBold.woff"), weight: 600, style: "normal" },
  { name: "Archivo", data: readFont("Archivo-Regular.woff"), weight: 400, style: "normal" },
  { name: "JetBrains Mono", data: readFont("JetBrainsMono-Regular.ttf"), weight: 400, style: "normal" },
] as const;

const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${palette.ink}"><path transform="matrix(0.014826 0 0 -0.014826 2.3855 21.8369)" d="M424 0V422L-26 1327H408L867 391V0ZM895 484 680 920 898 1327H1323Z"/></svg>`;

const markDataUri = `data:image/svg+xml;base64,${Buffer.from(markSvg).toString("base64")}`;

export const ogTitleSize = (title: string): number => {
  if (title.length > 44) return 60;
  if (title.length > 26) return 70;
  return 84;
};

export const createOgImage = ({ title, subtitle }: OgImageInput): ImageResponse =>
  new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: palette.background,
          color: palette.ink,
          fontFamily: "Archivo",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img width={40} height={40} src={markDataUri} alt="" />
            <div style={{ display: "flex", fontSize: 32, fontWeight: 600, letterSpacing: -0.6 }}>Yoink</div>
          </div>
          <div style={{ display: "flex", fontFamily: "JetBrains Mono", fontSize: 22, color: palette.faint }}>
            yoink.codes
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 1000 }}>
          <div
            style={{
              display: "flex",
              maxWidth: 900,
              fontSize: ogTitleSize(title),
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.04,
            }}
          >
            {title}
          </div>
          {subtitle === undefined ? null : (
            <div
              style={{
                display: "flex",
                marginTop: 26,
                maxWidth: 900,
                fontSize: 28,
                fontWeight: 400,
                lineHeight: 1.4,
                textWrap: "pretty",
                color: palette.muted,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", width: 112, height: 6, backgroundColor: palette.brand }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontFamily: "JetBrains Mono",
              fontSize: 26,
            }}
          >
            <div style={{ display: "flex", color: palette.faint }}>$</div>
            <div style={{ display: "flex", color: palette.ink }}>{OG_INSTALL_LINE}</div>
          </div>
        </div>
      </div>
    ),
    { ...ogSize, fonts: [...fonts] },
  );
