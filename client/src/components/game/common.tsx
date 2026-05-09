export const PLAYER_COLORS = ['#e8a598', '#98c5e8', '#98e8b4', '#e8d598', '#c598e8', '#e898c5']

export const SectionMark = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{
      width: 6, height: 6, borderRadius: '50%',
      background: 'var(--accent)', flexShrink: 0, display: 'inline-block',
    }} />
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 10,
      letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)',
    }}>{children}</span>
  </div>
)
