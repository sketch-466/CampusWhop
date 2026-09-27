import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Circle, Clock, Package, ShieldAlert, Truck, Wallet } from 'lucide-react'
import OrderActions from '@/components/shared/order-actions'

type Props = { params: Promise<{ id: string }> }

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pending Payment',
  paid:      'Payment Received',
  accepted:  'Order Accepted',
  shipped:   'Shipped / Ready',
  delivered: 'Delivered',
  completed: 'Completed',
  disputed:  'Under Review',
  refunded:  'Refunded',
  cancelled: 'Cancelled',
}

type TimelineStep = {
  key: string
  label: string
  description: string
  timestampKey: string | null
}

const MARKETPLACE_STEPS: TimelineStep[] = [
  { key: 'pending',   label: 'Order Placed',       description: 'Waiting for payment',           timestampKey: 'created_at' },
  { key: 'paid',      label: 'Payment Received',   description: 'Seller notified',               timestampKey: 'paid_at' },
  { key: 'accepted',  label: 'Order Accepted',     description: 'Seller is processing',          timestampKey: 'accepted_at' },
  { key: 'shipped',   label: 'Shipped / Ready',    description: 'On the way to you',             timestampKey: 'shipped_at' },
  { key: 'delivered', label: 'Delivered',          description: 'Awaiting your confirmation',    timestampKey: 'delivery_confirmed_at' },
  { key: 'completed', label: 'Completed',          description: 'Transaction complete',          timestampKey: 'completed_at' },
]

const STORE_STEPS: TimelineStep[] = [
  { key: 'pending',   label: 'Order Placed',       description: 'Waiting for payment',           timestampKey: 'created_at' },
  { key: 'paid',      label: 'Payment Received',   description: 'Seller preparing your order',  timestampKey: 'paid_at' },
  { key: 'shipped',   label: 'Shipped / Ready',    description: 'On the way to you',             timestampKey: 'shipped_at' },
  { key: 'completed', label: 'Completed',          description: 'Transaction complete',          timestampKey: 'completed_at' },
]

const DIGITAL_STEPS: TimelineStep[] = [
  { key: 'pending',   label: 'Order Placed',       description: 'Waiting for payment',           timestampKey: 'created_at' },
  { key: 'paid',      label: 'Payment Received',   description: 'Processing your download',      timestampKey: 'paid_at' },
  { key: 'completed', label: 'Ready to Download',  description: 'Your file is available',        timestampKey: 'completed_at' },
]

const STATUS_ORDER = ['pending', 'paid', 'accepted', 'shipped', 'delivered', 'completed']

function getStepStatus(stepKey: string, currentStatus: string): 'done' | 'active' | 'upcoming' {
  if (currentStatus === 'disputed' || currentStatus === 'cancelled' || currentStatus === 'refunded') {
    const stepIdx = STATUS_ORDER.indexOf(stepKey)
    const currentIdx = STATUS_ORDER.indexOf('shipped')
    if (stepIdx <= currentIdx) return 'done'
    return 'upcoming'
  }
  const stepIdx = STATUS_ORDER.indexOf(stepKey)
  const currentIdx = STATUS_ORDER.indexOf(currentStatus)
  if (stepIdx < currentIdx) return 'done'
  if (stepIdx === currentIdx) return 'active'
  return 'upcoming'
}

