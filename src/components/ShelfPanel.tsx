export function ShelfPanel() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        fontFamily: 'system-ui, sans-serif',
        background: '#ffffff',
      }}
    >
      <header
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          fontWeight: 600,
          fontSize: '14px',
        }}
      >
        Vanish Box
      </header>
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
          fontSize: '13px',
        }}
      >
        Drop files here
      </main>
    </div>
  )
}
