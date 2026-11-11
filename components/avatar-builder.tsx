'use client';
import { useMemo, useState, useRef, useId, useEffect } from "react";

export type AvatarConfig = {
  background?: string;
  accessory?: string;
  species?: string;
  skin: string;
  hair: string;
  hairColor: string;
  eyes: string;
  beard: string;
  outfit: string;
  scar: boolean;
  skinTexture?: string;
  faceShape?: string;
  details: string;
  portraitMode?: string;
  portraitPreset?: string;
};
export const defaultAvatar: AvatarConfig = {
  background: "forest",
  accessory: "none",
  species: "human",
  skin: "#c99470",
  hair: "long",
  hairColor: "#493025",
  eyes: "#468a6e",
  beard: "none",
  outfit: "cloak",
  scar: false,
  skinTexture: "natural",
  faceShape: "standard",
  details: "",
  portraitMode: "layers",
  portraitPreset: "guerrier",
};
const PREFIX = "CD_AVATAR_V1:";
export function readAvatar(value: string | null | undefined): AvatarConfig {
  if (!value) return { ...defaultAvatar };
  if (value.startsWith(PREFIX)) {
    try {
      const parsed: unknown = JSON.parse(value.slice(PREFIX.length));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        return { ...defaultAvatar };
      const raw = parsed as Record<string, unknown>;
      const next = { ...defaultAvatar };
      for (const key of Object.keys(defaultAvatar) as (keyof AvatarConfig)[]) {
        const candidate = raw[key];
        if (typeof candidate === typeof defaultAvatar[key]) {
          // The configuration is user-controlled data, never blindly merge unknown keys.
          (next as unknown as Record<string, unknown>)[key] = candidate;
        }
      }
      for (const key of [
        "background",
        "accessory",
        "species",
        "skinTexture",
        "faceShape",
        "portraitMode",
        "portraitPreset",
      ] as const) {
        if (typeof raw[key] === "string") next[key] = raw[key] as string;
      }
      return next;
    } catch {
      return { ...defaultAvatar };
    }
  }
  return { ...defaultAvatar, details: value };
}
export function writeAvatar(value: AvatarConfig) {
  return PREFIX + JSON.stringify(value);
}
function Choice({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  options: [string, string][];
}) {
  return (
    <label style={{ display: "grid", gap: 5 }}>
      <span className="field-label">{label}</span>
      <select
        className="field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}
function VectorAvatarPortrait({
  config,
  size = 240,
}: {
  config: AvatarConfig;
  size?: number;
}) {
  const c = config;
  const species = c.species || "human";
  const faceShape = c.faceShape || "standard";
  const faceRx =
    faceShape === "round"
      ? 49
      : faceShape === "gaunt"
        ? 39
        : faceShape === "angular"
          ? 43
          : 44;
  const faceRy = faceShape === "round" ? 57 : faceShape === "gaunt" ? 65 : 62;
  const pointedEars = ["elf", "half-elf", "gnome"].includes(species);
  const shortEars = ["dwarf", "halfling"].includes(species);
  const horned = ["tiefling", "dragonborn"].includes(species);
  const uid = useId().replace(/:/g, "");
  const gradient = (name: string) => `${uid}-${name}`;
  return (
    <svg
      role="img"
      aria-label="Portrait personnalisable du personnage"
      viewBox="0 0 240 270"
      width={size}
      style={{ maxWidth: "100%", height: "auto", borderRadius: 12 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradient("avatar-night")} x2="1" y2="1">
          <stop stopColor="#273a4a" />
          <stop offset="1" stopColor="#131a29" />
        </linearGradient>
        <radialGradient id={gradient("avatar-light")} cx=".34" cy=".22" r=".8">
          <stop stopColor="#f4d7a0" stopOpacity=".25" />
          <stop offset="1" stopColor="#000" stopOpacity=".45" />
        </radialGradient>
        <linearGradient
          id={gradient("avatar-face")}
          x1="0"
          y1="0"
          x2="1"
          y2=".4"
        >
          <stop stopColor="#fff" stopOpacity=".2" />
          <stop offset=".55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#2b0e0e" stopOpacity=".25" />
        </linearGradient>
        <pattern
          id={gradient("avatar-grain")}
          width="13"
          height="17"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="3" r=".5" fill="#f6ead2" opacity=".24" />
          <circle cx="10" cy="12" r=".6" fill="#080b11" opacity=".3" />
        </pattern>
      </defs>
      <rect
        width="240"
        height="270"
        fill={
          c.background === "forest"
            ? "#203a34"
            : c.background === "ember"
              ? "#553528"
              : `url(#${gradient("avatar-night")})`
        }
      />
      <g opacity=".25" stroke="#d8c79e" fill="none">
        {Array.from({ length: 9 }, (_, i) => (
          <path
            key={i}
            d={`M${i * 37 - 30} 270 Q${i * 37 + 25} 130 ${i * 37 - 15} 0`}
            strokeWidth={i % 2 ? 8 : 3}
          />
        ))}
      </g>
      {/* Base, vêtements, cou, oreilles et visage : chaque élément reste un calque indépendant. */}
      {c.outfit === "cloak" && (
        <path
          d="M43 270 Q42 179 92 175 L148 175 Q200 180 197 270Z"
          fill="#425e53"
        />
      )}
      <path
        d="M55 270 Q61 204 98 193 L142 193 Q180 204 185 270Z"
        fill={
          c.outfit === "armor"
            ? "#687c8b"
            : c.outfit === "robe"
              ? "#645478"
              : "#8a7865"
        }
      />
      {c.outfit === "armor" && (
        <>
          <path
            d="M59 229 L98 197 L120 224 L142 197 L181 229"
            stroke="#b9c3ca"
            strokeWidth="7"
            fill="none"
          />
          <path d="M112 224 L128 224 L128 270 L112 270Z" fill="#9eabb7" />
        </>
      )}
      <path d="M103 174 L137 174 L135 210 L120 223 L105 210Z" fill={c.skin} />
      {pointedEars ? (
        <path
          d="M94 124 L54 89 L76 148 L94 151Z M146 124 L186 89 L164 148 L146 151Z"
          fill={c.skin}
          stroke="#795c4e"
          strokeWidth="1.5"
        />
      ) : shortEars ? (
        <path
          d="M94 126 Q63 105 71 140 Q80 153 94 151Z M146 126 Q177 105 169 140 Q160 153 146 151Z"
          fill={c.skin}
          stroke="#795c4e"
          strokeWidth="1.5"
        />
      ) : (
        <path
          d="M93 121 L67 100 L77 144 L94 151Z M147 121 L173 100 L163 144 L146 151Z"
          fill={c.skin}
          stroke="#795c4e"
          strokeWidth="1.5"
        />
      )}
      {horned && (
        <g
          fill={species === "dragonborn" ? "#80735f" : "#4b3343"}
          stroke="#2c2530"
          strokeWidth="2"
        >
          <path d="M88 105 Q63 65 80 39 Q77 73 109 85Z" />
          <path d="M152 105 Q177 65 160 39 Q163 73 131 85Z" />
        </g>
      )}
      {faceShape === "angular" ? (
        <path
          d="M83 101 Q91 70 120 70 Q149 70 157 101 L160 150 L142 180 L120 197 L98 180 L80 150Z"
          fill={c.skin}
        />
      ) : (
        <ellipse cx="120" cy="132" rx={faceRx} ry={faceRy} fill={c.skin} />
      )}
      {faceShape === "angular" ? (
        <path
          d="M83 101 Q91 70 120 70 Q149 70 157 101 L160 150 L142 180 L120 197 L98 180 L80 150Z"
          fill={`url(#${gradient("avatar-face")})`}
        />
      ) : (
        <ellipse
          cx="120"
          cy="132"
          rx={faceRx}
          ry={faceRy}
          fill={`url(#${gradient("avatar-face")})`}
        />
      )}
      {faceShape === "gaunt" && (
        <g fill="none" stroke="#563a35" strokeOpacity=".3" strokeWidth="2">
          <path d="M84 145 Q97 155 107 151 M133 151 Q143 155 156 145" />
          <path d="M94 161 Q100 174 109 175 M131 175 Q140 174 146 161" />
        </g>
      )}
      {faceShape === "round" && (
        <g fill="#c57f72" opacity=".2">
          <ellipse cx="92" cy="154" rx="13" ry="9" />
          <ellipse cx="148" cy="154" rx="13" ry="9" />
        </g>
      )}
      <path
        d="M84 148 Q88 161 102 166 M156 148 Q151 163 139 166"
        fill="none"
        stroke="#643e34"
        strokeOpacity=".25"
        strokeWidth="2"
      />
      <path
        d="M92 155 Q101 161 108 156 M132 156 Q141 161 149 155"
        fill="none"
        stroke="#c47765"
        strokeOpacity=".3"
        strokeWidth="5"
      />
      <path
        d="M88 129 Q99 121 112 129 M128 129 Q141 121 152 129"
        stroke="#4c352b"
        strokeWidth="3"
        fill="none"
      />
      <ellipse cx="103" cy="132" rx="7" ry="5" fill="#f4ece5" />
      <ellipse cx="137" cy="132" rx="7" ry="5" fill="#f4ece5" />
      <circle cx="103" cy="132" r="4" fill={c.eyes} />
      <circle cx="137" cy="132" r="4" fill={c.eyes} />
      <circle cx="103" cy="132" r="1.5" />
      <circle cx="137" cy="132" r="1.5" />
      <path
        d="M120 138 L116 155 Q120 159 126 155"
        stroke="#946b59"
        strokeWidth="2"
        fill="none"
      />
      {species === "half-orc" && (
        <g fill="#eee2c8" stroke="#6d5146" strokeWidth="1">
          <path d="M98 177 l-4 -17 l11 12Z" />
          <path d="M142 177 l4 -17 l-11 12Z" />
        </g>
      )}
      {species === "dragonborn" && (
        <g>
          {/* Museau reptilien et plaques écailleuses : silhouette différente d'un humain. */}
          <path
            d="M92 143 Q101 135 120 139 Q139 135 148 143 L156 169 Q141 190 120 191 Q99 190 84 169Z"
            fill={c.skin}
            stroke="#425d57"
            strokeWidth="2.5"
          />
          <path
            d="M99 157 Q120 151 141 157 L148 172 Q120 186 92 172Z"
            fill="#354c48"
            opacity=".3"
          />
          <ellipse cx="104" cy="162" rx="4" ry="2.5" fill="#263b3a" />
          <ellipse cx="136" cy="162" rx="4" ry="2.5" fill="#263b3a" />
          <path
            d="M99 176 Q120 184 141 176"
            fill="none"
            stroke="#263b3a"
            strokeWidth="3"
          />
          <path
            d="M83 113 l13 -10 l12 10 l-10 8Z M132 113 l12 -10 l13 10 l-15 8Z M81 133 l11 -7 l8 9 l-9 9Z M140 135 l8 -9 l11 7 l-10 11Z"
            fill="#405c53"
            opacity=".55"
          />
          <path
            d="M85 122 l11 -8 l12 7 M132 121 l12 -7 l11 8 M92 151 l10 8 M148 151 l-10 8"
            stroke="#425d57"
            strokeWidth="2.4"
            fill="none"
          />
        </g>
      )}
      {species === "tiefling" && (
        <path
          d="M120 144 Q112 157 120 164 Q128 157 120 144"
          fill="none"
          stroke="#7b455b"
          strokeWidth="2"
        />
      )}
      {species === "gnome" && (
        <ellipse
          cx="120"
          cy="155"
          rx="10"
          ry="13"
          fill={c.skin}
          stroke="#a47d64"
          strokeWidth="1"
        />
      )}
      <path
        d="M108 173 Q120 180 132 173"
        stroke="#86584b"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M112 176 Q120 179 128 176"
        stroke="#f2c1a6"
        strokeOpacity=".7"
        strokeWidth="1"
        fill="none"
      />
      {c.skinTexture === "freckles" &&
        Array.from({ length: 18 }, (_, i) => (
          <circle
            key={`freckle-${i}`}
            cx={88 + (i % 9) * 8}
            cy={145 + Math.floor(i / 9) * 8}
            r={0.7 + (i % 3) * 0.35}
            fill="#7e4c3c"
            opacity=".55"
          />
        ))}
      {c.skinTexture === "weathered" && (
        <g fill="none" stroke="#66493d" strokeOpacity=".32" strokeWidth="1.4">
          <path d="M89 151 l-7 6 M93 159 l-8 5 M151 151 l7 6 M147 159 l8 5 M106 116 l-6 -3 M134 116 l6 -3" />
          <path d="M106 181 Q120 186 134 181" />
        </g>
      )}
      {c.hair === "long" && (
        <path
          d="M78 125 Q61 51 119 52 Q182 46 163 125 L174 211 L149 202 L153 105 Q126 95 87 108 L90 202 L65 211Z"
          fill={c.hairColor}
        />
      )}
      {c.hair === "short" && (
        <path
          d="M76 122 Q65 55 119 55 Q177 52 165 122 L151 102 Q136 93 127 84 Q109 106 78 107Z"
          fill={c.hairColor}
        />
      )}
      {c.hair === "braid" && (
        <>
          <path
            d="M76 122 Q65 55 119 55 Q177 52 165 122 L151 102 Q136 93 127 84 Q109 106 78 107Z"
            fill={c.hairColor}
          />
          <path
            d="M155 111 Q180 139 158 160 Q181 181 157 201 Q174 221 157 240"
            stroke={c.hairColor}
            strokeWidth="13"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
      {c.hair === "ponytail" && (
        <>
          <path
            d="M76 122 Q65 55 119 55 Q177 52 165 122 L151 102 Q136 93 127 84 Q109 106 78 107Z"
            fill={c.hairColor}
          />
          <path
            d="M159 86 Q197 116 173 189"
            stroke={c.hairColor}
            strokeWidth="16"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {c.beard !== "none" && (
        <>
          <path
            d={
              c.beard === "short"
                ? "M86 163 Q120 210 154 163 L145 189 Q120 213 95 189Z"
                : "M86 163 Q120 209 154 163 L147 202 L120 250 L93 202Z"
            }
            fill={c.hairColor}
          />
          <path
            d="M106 172 Q120 165 134 172"
            stroke={c.skin}
            strokeWidth="5"
            fill="none"
          />
        </>
      )}
      {c.accessory === "earring" && (
        <>
          <circle
            cx="168"
            cy="148"
            r="7"
            fill="none"
            stroke="#e6c36b"
            strokeWidth="3"
          />
          <circle
            cx="72"
            cy="148"
            r="7"
            fill="none"
            stroke="#e6c36b"
            strokeWidth="3"
          />
        </>
      )}
      {c.accessory === "amulet" && (
        <>
          <path
            d="M95 192 Q120 246 145 192"
            stroke="#c7ad70"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M120 225 l9 10 -9 11 -9 -11Z"
            fill="#58b2a5"
            stroke="#e4d49a"
            strokeWidth="2"
          />
        </>
      )}
      {c.accessory === "circlet" && (
        <path
          d="M82 92 Q120 78 158 92"
          stroke="#e4c36d"
          strokeWidth="5"
          fill="none"
        />
      )}
      <rect
        width="240"
        height="270"
        fill={`url(#${gradient("avatar-grain")})`}
        opacity=".4"
        pointerEvents="none"
      />
      <rect
        width="240"
        height="270"
        fill={`url(#${gradient("avatar-light")})`}
        pointerEvents="none"
      />
      <rect
        x="5"
        y="5"
        width="230"
        height="260"
        rx="9"
        fill="none"
        stroke="#cba56c"
        strokeOpacity=".65"
        strokeWidth="1.5"
      />
      <path
        d="M9 38 V9 H39 M201 9 H231 V39 M9 231 V261 H39 M201 261 H231 V231"
        stroke="#e3c48a"
        strokeOpacity=".8"
        strokeWidth="2"
        fill="none"
      />
      {c.scar && (
        <path
          d="M145 117 L132 158"
          stroke="#8c5148"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
// The two painted portraits are complete, fixed illustrations, not transparent
// interchangeably composable layers. Users explicitly choose this preview mode.
function PaintedPortrait({
  config,
  size,
}: {
  config: AvatarConfig;
  size: number;
}) {
  const preset =
    config.portraitPreset === "aventuriere" ? "aventuriere" : "guerrier";
  const [failedPreset, setFailedPreset] = useState<string | null>(null);
  const metalId = useId().replace(/:/g, "") + "-metal";
  if (failedPreset === preset)
    return (
      <div>
        <VectorAvatarPortrait config={config} size={size} />
        <small role="alert">
          Illustration indisponible : aperçu personnalisable de secours.
        </small>
      </div>
    );
  // Portraits are 600 × 900. Decorative additions use a matching 2:3 viewBox,
  // not a stretched image or a separate CSS-sized overlay.
  return (
    <div
      role="img"
      aria-label={`Portrait fantasy illustré : ${preset}`}
      style={{
        width: size,
        maxWidth: "100%",
        aspectRatio: "2 / 3",
        position: "relative",
        overflow: "hidden",
        borderRadius: 12,
        border: "2px solid #b48b55",
        background: "#222",
      }}
    >
      <img
        src={`/avatars/portraits/${preset}.webp`}
        alt=""
        onError={() => setFailedPreset(preset)}
        draggable={false}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center",
        }}
      />
      {(config.accessory === "circlet" ||
        config.accessory === "amulet" ||
        config.scar) && (
        <svg
          aria-hidden="true"
          viewBox="0 0 600 900"
          preserveAspectRatio="xMidYMid meet"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          <defs>
            <linearGradient id={metalId} x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#fff0b4" />
              <stop offset=".45" stopColor="#ad7e31" />
              <stop offset="1" stopColor="#f5d487" />
            </linearGradient>
          </defs>
          {config.accessory === "circlet" && (
            <>
              <path
                d="M207 245 Q300 204 393 245"
                stroke="#33251d"
                strokeWidth="12"
                fill="none"
              />
              <path
                d="M207 245 Q300 204 393 245"
                stroke={`url(#${metalId})`}
                strokeWidth="7"
                fill="none"
              />
              <path
                d="M300 215 l15 21 -15 22 -15 -22Z"
                fill="#62a9aa"
                stroke="#e9d28c"
                strokeWidth="4"
              />
            </>
          )}
          {config.accessory === "amulet" && (
            <>
              <path
                d="M240 560 Q300 665 360 560"
                fill="none"
                stroke="#372d29"
                strokeWidth="9"
              />
              <path
                d="M240 560 Q300 665 360 560"
                fill="none"
                stroke={`url(#${metalId})`}
                strokeWidth="5"
              />
              <path
                d="M300 635 l20 27 -20 28 -20 -28Z"
                fill="#477e81"
                stroke="#f3d68c"
                strokeWidth="6"
              />
            </>
          )}
          {config.scar && (
            <>
              <path
                d="M365 337 Q350 377 330 410"
                stroke="#3b2427"
                strokeOpacity=".65"
                strokeWidth="13"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M363 338 Q348 377 329 410"
                stroke="#e4a7a0"
                strokeOpacity=".8"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
              />
            </>
          )}
        </svg>
      )}
    </div>
  );
}
// PNG layers share a 480 × 540 transparent canvas. The painter is opt-in while
// its first palette is limited; unsupported combinations retain the SVG renderer.
const ROOT = "/avatars/layers/";
const asset = (category: string, name: string) =>
  `${ROOT}${category}/${name}.png`;
export function AvatarPortrait({
  config,
  size = 240,
}: {
  config: AvatarConfig;
  size?: number;
}) {
  const [failedKey, setFailedKey] = useState("");
  if (
    config.portraitMode === "painted" &&
    (config.species || "human") === "human"
  )
    return <PaintedPortrait config={config} size={size} />;
  const compatible =
    (config.species || "human") === "human" &&
    ["short", "long", "braid", "ponytail", "bald"].includes(config.hair) &&
    ["none", "short", "long"].includes(config.beard) &&
    ["armor", "robe", "cloak", "civil"].includes(config.outfit) &&
    ["none", "amulet", "earring", "circlet"].includes(
      config.accessory || "none",
    ) &&
    ["#e7bf9b", "#c99470", "#ce9974", "#986548", "#633f30", "#a8a2bd"].includes(
      config.skin.toLowerCase(),
    ) &&
    ["#468a6e", "#4d8fc0", "#654332", "#c49a44", "#a16ac0"].includes(
      config.eyes.toLowerCase(),
    ) &&
    ["#493025", "#1d2025", "#c29b52", "#a54f37", "#b9bec8", "#7850a0"].includes(
      config.hairColor.toLowerCase(),
    ) &&
    failedKey !== JSON.stringify(config);
  if (!compatible) return <VectorAvatarPortrait config={config} size={size} />;
  const palette: Record<string, string> = {
    "#493025": "brun",
    "#1d2025": "noir",
    "#c29b52": "blond",
    "#a54f37": "roux",
    "#b9bec8": "argente",
    "#7850a0": "violet",
  };
  const tint = palette[config.hairColor.toLowerCase()] || "brun";
  const hairFile = (name: string) => name + (tint === "brun" ? "" : "_" + tint);
  const layers = [
    asset(
      "04_tenue",
      (
        {
          robe: "robe",
          armor: "cuir",
          cloak: "cape",
          civil: "civil",
        } as Record<string, string>
      )[config.outfit],
    ),
    asset(
      "01_base",
      "visage_" +
        (
          {
            "#e7bf9b": "clair",
            "#c99470": "hale",
            "#ce9974": "hale",
            "#986548": "brun",
            "#633f30": "fonce",
            "#a8a2bd": "lilas",
          } as Record<string, string>
        )[config.skin.toLowerCase()],
    ),
    ...(config.faceShape && config.faceShape !== "standard"
      ? [
          asset(
            "08_morphologie",
            ["angular", "round", "gaunt"].includes(config.faceShape)
              ? config.faceShape
              : "angular",
          ),
        ]
      : []),
    asset(
      "07_texture",
      (["natural", "freckles", "weathered"].includes(
        config.skinTexture || "natural",
      )
        ? config.skinTexture
        : "natural") as string,
    ),
    asset(
      "06_yeux",
      (
        {
          "#468a6e": "verts",
          "#4d8fc0": "bleus",
          "#654332": "marron",
          "#c49a44": "dores",
          "#a16ac0": "violets",
        } as Record<string, string>
      )[config.eyes.toLowerCase()] || "verts",
    ),
    asset(
      "02_cheveux",
      config.hair === "bald"
        ? "chauve"
        : hairFile(
            (
              {
                long: "longs",
                braid: "tresse",
                ponytail: "queue",
                short: "courts",
              } as Record<string, string>
            )[config.hair],
          ),
    ),
    ...(config.beard === "none"
      ? []
      : [
          asset(
            "03_pilosite",
            hairFile(config.beard === "long" ? "barbe_longue" : "barbe_courte"),
          ),
        ]),
    ...(config.scar ? [asset("05_details", "cicatrice")] : []),
    ...(config.accessory === "amulet"
      ? [asset("05_details", "amulette")]
      : config.accessory === "earring"
        ? [asset("05_details", "boucles")]
        : config.accessory === "circlet"
          ? [asset("05_details", "diademe")]
          : []),
  ];
  return (
    <div
      role="img"
      aria-label="Portrait composé de calques graphiques"
      style={{
        width: size,
        maxWidth: "100%",
        aspectRatio: "8 / 9",
        position: "relative",
        overflow: "hidden",
        borderRadius: 12,
        background:
          config.background === "ember"
            ? "radial-gradient(circle at 50% 20%,#77523c,#241a20)"
            : config.background === "night"
              ? "radial-gradient(circle at 50% 20%,#48556a,#161e2b)"
              : "radial-gradient(circle at 50% 20%,#5e7667,#172d2b)",
        boxShadow: "inset 0 0 0 2px #b48b55",
      }}
    >
      {layers.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden="true"
          onError={() => setFailedKey(JSON.stringify(config))}
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
          }}
        />
      ))}
    </div>
  );
}
export default function AvatarBuilder({
  value,
  onChange,
}: {
  value: string;
  onChange: (s: string) => void;
}) {
  const portraitRef = useRef<HTMLDivElement>(null);
  const [exportError, setExportError] = useState("");
  const config = useMemo(() => readAvatar(value), [value]);
  // Local, bounded history: no database migration and no changes to the character sheet.
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const lastIssued = useRef<string | null>(null);
  const [, setHistoryVersion] = useState(0);
  const refreshHistory = () => setHistoryVersion((n) => n + 1);
  useEffect(() => {
    // If a different character or an external save replaces this value, never undo into it.
    if (lastIssued.current === value) {
      lastIssued.current = null;
      return;
    }
    undoStack.current = [];
    redoStack.current = [];
    refreshHistory();
  }, [value]);
  const commit = (next: string) => {
    if (next === value) return;
    undoStack.current = [...undoStack.current.slice(-29), value];
    redoStack.current = [];
    lastIssued.current = next;
    refreshHistory();
    onChange(next);
  };
  const undo = () => {
    const previous = undoStack.current.pop();
    if (previous === undefined) return;
    redoStack.current = [...redoStack.current.slice(-29), value];
    lastIssued.current = previous;
    refreshHistory();
    onChange(previous);
  };
  const redo = () => {
    const next = redoStack.current.pop();
    if (next === undefined) return;
    undoStack.current = [...undoStack.current.slice(-29), value];
    lastIssued.current = next;
    refreshHistory();
    onChange(next);
  };
  const update = (patch: Partial<AvatarConfig>) =>
    commit(writeAvatar({ ...config, ...patch }));
  const human = (config.species || "human") === "human";
  // A random portrait only uses options supported by the selected species and renderer.
  const randomizePortrait = () => {
    const pick = <T,>(items: readonly T[]): T =>
      items[Math.floor(Math.random() * items.length)];
    const next: Partial<AvatarConfig> = {
      background: pick(["forest", "ember", "night"]),
      accessory: pick(["none", "none", "earring", "amulet", "circlet"]),
      skin: pick(["#e7bf9b", "#c99470", "#986548", "#633f30", "#a8a2bd"]),
      faceShape: pick(["standard", "angular", "round", "gaunt"]),
      skinTexture: pick(["natural", "freckles", "weathered"]),
      hair: pick(["short", "long", "braid", "ponytail", "bald"]),
      hairColor: pick([
        "#493025",
        "#1d2025",
        "#c29b52",
        "#a54f37",
        "#b9bec8",
        "#7850a0",
      ]),
      eyes: pick(["#468a6e", "#4d8fc0", "#654332", "#c49a44", "#a16ac0"]),
      beard: pick(["none", "none", "short", "long"]),
      outfit: pick(["cloak", "armor", "robe", "civil"]),
      scar: Math.random() < 0.3,
      portraitMode: "layers",
    };
    // Keep species and free-text details; do not alter the character's D&D race.
    if ((config.species || "human") === "dragonborn") next.hair = "bald";
    commit(writeAvatar({ ...config, ...next }));
  };
  const resetPortrait = () => {
    const species = config.species || "human";
    const speciesDefaults: Record<string, Partial<AvatarConfig>> = {
      elf: { hair: "long", beard: "none", skin: "#e7bf9b", eyes: "#4d8fc0" },
      dwarf: { hair: "braid", beard: "long" },
      halfling: { hair: "short", beard: "none" },
      "half-elf": { hair: "long", beard: "none" },
      "half-orc": { hair: "short", skin: "#986548" },
      gnome: { hair: "ponytail", beard: "none" },
      tiefling: { hair: "long", skin: "#a8a2bd", eyes: "#c49a44" },
      dragonborn: {
        hair: "bald",
        beard: "none",
        skin: "#986548",
        eyes: "#c49a44",
      },
    };
    commit(
      writeAvatar({
        ...defaultAvatar,
        ...speciesDefaults[species],
        details: config.details,
        species,
        portraitMode: "layers",
      }),
    );
  };
  // Keep the chosen illustration as a reference when switching to editable layers.
  // This is a new editable interpretation, not an edit of the original painting.
  const changePortraitMode = (portraitMode: string) =>
    update({ portraitMode: human ? portraitMode : "layers" });
  const editPaintedAsLayers = () => {
    const female = config.portraitPreset === "aventuriere";
    update({
      portraitMode: "layers",
      hair: female ? "long" : "short",
      beard: "none",
      outfit: female ? "cloak" : "armor",
      hairColor: female ? "#493025" : "#1d2025",
      accessory: "none",
      scar: false,
    });
  };
  const changeSpecies = (species: string) => {
    // A painted preset always depicts a human; switch to the species-aware SVG.
    const defaults: Record<string, Partial<AvatarConfig>> = {
      elf: { hair: "long", beard: "none", skin: "#e7bf9b", eyes: "#4d8fc0" },
      dwarf: { hair: "braid", beard: "long", skin: "#c99470" },
      halfling: { hair: "short", beard: "none", skin: "#c99470" },
      "half-elf": { hair: "long", beard: "none" },
      "half-orc": { hair: "short", skin: "#986548", eyes: "#654332" },
      gnome: { hair: "ponytail", beard: "none" },
      tiefling: { hair: "long", skin: "#a8a2bd", eyes: "#c49a44" },
      dragonborn: {
        hair: "bald",
        beard: "none",
        skin: "#986548",
        eyes: "#c49a44",
      },
    };
    update({
      species,
      ...(defaults[species] || {}),
      ...(species === "human" ? {} : { portraitMode: "layers" }),
    });
  };
  const exportPortrait = async () => {
    setExportError("");
    try {
      const container = portraitRef.current;
      if (!container) throw new Error("Portrait introuvable");
      const painted =
        config.portraitMode === "painted" &&
        (config.species || "human") === "human";
      const width = 480,
        height = painted ? 720 : 540;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas indisponible");
      const svg = container.querySelector("svg");
      if (svg && !painted) {
        const copy = svg.cloneNode(true) as SVGSVGElement;
        copy.setAttribute("width", String(width));
        copy.setAttribute("height", String(height));
        const blob = new Blob([new XMLSerializer().serializeToString(copy)], {
          type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        try {
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("SVG non exportable"));
            img.src = url;
          });
          ctx.drawImage(img, 0, 0, width, height);
        } finally {
          URL.revokeObjectURL(url);
        }
      } else {
        const portrait = container.querySelector(
          '[role="img"]',
        ) as HTMLElement | null;
        if (!portrait) throw new Error("Aperçu introuvable");
        // Recreate the preview's radial gradient in the exported PNG.
        const gradient = ctx.createRadialGradient(
          width * 0.5,
          height * 0.2,
          0,
          width * 0.5,
          height * 0.2,
          width * 0.78,
        );
        const colors =
          config.background === "ember"
            ? ["#77523c", "#241a20"]
            : config.background === "night"
              ? ["#48556a", "#161e2b"]
              : ["#5e7667", "#172d2b"];
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        const imgs = Array.from(portrait.querySelectorAll("img"));
        for (const element of imgs) {
          const image = element as HTMLImageElement;
          if (!image.complete)
            await new Promise<void>((resolve, reject) => {
              const onLoad = () => {
                cleanup();
                resolve();
              };
              const onError = () => {
                cleanup();
                reject(new Error("Image non chargée"));
              };
              const cleanup = () => {
                image.removeEventListener("load", onLoad);
                image.removeEventListener("error", onError);
              };
              image.addEventListener("load", onLoad);
              image.addEventListener("error", onError);
              // An image can finish loading between the initial check and listener registration.
              if (image.complete) {
                cleanup();
                image.naturalWidth
                  ? resolve()
                  : reject(new Error("Image absente"));
              }
            });
          if (!image.naturalWidth) throw new Error("Image absente");
          if (painted) {
            // Preserve the painted preview's 2:3 framing in the exported file.
            const scale = Math.min(
              width / image.naturalWidth,
              height / image.naturalHeight,
            );
            const w = image.naturalWidth * scale,
              h = image.naturalHeight * scale;
            ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
          } else ctx.drawImage(image, 0, 0, width, height);
        }
        // In illustrated mode the PNG must contain the same decorative SVG
        // overlay as the on-screen preview, not just the underlying WebP.
        if (painted && svg) {
          const copy = svg.cloneNode(true) as SVGSVGElement;
          copy.setAttribute("width", String(width));
          copy.setAttribute("height", String(height));
          const blob = new Blob([new XMLSerializer().serializeToString(copy)], {
            type: "image/svg+xml;charset=utf-8",
          });
          const overlayUrl = URL.createObjectURL(blob);
          try {
            const overlay = new Image();
            await new Promise<void>((resolve, reject) => {
              overlay.onload = () => resolve();
              overlay.onerror = () => reject(new Error("Décor non exportable"));
              overlay.src = overlayUrl;
            });
            ctx.drawImage(overlay, 0, 0, width, height);
          } finally {
            URL.revokeObjectURL(overlayUrl);
          }
        }
      }
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = "chroniques-et-des-portrait.png";
      link.click();
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export impossible");
    }
  };
  const painted =
    config.portraitMode === "painted" &&
    (config.species || "human") === "human";
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
        gap: 22,
        alignItems: "start",
      }}
    >
      <div style={{ display: "grid", justifyItems: "center", gap: 8 }}>
        <div ref={portraitRef}>
          <AvatarPortrait config={config} />
        </div>
        <button
          type="button"
          className="btn secondary"
          onClick={exportPortrait}
        >
          Exporter le portrait en PNG
        </button>
        {exportError && (
          <small role="alert" style={{ color: "#dba58e" }}>
            {exportError}
          </small>
        )}
        <small style={{ opacity: 0.7, textAlign: "center" }}>
          Les illustrations fixes et les portraits personnalisables sont deux
          rendus distincts. Mode calques : quatre morphologies, cinq coiffures,
          quatre tenues, six couleurs de cheveux, textures du visage et diadème
          pour les humains compatibles ; autres en SVG. Mode illustration : base
          fantasy fixe, avec diadème, amulette et cicatrice superposables. Les
          huit autres espèces utilisent un rendu SVG provisoire, avec
          morphologies et textures de visage personnalisables. Les illustrations
          fixes représentent uniquement des humains.
        </small>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn secondary"
            onClick={randomizePortrait}
          >
            🎲 Apparence aléatoire
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={resetPortrait}
          >
            Réinitialiser l’apparence
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={undo}
            disabled={!undoStack.current.length}
            aria-label="Annuler la dernière modification de l’apparence"
          >
            ↶ Annuler
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={redo}
            disabled={!redoStack.current.length}
            aria-label="Rétablir la modification annulée"
          >
            ↷ Rétablir
          </button>
        </div>
        <Choice
          label="Type de portrait"
          value={human ? config.portraitMode || "layers" : "layers"}
          onChange={changePortraitMode}
          options={
            human
              ? [
                  ["layers", "Personnalisable — calques"],
                  ["painted", "Illustration fantasy — portrait fixe"],
                ]
              : [["layers", "Personnalisable — rendu SVG provisoire"]]
          }
        />
        {!human && (
          <small style={{ opacity: 0.8 }}>
            Les portraits illustrés fixes représentent des humains : cette
            espèce utilise son portrait SVG spécifique, exportable en PNG.
          </small>
        )}
        {config.portraitMode === "painted" &&
          (config.species || "human") === "human" && (
            <>
              <Choice
                label="Portrait illustré"
                value={config.portraitPreset || "guerrier"}
                onChange={(portraitPreset) => update({ portraitPreset })}
                options={[
                  ["guerrier", "Guerrier humain"],
                  ["aventuriere", "Aventurière humaine"],
                ]}
              />
              <button
                type="button"
                className="btn secondary"
                onClick={editPaintedAsLayers}
              >
                Créer une version personnalisable de ce portrait
              </button>
              <small role="status" style={{ opacity: 0.9 }}>
                Ce bouton crée une nouvelle interprétation en calques :
                l’illustration originale ne peut pas être modifiée directement.
              </small>
              <small role="status" style={{ opacity: 0.9 }}>
                Illustration fantasy fixe : tu peux y superposer un diadème, une
                amulette ou une cicatrice. Les cheveux, les yeux, le visage et
                les vêtements restent ceux de l’illustration. Pour les modifier,
                choisis le mode personnalisable.
              </small>
            </>
          )}
        <small style={{ opacity: 0.8 }}>
          L’espèce choisie ici modifie uniquement le portrait : elle ne change
          pas les caractéristiques D&amp;D de la fiche. Changer d’espèce
          applique une apparence de départ, ensuite entièrement modifiable.
        </small>
        <Choice
          label="Espèce (portrait)"
          value={config.species || "human"}
          onChange={changeSpecies}
          options={[
            ["human", "Humain"],
            ["elf", "Elfe"],
            ["dwarf", "Nain"],
            ["halfling", "Halfelin"],
            ["half-elf", "Demi-elfe"],
            ["half-orc", "Demi-orc"],
            ["gnome", "Gnome"],
            ["tiefling", "Tieffelin"],
            ["dragonborn", "Drakéide"],
          ]}
        />
        {painted && (
          <div
            style={{
              display: "grid",
              gap: 10,
              padding: 12,
              border: "1px solid #8b6a49",
              borderRadius: 10,
            }}
          >
            <strong>Ajouts sur l’illustration</strong>
            <Choice
              label="Bijou"
              value={
                ["circlet", "amulet"].includes(config.accessory || "")
                  ? config.accessory!
                  : "none"
              }
              onChange={(accessory) => update({ accessory })}
              options={[
                ["none", "Aucun"],
                ["circlet", "Diadème"],
                ["amulet", "Amulette"],
              ]}
            />
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={config.scar}
                onChange={(e) => update({ scar: e.target.checked })}
              />{" "}
              Cicatrice
            </label>
            <small style={{ opacity: 0.8 }}>
              Ces ajouts sont des superpositions décoratives : leur placement
              est approximatif et ne modifie pas le portrait d’origine.
            </small>
          </div>
        )}
        <fieldset
          disabled={painted}
          style={{
            border: 0,
            padding: 0,
            margin: 0,
            minWidth: 0,
            display: "grid",
            gap: 12,
            opacity: painted ? 0.45 : 1,
          }}
        >
          <Choice
            label="Fond"
            value={config.background || "forest"}
            onChange={(background) => update({ background })}
            options={[
              ["forest", "Forêt"],
              ["ember", "Braises"],
              ["night", "Nuit"],
            ]}
          />
          <Choice
            label="Accessoire"
            value={config.accessory || "none"}
            onChange={(accessory) => update({ accessory })}
            options={[
              ["none", "Aucun"],
              ["earring", "Boucles d'oreilles"],
              ["amulet", "Amulette"],
              ["circlet", "Diadème"],
            ]}
          />
          <Choice
            label="Teint"
            value={config.skin}
            onChange={(skin) => update({ skin })}
            options={[
              ["#e7bf9b", "Clair"],
              ["#c99470", "Hâlé"],
              ["#986548", "Brun"],
              ["#633f30", "Foncé"],
              ["#a8a2bd", "Fantastique — lilas"],
            ]}
          />
          <Choice
            label="Morphologie du visage"
            value={config.faceShape || "standard"}
            onChange={(faceShape) => update({ faceShape })}
            options={[
              ["standard", "Standard"],
              ["angular", "Mâchoire anguleuse"],
              ["round", "Visage rond"],
              ["gaunt", "Joues creusées"],
            ]}
          />
          <Choice
            label="Texture du visage"
            value={config.skinTexture || "natural"}
            onChange={(skinTexture) => update({ skinTexture })}
            options={[
              ["natural", "Naturelle"],
              ["freckles", "Taches de rousseur"],
              ["weathered", "Marquée par les aventures"],
            ]}
          />
          <Choice
            label="Coiffure"
            value={config.hair}
            onChange={(hair) => update({ hair })}
            options={[
              ["short", "Courte"],
              ["long", "Longue"],
              ["braid", "Tressée"],
              ["ponytail", "Queue de cheval"],
              ["bald", "Chauve"],
            ]}
          />
          <Choice
            label="Couleur des cheveux"
            value={config.hairColor}
            onChange={(hairColor) => update({ hairColor })}
            options={[
              ["#493025", "Brun"],
              ["#1d2025", "Noir"],
              ["#c29b52", "Blond"],
              ["#a54f37", "Roux"],
              ["#b9bec8", "Argenté"],
              ["#7850a0", "Violet"],
            ]}
          />
          <Choice
            label="Yeux"
            value={config.eyes}
            onChange={(eyes) => update({ eyes })}
            options={[
              ["#468a6e", "Verts"],
              ["#4d8fc0", "Bleus"],
              ["#654332", "Marron"],
              ["#c49a44", "Dorés"],
              ["#a16ac0", "Violets"],
            ]}
          />
          <Choice
            label="Barbe"
            value={config.beard}
            onChange={(beard) => update({ beard })}
            options={[
              ["none", "Aucune"],
              ["short", "Courte"],
              ["long", "Longue"],
            ]}
          />
          <Choice
            label="Tenue"
            value={config.outfit}
            onChange={(outfit) => update({ outfit })}
            options={[
              ["cloak", "Cape"],
              ["armor", "Armure"],
              ["robe", "Robe"],
              ["civil", "Tenue civile"],
            ]}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={config.scar}
              onChange={(e) => update({ scar: e.target.checked })}
            />{" "}
            Cicatrice
          </label>
        </fieldset>
      </div>
      <label style={{ gridColumn: "1 / -1", display: "grid", gap: 5 }}>
        <span className="field-label">
          Détails physiques supplémentaires (facultatif)
        </span>
        <textarea
          className="field textarea"
          maxLength={2000}
          value={config.details}
          onChange={(e) => update({ details: e.target.value })}
          placeholder="Voix, posture, démarche, particularités non représentées…"
        />
      </label>
    </div>
  );
}