function formatDate(ts: string | null) {
  if (!ts) return null
  return new Date(ts).toLocaleString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      listings!orders_listing_id_fkey(id, title, images, product_type, description),
      store_products!orders_store_product_id_fkey(id, title, images, product_type),
      stores!orders_store_id_fkey(id, store_name, slug, logo_url),
      seller:profiles!orders_seller_id_fkey(id, full_name, avatar_url, is_verified, verification_status),
      buyer:profiles!orders_buyer_id_fkey(id, full_name, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (!order) notFound()

  // Security: only buyer or seller can view
  const isBuyer = order.buyer_id === user.id
  const isSeller = order.seller_id === user.id
  if (!isBuyer && !isSeller) notFound()

  const role = isBuyer ? 'buying' : 'selling'
  const isStoreOrder = !!order.store_product_id
  const isDigital = !!order.digital_file_url

  const title = isStoreOrder
    ? (order.store_products?.title ?? 'Store Product')
    : (order.listings?.title ?? 'Marketplace Item')

  const image = isStoreOrder
    ? order.store_products?.images?.[0]
    : order.listings?.images?.[0]

  const steps = isDigital
    ? DIGITAL_STEPS
    : isStoreOrder
    ? STORE_STEPS
    : MARKETPLACE_STEPS

  const isException = ['disputed', 'cancelled', 'refunded'].includes(order.status)

  const seller = Array.isArray(order.seller) ? order.seller[0] : order.seller
  const buyer = Array.isArray(order.buyer) ? order.buyer[0] : order.buyer
  const store = Array.isArray(order.stores) ? order.stores[0] : order.stores

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">

      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-4 flex items-center gap-3">
        <Link href="/orders" className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-sm font-bold text-zinc-100">Order Details</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            #{id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">

        {/* Exception State Banner */}
        {order.status === 'disputed' && (
          <div className="rounded-xl border border-red-800/40 bg-red-900/10 p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400">Under Admin Review</p>
              <p className="text-xs text-red-400/70 mt-0.5">
                A dispute has been opened on this order. Our team will review and reach out.
              </p>
            </div>
          </div>
        )}

        {order.status === 'refunded' && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/30 p-4 flex items-start gap-3">
            <Wallet className="h-5 w-5 text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-zinc-300">Refunded</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                This order has been refunded.
              </p>
            </div>
          </div>
        )}

        {/* Product Card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 flex gap-3">
          <div className="h-16 w-16 shrink-0 rounded-lg bg-zinc-800 overflow-hidden">
            {image ? (
              <img src={image} alt={title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl">📦</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-100 leading-tight">{title}</p>
            {store && (
              <p className="text-xs text-zinc-500 mt-0.5">{store.store_name}</p>
            )}
            {isDigital && (
              <span className="mt-1 inline-block rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-400 border border-purple-500/20">
                Digital Product
              </span>
            )}
            <p className="mt-1 text-sm font-bold text-emerald-400">
              ₦{order.amount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Order Timeline */}
        {!isException && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              Order Progress
            </h2>
            <div className="space-y-0">
              {steps.map((step, idx) => {
                const stepStatus = getStepStatus(step.key, order.status)
                const timestamp = step.timestampKey ? order[step.timestampKey as keyof typeof order] as string | null : null
                const isLast = idx === steps.length - 1

                return (
                  <div key={step.key} className="flex gap-3">
                    {/* Icon + connector */}
                    <div className="flex flex-col items-center">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        stepStatus === 'done'
                          ? 'border-emerald-500 bg-emerald-500/20'
                          : stepStatus === 'active'
                          ? 'border-emerald-400 bg-emerald-400/10 ring-2 ring-emerald-400/20'
                          : 'border-zinc-700 bg-zinc-900'
                      }`}>
                        {stepStatus === 'done' ? (
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                        ) : stepStatus === 'active' ? (
                          <Clock className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-zinc-600" />
                        )}
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 flex-1 my-1 min-h-[24px] ${
                          stepStatus === 'done' ? 'bg-emerald-500/40' : 'bg-zinc-800'
                        }`} />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`pb-5 ${isLast ? 'pb-0' : ''}`}>
                      <p className={`text-sm font-medium leading-tight ${
                        stepStatus === 'done'
                          ? 'text-zinc-300'
                          : stepStatus === 'active'
                          ? 'text-white'
                          : 'text-zinc-600'
                      }`}>
                        {step.label}
                      </p>
                      <p className={`text-xs mt-0.5 ${
                        stepStatus === 'active' ? 'text-zinc-400' : 'text-zinc-600'
                      }`}>
                        {stepStatus === 'active' ? step.description : stepStatus === 'done' && timestamp
                          ? formatDate(timestamp)
                          : step.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-2">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Payment Summary
          </h2>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Product price</span>
            <span className="text-zinc-200">₦{order.amount.toLocaleString()}</span>
          </div>
          {role === 'selling' && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Platform fee (10%)</span>
                <span className="text-red-400">− ₦{order.platform_fee?.toLocaleString() ?? '0'}</span>
              </div>
              <div className="border-t border-zinc-800 pt-2 flex justify-between text-sm font-semibold">
                <span className="text-zinc-300">Your earnings</span>
                <span className="text-emerald-400">₦{order.seller_amount?.toLocaleString() ?? order.amount.toLocaleString()}</span>
              </div>
            </>
          )}
          {role === 'buying' && (
            <div className="border-t border-zinc-800 pt-2 flex justify-between text-sm font-semibold">
              <span className="text-zinc-300">Total paid</span>
              <span className="text-emerald-400">₦{order.amount.toLocaleString()}</span>
            </div>
          )}
          {order.paystack_reference && (
            <p className="text-[10px] text-zinc-600 pt-1">
              Ref: {order.paystack_reference}
            </p>
          )}
        </div>

        {/* Seller / Buyer Info */}
        {role === 'buying' && seller && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Seller
            </h2>
            <div className="flex items-center gap-3">
              {seller.avatar_url ? (
                <img src={seller.avatar_url} alt={seller.full_name}
                  className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-zinc-300">
                  {seller.full_name?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-zinc-200">{seller.full_name}</p>
                  {seller.verification_status === 'verified' && (
                    <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500">FUNAI Student</p>
              </div>
            </div>
          </div>
        )}

        {role === 'selling' && buyer && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Buyer
            </h2>
            <div className="flex items-center gap-3">
              {buyer.avatar_url ? (
                <img src={buyer.avatar_url} alt={buyer.full_name}
                  className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-zinc-300">
                  {buyer.full_name?.[0]?.toUpperCase()}
                </div>
              )}
              <p className="text-sm font-medium text-zinc-200">{buyer.full_name}</p>
            </div>
          </div>
        )}

        {/* Order Meta */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-2">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Order Info
          </h2>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Order ID</span>
            <span className="text-zinc-300 font-mono">#{id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Status</span>
            <span className="text-zinc-300">{STATUS_LABELS[order.status] ?? order.status}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Placed</span>
            <span className="text-zinc-300">{formatDate(order.created_at)}</span>
          </div>
          {order.paid_at && (
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Paid</span>
              <span className="text-zinc-300">{formatDate(order.paid_at)}</span>
            </div>
          )}
          {order.completed_at && (
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Completed</span>
              <span className="text-zinc-300">{formatDate(order.completed_at)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
          <OrderActions order={order} role={role} />
        </div>

      </div>
    </div>
  )
}