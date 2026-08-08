import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { verifyPayment } from '@/lib/actions/orders'
import { verifyStoreOrder } from '@/lib/actions/orders-store'
import OrderActions from '@/components/shared/order-actions'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  paid: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  shipped: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  disputed: 'bg-red-500/10 text-red-400 border-red-500/20',
  refunded: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  cancelled: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Payment',
  paid: 'Paid',
  shipped: 'Shipped',
  completed: 'Completed',
  disputed: 'Disputed',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
}

type PageProps = {
  searchParams: Promise<{
    reference?: string
    trxref?: string
    tab?: string
    show?: string
  }>
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const reference = params.reference || params.trxref
  const tab = params.tab === 'selling' ? 'selling' : 'buying'
  const showAll = params.show === 'all'

  if (reference) {
    if (reference.startsWith('cw_store_')) {
      await verifyStoreOrder(reference)
    } else {
      await verifyPayment(reference)
    }
  }

  const [{ data: buyingOrders }, { data: sellingOrders }] = await Promise.all([
    supabase
      .from('orders')
      .select(`
        *,
        listings!orders_listing_id_fkey(id, title, images, product_type),
        store_products!orders_store_product_id_fkey(id, title, images, product_type),
        stores!orders_store_id_fkey(id, store_name, slug, logo_url),
        seller:profiles!orders_seller_id_fkey(id, full_name, avatar_url)
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select(`
        *,
        listings!orders_listing_id_fkey(id, title, images, product_type),
        store_products!orders_store_product_id_fkey(id, title, images, product_type),
        stores!orders_store_id_fkey(id, store_name, slug, logo_url),
        buyer:profiles!orders_buyer_id_fkey(id, full_name, avatar_url)
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const allBuying = buyingOrders ?? []
  const allSelling = sellingOrders ?? []

  // By default hide completed and cancelled orders
  const hiddenStatuses = ['completed', 'cancelled', 'refunded']
  const buying = showAll
    ? allBuying
    : allBuying.filter((o) => !hiddenStatuses.includes(o.status))
  const selling = showAll
    ? allSelling
    : allSelling.filter((o) => !hiddenStatuses.includes(o.status))

  const hiddenBuyingCount = allBuying.filter((o) =>
    hiddenStatuses.includes(o.status)
  ).length
  const hiddenSellingCount = allSelling.filter((o) =>
    hiddenStatuses.includes(o.status)
  ).length
  const hiddenCount = tab === 'buying' ? hiddenBuyingCount : hiddenSellingCount

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-5">
        <h1 className="text-lg font-bold text-zinc-100">Orders</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Track your purchases and sales</p>
      </div>

      {reference && (
        <div className="mx-4 mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
          <p className="text-xs text-emerald-400">
            ✓ Payment received — your order has been updated below.
          </p>
        </div>
      )}

      <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 pt-4 pb-0">
        <div className="flex gap-1 rounded-lg bg-zinc-800 p-1">
          <Link
            href={`/orders?tab=buying${showAll ? '&show=all' : ''}`}
            className={`flex-1 rounded-md py-1.5 text-center text-xs font-medium transition-colors ${
              tab === 'buying'
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Buying ({buying.length})
          </Link>
          <Link
            href={`/orders?tab=selling${showAll ? '&show=all' : ''}`}
            className={`flex-1 rounded-md py-1.5 text-center text-xs font-medium transition-colors ${
              tab === 'selling'
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Selling ({selling.length})
          </Link>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {tab === 'buying' ? (
          buying.length === 0 && !showAll ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-5xl mb-3">🛍️</span>
              <h3 className="text-sm font-semibold text-zinc-300 mb-1">No active orders</h3>
              <p className="text-xs text-zinc-500 mb-4">
                Start shopping on the marketplace or student stores
              </p>
              <Link
                href="/marketplace"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
              >
                Browse Marketplace
              </Link>
            </div>
          ) : (
            buying.map((order: any) => (
              <OrderCard key={order.id} order={order} role="buying" />
            ))
          )
        ) : selling.length === 0 && !showAll ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-3">📦</span>
            <h3 className="text-sm font-semibold text-zinc-300 mb-1">No active sales</h3>
            <p className="text-xs text-zinc-500">
              Orders from buyers will appear here
            </p>
          </div>
        ) : (
          selling.map((order: any) => (
            <OrderCard key={order.id} order={order} role="selling" />
          ))
        )}

        {/* Show/hide history toggle */}
        {hiddenCount > 0 && !showAll && (
          <Link
            href={`/orders?tab=${tab}&show=all`}
            className="block w-full rounded-lg border border-dashed border-zinc-700 py-3 text-center text-xs text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Show {hiddenCount} completed / cancelled order{hiddenCount !== 1 ? 's' : ''}
          </Link>
        )}
        {showAll && hiddenCount > 0 && (
          <Link
            href={`/orders?tab=${tab}`}
            className="block w-full rounded-lg border border-dashed border-zinc-700 py-3 text-center text-xs text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Hide completed / cancelled orders
          </Link>
        )}
      </div>
    </div>
  )
}

function OrderCard({ order, role }: { order: any; role: 'buying' | 'selling' }) {
  const isStoreOrder = !!order.store_product_id
  const isDigital = !!order.digital_file_url

  const title = isStoreOrder
    ? (order.store_products?.title ?? 'Store Product')
    : (order.listings?.title ?? 'Marketplace Item')

  const image = isStoreOrder
    ? order.store_products?.images?.[0]
    : order.listings?.images?.[0]

  const storeName = order.stores?.store_name ?? null
  const storeLogo = order.stores?.logo_url ?? null

  const postedDate = new Date(order.created_at).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="flex gap-3 p-3">
        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-800">
          {image ? (
            <img src={image} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl text-zinc-600">
              📦
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-zinc-100 truncate leading-tight">
              {title}
            </p>
            <span
              className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
                STATUS_STYLES[order.status] ?? STATUS_STYLES.pending
              }`}
            >
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>

          {isStoreOrder && storeName && (
            <div className="flex items-center gap-1.5">
              {storeLogo ? (
                <img src={storeLogo} alt={storeName}
                  className="h-4 w-4 rounded-full object-cover" />
              ) : (
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-700 text-[8px] text-zinc-400">
                  {storeName[0]}
                </div>
              )}
              <span className="text-xs text-zinc-500">{storeName}</span>
              {isDigital && (
                <span className="text-xs text-purple-400">· Digital</span>
              )}
            </div>
          )}

          <p className="text-sm font-bold text-emerald-400">
            ₦{order.amount.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-600">{postedDate}</p>

          {role === 'selling' && order.buyer && (
            <div className="flex items-center gap-1.5">
              {order.buyer.avatar_url ? (
                <img src={order.buyer.avatar_url} alt={order.buyer.full_name}
                  className="h-4 w-4 rounded-full object-cover" />
              ) : (
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-700 text-[8px] text-zinc-400">
                  {order.buyer.full_name?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-xs text-zinc-400">{order.buyer.full_name}</span>
            </div>
          )}
        </div>
      </div>

      <OrderActions order={order} role={role} />
    </div>
  )
}