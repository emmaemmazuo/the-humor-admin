import type { SupabaseClient } from '@supabase/supabase-js'

// Supabase returns at most 1000 rows per request, so page through the table.
export async function fetchAll<T>(
  admin: SupabaseClient,
  table: string,
  columns: string,
  orderBy = 'id'
): Promise<T[]> {
  const pageSize = 1000
  const rows: T[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from(table)
      .select(columns)
      .order(orderBy)
      .range(from, from + pageSize - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    const page = (data ?? []) as unknown as T[]
    rows.push(...page)
    if (page.length < pageSize) break
  }
  return rows
}
