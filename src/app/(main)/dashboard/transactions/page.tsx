import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, ShoppingBag, Store } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  paid:      'bg-blue-500/10 text-blue-400 border-blue-500/20',
  accepted:  'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  shipped:   'bg-purple-500/10 text-purple-400 border-purple-500/20',
  delivered: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  disputed:  'bg-red-500/10 text-red-400 border-red-500/20',
  refunded:  'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  cancelled: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pending',
  paid:      'Paid',
  accepted:  'Accepted',
  shipped:   'Shipped',
  delivered: 'Delivered',
  completed: 'Completed',
  disputed:  'Disputed',
  refunded:  'Refunded',
  cancelled: 'Cancelled',
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`
}

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: buyingOrders }, { data: sellingOrders }] = await Promise.all([
    supabase
      .from('orders')
      .select(`
        id, amount, platform_fee, seller_amount, status,
        paystack_reference, created_at, paid_at, completed_at,
        digital_file_url, store_product_id,
        listings!orders_listing_id_fkey(id, title, images, product_type),
        store_products!orders_store_product_id_fkey(id, title, images),
        stores!orders_store_id_fkey(id, store_name)
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select(`
        id, amount, platform_fee, seller_amount, status,
        paystack_reference, created_at, paid_at, completed_at,
        digital_file_url, store_product_id,
        listings!orders_listing_id_fkey(id, title, images, product_type),
        store_products!orders_store_product_id_fkey(id, title, images),
        stores!orders_store_id_fkey(id, store_name),
        buyer:profiles!orders_buyer_id_fkey(id, full_name)
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const buying = buyingOrders ?? []
  const selling = sellingOrders ?? []

  // Buyer totals
  const totalSpent = buying
    .filter(o => !['pending', 'cancelled'].includes(o.status))
    .reduce((sum, o) => sum + (o.amount ?? 0), 0)

  const totalOrders = buying.length

  // Seller totals
  const completedSales = selling.filter(o => o.status === 'completed')
  const totalEarned = completedSales.reduce((sum, o) => sum + (o.seller_amount ?? 0), 0)
  const totalFeesPaid = completedSales.reduce((sum, o) => sum + (o.platform_fee ?? 0), 0)
  const totalSales = selling.length

  const hasBuying = buying.length > 0
  const hasSelling = selling.length > 0

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">

      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-sm font-bold text-zinc-100">Transaction History</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Your complete financial record</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6 max-w-2xl mx-auto">

        {/* ── SELLER SECTION ── */}
        {hasSelling && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-zinc-200">Sales</h2>
            </div>

            {/* Seller Summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 text-center">
                <p className="text-base font-bold text-white">{totalSales}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Total Orders</p>
              </div>
              <div className="rounded-xl border border-emerald-800/30 bg-emerald-900/10 p-3 text-center">
                <p className="text-base font-bold text-emerald-400">
                  {formatNaira(totalEarned)}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Total Earned</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 text-center">
                <p className="text-base font-bold text-red-400">
                  {formatNaira(totalFeesPaid)}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Fees Paid</p>
              </div>
            </div>

            {/* Seller Transaction List */}
            <div className="space-y-2">
              {selling.map((order: any) => {
                const isStoreOrder = !!order.store_product_id
                const title = isStoreOrder
                  ? (order.store_products?.title ?? 'Store Product')
                  : (order.listings?.title ?? 'Marketplace Item')
                const image = isStoreOrder
                  ? order.store_products?.images?.[0]
                  : order.listings?.images?.[0]
                const storeName = order.stores?.store_name ?? null
                const buyerName = order.buyer?.full_name ?? null
                const isCompleted = order.status === 'completed'

                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 hover:border-zinc-700 transition-colors"
                  >
                    {/* Image */}
                    <div className="h-12 w-12 shrink-0 rounded-lg bg-zinc-800 overflow-hidden">
                      {image ? (
                        <img src={image} alt={title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg">📦</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {storeName && (
                          <span className="text-[10px] text-zinc-500">{storeName} ·</span>
                        )}
                        {buyerName && (
                          <span className="text-[10px] text-zinc-500">from {buyerName}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        {formatDate(order.created_at)}
                      </p>
                    </div>

                    {/* Financials */}
                    <div className="text-right shrink-0">
                      {isCompleted ? (
                        <>
                          <p className="text-sm font-bold text-emerald-400">
                            {formatNaira(order.seller_amount ?? order.amount)}
                          </p>
                          <p className="text-[10px] text-zinc-600">
                            fee: {formatNaira(order.platform_fee ?? 0)}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-zinc-300">
                            {formatNaira(order.amount)}
                          </p>
                          <span className={`mt-0.5 inline-block rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${
                            STATUS_STYLES[order.status] ?? STATUS_STYLES.pending
                          }`}>
                            {STATUS_LABELS[order.status] ?? order.status}
                          </span>
                        </>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── BUYER SECTION ── */}
        {hasBuying && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-zinc-200">Purchases</h2>
            </div>

            {/* Buyer Summary */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 text-center">
                <p className="text-base font-bold text-white">{totalOrders}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Total Orders</p>
              </div>
              <div className="rounded-xl border border-blue-800/30 bg-blue-900/10 p-3 text-center">
                <p className="text-base font-bold text-blue-400">
                  {formatNaira(totalSpent)}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Total Spent</p>
              </div>
            </div>

            {/* Buyer Transaction List */}
            <div className="space-y-2">
              {buying.map((order: any) => {
                const isStoreOrder = !!order.store_product_id
                const title = isStoreOrder
                  ? (order.store_products?.title ?? 'Store Product')
                  : (order.listings?.title ?? 'Marketplace Item')
                const image = isStoreOrder
                  ? order.store_products?.images?.[0]
                  : order.listings?.images?.[0]
                const storeName = order.stores?.store_name ?? null

                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 hover:border-zinc-700 transition-colors"
                  >
                    {/* Image */}
                    <div className="h-12 w-12 shrink-0 rounded-lg bg-zinc-800 overflow-hidden">
                      {image ? (
                        <img src={image} alt={title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg">🛍️</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{title}</p>
                      {storeName && (
                        <p className="text-[10px] text-zinc-500 mt-0.5">{storeName}</p>
                      )}
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        {formatDate(order.created_at)}
                      </p>
                      {order.paystack_reference && (
                        <p className="text-[10px] text-zinc-700 mt-0.5 font-mono truncate">
                          {order.paystack_reference}
                        </p>
                      )}
                    </div>

                    {/* Amount + Status */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-zinc-200">
                        {formatNaira(order.amount)}
                      </p>
                      <span className={`mt-0.5 inline-block rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${
                        STATUS_STYLES[order.status] ?? STATUS_STYLES.pending
                      }`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!hasBuying && !hasSelling && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-3">📊</span>
            <h3 className="text-sm font-semibold text-zinc-300 mb-1">No transactions yet</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Your financial history will appear here once you buy or sell
            </p>
            <Link
              href="/marketplace"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Browse Marketplace
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}