import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyStore, getStoreProducts } from '@/lib/actions/store'
import { StoreProductCard } from '@/components/store/StoreProductCard'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  suspended: 'bg-red-500/10 text-red-400 border-red-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const PRODUCT_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  archived: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

export default async function StoreDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { store } = await getMyStore()
  if (!store) redirect('/store/setup')

  const [{ products, error }, { data: subaccount }] = await Promise.all([
    getStoreProducts(store.id, true),
    supabase
      .from('paystack_subaccounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle(),
  ])

  const hasSubaccount = !!subaccount

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-zinc-100">{store.store_name}</h1>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                  STATUS_STYLES[store.status] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                }`}
              >
                {store.status}
              </span>
              <span className="text-xs text-zinc-600">/store/{store.slug}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link
              href="/store/setup"
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-500"
            >
              Edit
            </Link>
            <Link
              href="/store/dashboard/new"
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              + Product
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {!hasSubaccount && (
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
            <p className="text-sm font-semibold text-yellow-400 mb-1">
              ⚠ Payment setup required
            </p>
            <p className="text-xs text-yellow-300/70 mb-3">
              You need to add your bank account before buyers can purchase your
              products. Your store cannot go live until this is complete.
            </p>
            <Link
              href="/seller/setup"
              className="inline-block rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-yellow-400"
            >
              Set Up Payments →
            </Link>
          </div>
        )}

        {store.status === 'pending' && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">
            <p className="text-sm font-semibold text-zinc-300 mb-1">
              ⏳ Store under review
            </p>
            <p className="text-xs text-zinc-500">
              Our team is reviewing your store. It will go live once approved —
              usually within 24 hours.
            </p>
          </div>
        )}

        {store.status === 'rejected' && store.rejection_reason && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm font-semibold text-red-400 mb-1">
              Store Rejected
            </p>
            <p className="text-xs text-red-300/70">{store.rejection_reason}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
            <p className="text-xs text-zinc-500">Products</p>
            <p className="text-xl font-bold text-zinc-100">
              {products?.length ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
            <p className="text-xs text-zinc-500">Status</p>
            <p className="text-sm font-semibold text-zinc-100 capitalize">
              {store.status}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
            <p className="text-xs text-zinc-500">Storefront</p>
            <Link
              href={`/store/${store.slug}`}
              className="text-xs text-emerald-400 hover:underline"
            >
              View →
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-zinc-200 mb-3">
            Your Products
          </h2>

          {error ? (
            <p className="text-xs text-red-400">{error}</p>
          ) : !products || products.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-sm text-zinc-500 mb-3">No products yet</p>
              <Link
                href="/store/dashboard/new"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
              >
                Add First Product
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {products.map((product: any) => (
                <div key={product.id} className="relative">
                  <StoreProductCard product={product} storeSlug={store.slug} />
                  <div className="absolute left-2 top-2">
                    <span
                      className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${
                        PRODUCT_STATUS_STYLES[product.status] ??
                        'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                      }`}
                    >
                      {product.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}