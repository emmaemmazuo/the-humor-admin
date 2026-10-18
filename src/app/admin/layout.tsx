import { requireAdmin } from '@/lib/require-admin'
import LogoutButton from '@/components/LogoutButton'
import NavLinks from '@/components/NavLinks'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await requireAdmin()

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
        <div
          style={{
            maxWidth: 1024,
            margin: '0 auto',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700 }}>Humor Admin</span>
            <NavLinks />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 14, color: '#6b7280' }}>{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main style={{ maxWidth: 1024, margin: '0 auto', padding: '32px 24px' }}>
        {children}
      </main>
    </div>
  )
}
