import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const playfairFontUrl = 'https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-700-normal.ttf'
const monoFontUrl = 'https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@latest/latin-500-normal.ttf'

function formatEntryNumber(num: number): string {
  return `#${String(num).padStart(3, '0')}`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const title = searchParams.get('title') || 'FieldNotes AI'
    const dek = searchParams.get('dek') || ''
    const entryNumber = searchParams.get('entryNumber')
    const entryType = searchParams.get('entryType')
    const date = searchParams.get('date')

    const [playfairData, monoData] = await Promise.all([
      fetch(playfairFontUrl).then((res) => {
        if (!res.ok) throw new Error(`Playfair font fetch failed: ${res.status}`)
        return res.arrayBuffer()
      }),
      fetch(monoFontUrl).then((res) => {
        if (!res.ok) throw new Error(`Mono font fetch failed: ${res.status}`)
        return res.arrayBuffer()
      }),
    ])

    const hasMetaRow = entryNumber || entryType || date
    const displayTitle = truncate(title, 120)
    const displayDek = dek ? truncate(dek, 160) : ''

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#F6F1E9',
          }}
        >
          {/* Content area */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '48px 56px 32px',
            }}
          >
            {/* Top row: wordmark */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '40px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span
                  style={{
                    fontFamily: 'Playfair Display',
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#1C1917',
                  }}
                >
                  FieldNotes
                </span>
                <span
                  style={{
                    fontFamily: 'Playfair Display',
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#BE2A2A',
                    marginLeft: 2,
                  }}
                >
                  AI
                </span>
              </div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: '#BE2A2A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Playfair Display',
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  border: '2px solid #E2DDD6',
                }}
              >
                N
              </div>
            </div>

            {/* Title */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'Playfair Display',
                  fontSize: displayTitle.length > 60 ? 40 : 48,
                  fontWeight: 700,
                  color: '#1C1917',
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  maxHeight: displayTitle.length > 60 ? 96 : 112,
                  overflow: 'hidden',
                }}
              >
                {displayTitle}
              </div>

              {/* Dek */}
              {displayDek && (
                <div
                  style={{
                    fontFamily: 'Playfair Display',
                    fontSize: 20,
                    color: '#78716C',
                    lineHeight: 1.5,
                    marginTop: 16,
                    maxHeight: 64,
                    overflow: 'hidden',
                  }}
                >
                  {displayDek}
                </div>
              )}
            </div>

            {/* Bottom metadata row */}
            {hasMetaRow && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 24,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'IBM Plex Mono',
                    fontSize: 14,
                    color: '#78716C',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {entryNumber && (
                    <span>{formatEntryNumber(Number(entryNumber))}</span>
                  )}
                  {entryNumber && entryType && <span style={{ marginLeft: 4, marginRight: 4 }}>·</span>}
                  {entryType && <span>{entryType}</span>}
                </div>
                {date && (
                  <div
                    style={{
                      fontFamily: 'IBM Plex Mono',
                      fontSize: 14,
                      color: '#78716C',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {formatDate(date)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom accent line */}
          <div
            style={{
              width: '100%',
              height: 6,
              backgroundColor: '#BE2A2A',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Playfair Display',
            data: playfairData,
            weight: 700,
            style: 'normal',
          },
          {
            name: 'IBM Plex Mono',
            data: monoData,
            weight: 500,
            style: 'normal',
          },
        ],
      },
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('OG image generation failed:', message)
    return new Response(`OG image generation failed: ${message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}
