import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Cache fonts at module level
let playfairFont: ArrayBuffer | null = null
let monoFont: ArrayBuffer | null = null

async function loadFonts() {
  if (!playfairFont) {
    const playfairRes = await fetch(
      'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtY.ttf'
    )
    playfairFont = await playfairRes.arrayBuffer()
  }
  if (!monoFont) {
    const monoRes = await fetch(
      'https://fonts.gstatic.com/s/ibmplexmono/v19/-F6qfjptAgt5VM-kVkqdyU8n3oQIwlBFhA.ttf'
    )
    monoFont = await monoRes.arrayBuffer()
  }
  return { playfairFont, monoFont }
}

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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = searchParams.get('title') || 'FieldNotes AI'
  const dek = searchParams.get('dek') || ''
  const entryNumber = searchParams.get('entryNumber')
  const entryType = searchParams.get('entryType')
  const date = searchParams.get('date')

  const { playfairFont: pf, monoFont: mf } = await loadFonts()

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fieldnotes-ai.com'
  const hasMetaRow = entryNumber || entryType || date

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#F6F1E9',
          padding: '0',
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
          {/* Top row: wordmark + photo */}
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
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#1C1917',
                }}
              >
                FieldNotes
              </span>
              <span
                style={{
                  fontFamily: 'Playfair Display',
                  fontSize: '28px',
                  fontWeight: 700,
                  fontStyle: 'italic',
                  color: '#BE2A2A',
                  marginLeft: '2px',
                }}
              >
                AI
              </span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${baseUrl}/nika.jpg`}
              alt=""
              width={48}
              height={48}
              style={{
                borderRadius: '50%',
                border: '2px solid #E2DDD6',
              }}
            />
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
                fontSize: title.length > 60 ? '40px' : '48px',
                fontWeight: 700,
                color: '#1C1917',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {title}
            </div>

            {/* Dek */}
            {dek && (
              <div
                style={{
                  fontFamily: 'Playfair Display',
                  fontSize: '20px',
                  fontStyle: 'italic',
                  color: '#78716C',
                  lineHeight: 1.5,
                  marginTop: '16px',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {dek}
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
                marginTop: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'IBM Plex Mono',
                  fontSize: '14px',
                  color: '#78716C',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {entryNumber && (
                  <span>{formatEntryNumber(Number(entryNumber))}</span>
                )}
                {entryNumber && entryType && <span>·</span>}
                {entryType && <span>{entryType}</span>}
              </div>
              {date && (
                <div
                  style={{
                    fontFamily: 'IBM Plex Mono',
                    fontSize: '14px',
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
            height: '6px',
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
          data: pf,
          weight: 700,
          style: 'normal',
        },
        {
          name: 'IBM Plex Mono',
          data: mf,
          weight: 500,
          style: 'normal',
        },
      ],
    },
  )
}
