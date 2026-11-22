/* Rentobots logo on the admin login / create-account screens. */
export default function Logo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/img/rentobots-logo.webp" alt="Rentobots" width={260} height={47} style={{ display: 'block', width: 260, height: 'auto' }} />
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: '#8B8C8D',
        }}
      >
        Admin
      </span>
    </div>
  )
}
