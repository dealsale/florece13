import { PanelNav } from '@/components/panel/PanelNav'
import { requireMerchant } from '@/lib/auth'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { store } = await requireMerchant()
  return (
    <div className="container panel-layout">
      <PanelNav storeSlug={store.slug} />
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  )
}
