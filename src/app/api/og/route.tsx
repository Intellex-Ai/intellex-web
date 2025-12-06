import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Intellex - AI-Powered Intelligence';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get('title') || 'Intellex').slice(0, 120);
  const description = (searchParams.get('description') || 'AI-powered intelligence for research, analysis, and decisioning.')
    .slice(0, 200);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px',
          background: 'radial-gradient(circle at 20% 20%, rgba(255,77,0,0.25), transparent 35%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.2), transparent 40%), linear-gradient(135deg, #0b0c10 0%, #0f1117 50%, #131622 100%)',
          color: '#f7f8fb',
          fontFamily: 'Inter, "JetBrains Mono", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '16px',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '28px',
            backdropFilter: 'blur(8px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '0',
            background: 'radial-gradient(circle at 60% 80%, rgba(255,77,0,0.08), transparent 35%)',
            borderRadius: '32px',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '18px',
              letterSpacing: '0.5px',
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '999px',
                background: '#ff4d00',
                boxShadow: '0 0 18px rgba(255,77,0,0.8)',
              }}
            />
            Intellex
          </div>
          <span style={{ fontSize: '18px', color: 'rgba(247,248,251,0.8)', letterSpacing: '0.5px' }}>intellex.xerocore.in</span>
        </div>

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div
            style={{
              display: 'flex',
              padding: '8px 14px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              width: 'auto',
              fontSize: '18px',
              letterSpacing: '0.4px',
            }}
          >
            AI-Powered Intelligence
          </div>
          <div style={{ fontSize: '68px', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.8px' }}>{title}</div>
          <div style={{ fontSize: '28px', color: 'rgba(247,248,251,0.8)', maxWidth: '840px', lineHeight: 1.35 }}>{description}</div>
        </div>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '20px',
            color: 'rgba(247,248,251,0.85)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ff6a00, #ff4d00)',
                boxShadow: '0 8px 30px rgba(255,77,0,0.35)',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
              <span style={{ fontWeight: 700 }}>Intellex Labs</span>
              <span style={{ color: 'rgba(247,248,251,0.72)', fontSize: '18px' }}>Research · Analysis · Delivery</span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '18px',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '999px',
                background: '#38f7aa',
                boxShadow: '0 0 14px rgba(56,247,170,0.8)',
              }}
            />
            Live
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
