import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPendingStores, getPendingStoreProducts } from '@/lib/actions/store'
import { revalidatePath } from 'next/cache'
import { Shield, CheckCircle, XCircle } from 'lucide-react'

export default async function AdminStoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  const [storesResult, productsResult] = await Promise.all([
    getPendingStores(),
    getPendingStoreProducts(),
  ])

  const stores = storesResult.stores ?? []
  const products = productsResult.products ?? []

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-5">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-400" />
          <h1 className="text-lg font-bold text-zinc-100">Admin: Stores & Products</h1>
        </div>
        <p className="text-xs text-zinc-500 mt-0.5">
          {stores.length} store{stores.length !== 1 ? 's' : ''} ·{' '}
          {products.length} product{products.length !== 1 ? 's' : ''} pending
        </p>
      </div>

      <div className="px-4 py-5 space-y-8">

        {/* Pending Stores */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300">
            Pending Stores ({stores.length})
          </h2>

          {stores.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="text-4xl mb-2">✅</span>
              <p className="text-xs text-zinc-500">No pending stores</p>
            </div>
          ) : (
            stores.map((store: any) => (
              <div key={store.id} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                <div className="p-4 space-y-1">
                  <h3 className="text-sm font-bold text-zinc-100">{store.store_name}</h3>
                  <p className="text-xs text-zinc-500">/store/{store.slug}</p>
                  {store.tagline && (
                    <p className="text-xs text-zinc-400 italic">{store.tagline}</p>
                  )}
                  <p className="text-xs text-zinc-500">
                    By {store.owner?.full_name ?? 'Unknown'} ·{' '}
                    {store.owner?.email} · {store.owner?.university}
                  </p>
                  {store.description && (
                    <div className="mt-2 rounded-lg bg-zinc-800 p-2">
                      <p className="text-xs text-zinc-300 line-clamp-3">
                        {store.description}
                      </p>
                    </div>
                  )}
                  {store.banner_url && (
                    <img
                      src={store.banner_url}
                      alt={store.store_name}
                      className="mt-2 w-full rounded-lg object-cover h-24"
                    />
                  )}
                </div>
                <div className="flex gap-2 border-t border-zinc-800 px-4 py-3">
                  <form
                    action={async () => {
                      'use server'
                      const supabase = await createClient()
                      await supabase
                        .from('stores')
                        .update({ status: 'active', updated_at: new Date().toISOString() })
                        .eq('id', store.id)
                      revalidatePath('/admin/stores')
                    }}
                  >
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Approve
                    </button>
                  </form>
                  <RejectStoreForm storeId={store.id} />
                </div>
              </div>
            ))
          )}
        </section>

        {/* Pending Products */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300">
            Pending Products ({products.length})
          </h2>

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="text-4xl mb-2">✅</span>
              <p className="text-xs text-zinc-500">No pending products</p>
            </div>
          ) : (
            products.map((product: any) => (
              <div key={product.id} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                <div className="flex gap-3 p-4">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-600 text-xs">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="text-sm font-bold text-zinc-100 truncate">
                      {product.title}
                    </h3>
                    <p className="text-sm font-semibold text-emerald-400">
                      ₦{product.price?.toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {product.store?.store_name} ·{' '}
                      <span className="capitalize">{product.product_type}</span>
                    </p>
                    {product.description && (
                      <p className="text-xs text-zinc-400 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 border-t border-zinc-800 px-4 py-3">
                  <form
                    action={async () => {
                      'use server'
                      const supabase = await createClient()
                      await supabase
                        .from('store_products')
                        .update({ status: 'active', updated_at: new Date().toISOString() })
                        .eq('id', product.id)
                      revalidatePath('/admin/stores')
                    }}
                  >
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Approve
                    </button>
                  </form>
                  <form
                    action={async () => {
                      'use server'
                      const supabase = await createClient()
                      await supabase
                        .from('store_products')
                        .update({
                          status: 'rejected',
                          rejection_reason: 'Does not meet guidelines',
                          updated_at: new Date().toISOString(),
                        })
                        .eq('id', product.id)
                      revalidatePath('/admin/stores')
                    }}
                  >
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  )
}

function RejectStoreForm({ storeId }: { storeId: string }) {
  return (
    <form
      action={async (formData: FormData) => {
        'use server'
        const reason = formData.get('reason') as string
        if (!reason?.trim()) return
        const supabase = await createClient()
        await supabase
          .from('stores')
          .update({
            status: 'rejected',
            rejection_reason: reason.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', storeId)
        revalidatePath('/admin/stores')
      }}
      className="flex flex-1 gap-2"
    >
      <input
        name="reason"
        type="text"
        placeholder="Rejection reason"
        required
        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-red-500 focus:outline-none"
      />
      <button
        type="submit"
        className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 flex-shrink-0"
      >
        <XCircle className="h-3.5 w-3.5" />
        Reject
      </button>
    </form>
  )
}