'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { paystackClient } from '@/lib/paystack/client'

const PLATFORM_FEE_PERCENT = 0.10

export async function initializeStoreOrder(
  storeProductId: string
): Promise<{ error?: string; authorizationUrl?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in to purchase' }

  // Get product + store + seller subaccount
  const { data: product, error: productError } = await supabase
    .from('store_products')
    .select(`
      *,
      stores!store_products_store_id_fkey(
        id, store_name, slug, logo_url, owner_id, status
      )
    `)
    .eq('id', storeProductId)
    .eq('status', 'active')
    .eq('is_deleted', false)
    .single()

  if (productError || !product) return { error: 'Product not found or unavailable' }

  const store = Array.isArray(product.stores) ? product.stores[0] : product.stores
  if (!store) return { error: 'Store not found' }
  if (store.status !== 'active') return { error: 'This store is not currently active' }
  if (store.owner_id === user.id) return { error: 'You cannot purchase your own product' }

  // Check stock for physical products
  if (product.product_type === 'physical') {
    if (product.stock_quantity !== null && product.stock_quantity <= 0) {
      return { error: 'This product is out of stock' }
    }
  }

  // Get seller subaccount
  const { data: subaccount } = await supabase
    .from('paystack_subaccounts')
    .select('subaccount_code')
    .eq('user_id', store.owner_id)
    .eq('is_active', true)
    .single()

  if (!subaccount) return { error: 'Seller has not set up payment details yet' }

  // Get buyer profile
  const { data: buyerProfile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .single()

  if (!buyerProfile) return { error: 'Buyer profile not found' }

  const amount = Math.round(product.price * 100) // kobo
  const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT)
  const sellerAmount = amount - platformFee
  const reference = `cw_store_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`

  // Initialize Paystack transaction
  const paystackResponse = await paystackClient.initializeTransaction({
    email: buyerProfile.email,
    amount,
    reference,
    subaccount: subaccount.subaccount_code,
    bearer: 'account',
    transaction_charge: platformFee,
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders?reference=${reference}`,
    metadata: {
      store_product_id: storeProductId,
      store_id: store.id,
      buyer_id: user.id,
      seller_id: store.owner_id,
      product_type: product.product_type,
      custom_fields: [
        {
          display_name: 'Product',
          variable_name: 'product_title',
          value: product.title,
        },
        {
          display_name: 'Store',
          variable_name: 'store_name',
          value: store.store_name,
        },
      ],
    },
  })

  if (!paystackResponse.status) {
    return { error: 'Failed to initialize payment. Please try again.' }
  }

  // Create pending order
  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      store_id: store.id,
      store_product_id: storeProductId,
      listing_id: null,
      buyer_id: user.id,
      seller_id: store.owner_id,
      amount: product.price,
      platform_fee: platformFee / 100,
      seller_amount: sellerAmount / 100,
      status: 'pending',
      paystack_reference: reference,
      digital_file_url: product.product_type === 'digital' ? product.digital_file_url : null,
    })

  if (orderError) {
    return { error: 'Failed to create order. Please try again.' }
  }

  return { authorizationUrl: paystackResponse.data.authorization_url }
}

export async function verifyStoreOrder(reference: string) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  // Get order
  const { data: order } = await adminSupabase
    .from('orders')
    .select('*')
    .eq('paystack_reference', reference)
    .not('store_product_id', 'is', null)
    .single()

  if (!order) return { error: 'Order not found' }
  if (order.status !== 'pending') return { success: true, order }

  // Verify with Paystack
  const verification = await paystackClient.verifyTransaction(reference)
  if (!verification.status || verification.data.status !== 'success') {
    return { error: 'Payment verification failed' }
  }

  const isDigital = order.digital_file_url !== null

  // Update order status
  const { error: updateError } = await adminSupabase
    .from('orders')
    .update({
      status: isDigital ? 'completed' : 'paid',
      completed_at: isDigital ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)

  if (updateError) return { error: 'Failed to update order status' }

  // Decrement stock for physical products
  if (!isDigital && order.store_product_id) {
    const { data: product } = await adminSupabase
      .from('store_products')
      .select('stock_quantity')
      .eq('id', order.store_product_id)
      .single()

    if (product?.stock_quantity !== null && product?.stock_quantity !== undefined) {
      await adminSupabase
        .from('store_products')
        .update({ stock_quantity: Math.max(0, product.stock_quantity - 1) })
        .eq('id', order.store_product_id)
    }

    // Increment units_sold
    await adminSupabase.rpc('increment_store_units_sold', {
      product_id: order.store_product_id,
    })
  }

  revalidatePath('/orders')
  return { success: true, order: { ...order, status: isDigital ? 'completed' : 'paid' } }
}

export async function markStoreOrderShipped(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'shipped',
      shipped_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('seller_id', user.id)
    .eq('status', 'paid')
    .not('store_product_id', 'is', null)

  if (error) throw new Error(error.message)
  revalidatePath('/orders')
}

export async function confirmStoreDelivery(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'completed',
      delivery_confirmed_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('buyer_id', user.id)
    .eq('status', 'shipped')
    .not('store_product_id', 'is', null)

  if (error) throw new Error(error.message)
  revalidatePath('/orders')
}