import { ImageResponse } from 'next/og'

export const alt = 'AlphaTradeX - Votre analyste IA sur les marchés'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

// Google Fonts sans User-Agent navigateur renvoie des URLs TTF (seul format
// supporté par next/og). En cas d'échec réseau au build, on retombe sur la
// police embarquée par défaut (Geist Regular) plutôt que de casser le build.
async function loadInter(weight: 400 | 700): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&display=swap`
    ).then((res) => res.text())
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1]
    if (!url) return null
    return await fetch(url).then((res) => res.arrayBuffer())
  } catch {
    return null
  }
}

export default async function Image() {
  const [interRegular, interBold] = await Promise.all([
    loadInter(400),
    loadInter(700),
  ])

  const fonts = []
  if (interRegular) {
    fonts.push({ name: 'Inter', data: interRegular, style: 'normal' as const, weight: 400 as const })
  }
  if (interBold) {
    fonts.push({ name: 'Inter', data: interBold, style: 'normal' as const, weight: 700 as const })
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0A0A0F',
          fontFamily: fonts.length > 0 ? 'Inter' : 'sans-serif',
        }}
      >
        {/* Même glow que le site (app/layout.tsx) : cercle 600×600 plein centre,
            radial-gradient rgba(45,111,255,0.20) → transparent à 70 % */}
        <div
          style={{
            position: 'absolute',
            left: 300,
            top: 15,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(45, 111, 255, 0.20) 0%, rgba(45, 111, 255, 0) 70%)',
          }}
        />
        <svg
          width={120}
          height={120}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2D6FFF"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
        <div
          style={{
            marginLeft: 44,
            fontSize: 104,
            fontWeight: 700,
            color: '#F0F4FF',
            letterSpacing: '-0.02em',
          }}
        >
          AlphaTradeX
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    }
  )
}
