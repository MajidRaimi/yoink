import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fontsDir = join(process.cwd(), "assets", "fonts");
const archivoBold = readFileSync(join(fontsDir, "Archivo-Bold.woff"));
const archivoRegular = readFileSync(join(fontsDir, "Archivo-Regular.woff"));
const jetBrainsRegular = readFileSync(join(fontsDir, "JetBrainsMono-Regular.ttf"));

const bg = "#0a0908";
const brand = "#facc15";
const ink = "#f5f4f2";
const muted = "rgba(245, 244, 242, 0.62)";
const faint = "rgba(245, 244, 242, 0.4)";
const logoTint = "rgba(245, 244, 242, 0.5)";

const logosDir = join(process.cwd(), "public", "logos");

const loadLogo = (slug: string, color: string) => {
  const svg = readFileSync(join(logosDir, `${slug}.svg`), "utf8")
    .replace(/<title>.*?<\/title>/, "")
    .replace(/currentColor/g, color);
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};

const providers = [
  { slug: "anthropic", accent: true },
  { slug: "openrouter", accent: false },
  { slug: "ollama", accent: false },
  { slug: "zai", accent: false },
  { slug: "deepseek", accent: false },
  { slug: "moonshot", accent: false },
];

const wordmark = (() => {
  const svg = readFileSync(join(process.cwd(), "public", "icon.svg")).toString("utf8");
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
})();

const ProviderChip = ({ slug, accent }: { slug: string; accent: boolean }) => (
  <div
    style={{
      display: "flex",
      width: 124,
      height: 124,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: accent ? "rgba(250,204,21,0.09)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${accent ? "rgba(250,204,21,0.38)" : "rgba(255,255,255,0.08)"}`,
    }}
  >
    <img width={58} height={58} src={loadLogo(slug, accent ? brand : logoTint)} />
  </div>
);

type OgImageInput = {
  title: string;
  subtitle: string;
};

export const createOgImage = ({ title, subtitle }: OgImageInput) =>
  new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "row",
          padding: 72,
          backgroundColor: bg,
          backgroundImage:
            "radial-gradient(760px 700px at 90% 42%, rgba(250,204,21,0.12), rgba(250,204,21,0) 60%)",
          fontFamily: "Archivo",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 640, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            <img width={52} height={52} src={wordmark} />
            <div style={{ display: "flex", fontSize: 33, fontWeight: 700, color: brand, letterSpacing: -0.5 }}>
              yoink
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 62,
                fontWeight: 700,
                color: ink,
                letterSpacing: -2,
                lineHeight: 1.04,
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 26,
                fontWeight: 400,
                color: muted,
                lineHeight: 1.42,
                marginTop: 24,
                maxWidth: 560,
              }}
            >
              {subtitle}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ display: "flex", width: 44, height: 3, borderRadius: 999, backgroundColor: brand }} />
            <div style={{ display: "flex", fontFamily: "JetBrains Mono", fontSize: 22, color: faint }}>
              yoink.codes
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {providers.slice(0, 3).map((provider) => (
                <ProviderChip key={provider.slug} slug={provider.slug} accent={provider.accent} />
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 52 }}>
              {providers.slice(3).map((provider) => (
                <ProviderChip key={provider.slug} slug={provider.slug} accent={provider.accent} />
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo", data: archivoBold, weight: 700, style: "normal" },
        { name: "Archivo", data: archivoRegular, weight: 400, style: "normal" },
        { name: "JetBrains Mono", data: jetBrainsRegular, weight: 400, style: "normal" },
      ],
    },
  );
