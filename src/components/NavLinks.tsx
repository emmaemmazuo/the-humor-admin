'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/jokes', label: 'Jokes' },
  { href: '/admin/votes', label: 'Votes' },
  { href: '/admin/data', label: 'Course data' },
]

export default function NavLinks() {
  const pathname = usePathname()

  return (
    <nav style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {links.map((l) => {
        const active =
          l.href === '/admin' ? pathname === '/admin' : pathname.startsWith(l.href)
        return (
          <Link
            key={l.href}
            href={l.href}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              border: '1px solid #d1d5db',
              background: active ? '#111827' : '#ffffff',
              color: active ? '#ffffff' : '#111827',
              textDecoration: 'none',
            }}
          >
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
