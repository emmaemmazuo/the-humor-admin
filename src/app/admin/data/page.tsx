import Link from 'next/link'
import { requireAdmin } from '@/lib/require-admin'
import { resources } from '@/lib/resources'

export default async function DataIndex() {
  await requireAdmin()
  const groups = Array.from(new Set(resources.map((r) => r.group)))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Course data</h1>
        <p className="text-sm text-gray-500 mt-1">
          Prompt chains, media, LLM settings, and access lists from the course database.
        </p>
      </div>
      {groups.map((group) => (
        <section key={group}>
          <h2 className="font-semibold mb-3">{group}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {resources
              .filter((r) => r.group === group)
              .map((r) => (
                <Link
                  key={r.slug}
                  href={`/admin/data/${r.slug}`}
                  className="bg-white border rounded-lg p-4 hover:border-black"
                >
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{r.description}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Read
                    {r.can.create ? ' · Create' : ''}
                    {r.can.update ? ' · Update' : ''}
                    {r.can.delete ? ' · Delete' : ''}
                  </p>
                </Link>
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}
