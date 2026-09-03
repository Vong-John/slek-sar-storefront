import { createClient } from '@supabase/supabase-js'

// These come from your Supabase project settings (Settings > API).
// Set them as environment variables in Vercel (or a local .env file):
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`

async function callFunction(name, body) {
  const res = await fetch(`${FUNCTIONS_BASE}/${name}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Request to ${name} failed`)
  }
  return data
}

export function createOrder(payload) {
  return callFunction('create-order', payload)
}

export function submitPaymentProof(payload) {
  return callFunction('submit-payment-proof', payload)
}

// Uploads a screenshot file to the payment-proofs bucket and returns its
// storage path, which is what submit-payment-proof expects.
export async function uploadPaymentScreenshot(file, orderId) {
  const ext = file.name.split('.').pop()
  const path = `${orderId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('payment-proofs').upload(path, file)
  if (error) throw error
  return path
}

// Fetches only the columns safe for public/customer viewing — never
// selects cost_price.
export async function fetchActiveProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, title, description, images, selling_price, popularity_tag, stock_qty')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
