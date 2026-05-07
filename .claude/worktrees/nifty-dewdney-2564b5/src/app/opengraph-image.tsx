import { ImageResponse } from 'next/og'
import {
  SITE_NAME,
  SITE_SHARE_HEADLINE,
  SITE_SHARE_SUPPORT,
} from '@/constants/site'

export const alt = 'SimulaMEI'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#080808',
          color: '#f0f0f0',
          padding: '56px 60px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 78,
              height: 78,
              borderRadius: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#c8f135',
              color: '#000000',
              fontSize: 36,
              fontWeight: 900,
            }}
          >
            S
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 34, fontWeight: 800 }}>{SITE_NAME}</div>
            <div style={{ fontSize: 18, color: '#999999' }}>Motor fiscal para MEI e contadores</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 980 }}>
          <div style={{ fontSize: 72, lineHeight: 1.02, fontWeight: 900 }}>
            {SITE_SHARE_HEADLINE}
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.4, color: '#c9c9c9' }}>
            {SITE_SHARE_SUPPORT}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {['Teto MEI', 'Fator R', 'CNAE oficial', 'Comparativo de regimes'].map(item => (
            <div
              key={item}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: 999,
                border: '1px solid #2a2a2a',
                color: '#c8f135',
                fontSize: 20,
                fontWeight: 700,
                background: '#101010',
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
