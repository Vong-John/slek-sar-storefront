import { supabase } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// ---------- auth ----------

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data.user
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session ?? null
}

// Having a login is not the same as being an admin — the admins table is
// the allowlist. This confirms the signed-in user is actually on it.
export async function getAdminProfile() {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) return null

  const { data, error } = await supabase
    .from('admins')
    .select('user_id, email, full_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data) return null
  return data
}

// ---------- orders ----------

export async function fetchOrders(status = null) {
  let query = supabase
    .from('orders')
    .select(
      'id, created_at, customer_name, customer_phone, customer_address, subtotal, delivery_fee, total, status, telegram_chat_id, telegram_declined, failed_payment_count, pdf_url, order_items(quantity, price_at_order, products(title))'
    )
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

// Payment screenshots live in a private bucket — we mint a short-lived
// signed URL rather than making the bucket public, so proof images can't
// be guessed or shared around.
export async function fetchPaymentProof(orderId) {
  const { data: rows, error } = await supabase
    .from('payment_proofs')
    .select('id, screenshot_url, transaction_ref, status, reviewed_by, reviewed_at, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw new Error(error.message)
  const proof = rows?.[0]
  if (!proof?.screenshot_url) return null

  const { data: signed, error: signErr } = await supabase.storage
    .from('payment-proofs')
    .createSignedUrl(proof.screenshot_url, 60 * 10) // 10 minutes

  if (signErr) throw new Error(signErr.message)
  return { ...proof, url: signed.signedUrl }
}

export async function reviewPayment(orderId, proofId, action, adminId) {
  const session = await getSession()
  if (!session) throw new Error('Your session expired — please sign in again.')

  const res = await fetch(`${SUPABASE_URL}/functions/v1/review-payment`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ order_id: orderId, proof_id: proofId, action, admin_id: adminId }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Could not save that review.')
  return data
}

export async function resetOrder(orderId, adminId) {
  const session = await getSession()
  if (!session) throw new Error('Your session expired — please sign in again.')

  const res = await fetch(`${SUPABASE_URL}/functions/v1/reset-order`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ order_id: orderId, admin_id: adminId }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Could not reset that order.')
  return data
}

// ---------- products ----------

export async function fetchAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, title, description, images, selling_price, cost_price, stock_qty, category, is_active, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function saveProduct(product) {
  const payload = {
    title: product.title.trim(),
    description: product.description?.trim() || null,
    selling_price: Number(product.selling_price),
    cost_price: product.cost_price === '' || product.cost_price == null ? null : Number(product.cost_price),
    stock_qty: Number(product.stock_qty),
    category: product.category || null,
    images: product.images ?? [],
    is_active: Boolean(product.is_active),
  }

  if (product.id) {
    const { data, error } = await supabase.from('products').update(payload).eq('id', product.id).select().single()
    if (error) throw new Error(error.message)
    return data
  }

  const { data, error } = await supabase.from('products').insert(payload).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function uploadProductImage(file) {
  const ext = file.name.split('.').pop()
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = `products/${safeName}`

  const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: false })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}
