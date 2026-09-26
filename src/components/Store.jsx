import { useEffect, useState } from 'react'
import { fetchActiveProducts } from '../lib/supabase'
import ProductCard from './ProductCard'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const CATEGORY_META = {
  indoor: { title: 'Indoor Plants' },
  outdoor: { title: 'Outdoor Plants' },
  gift: { title: 'Gift' },
}

// Checks the URL for a signed Telegram link (?tg=...&token=...) coming from
// a notification message, and confirms with the backend that it's genuine.
// Returns null if there's nothing to check, or if the link didn't verify.
async function verifyCustomerFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const tg = params.get('tg')
  const token = params.get('token')
  if (!tg || !token) return null

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-customer-link`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chat_id: tg, token }),
    })
    const data = await res.json()
    return data?.valid ? data : null
  } catch {
    // Network hiccup or bad link — fail quietly, just show the shop as normal.
    return null
  }
}

export default function Store({ anchor, onAddToCart }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [singleCol, setSingleCol] = useState(false)
  const [customer, setCustomer] = useState(null) // { chat_id, recent_order } once verified, else null

  useEffect(() => {
    fetchActiveProducts()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // Runs once on load: if this visit came from a notification link, confirm
  // who it is so we can recognize them for this session.
  useEffect(() => {
    verifyCustomerFromUrl().then((result) => {
      if (result) setCustomer(result)
    })
  }, [])

  // Scroll to the requested category section once its content has rendered.
  useEffect(() => {
    if (!anchor || loading) return
    const timer = setTimeout(() => {
      const el = document.getElementById(anchor)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    return () => clearTimeout(timer)
  }, [anchor, loading])

  const grouped = { indoor: [], outdoor: [], gift: [], other: [] }
  for (const p of products) {
    const cat = (p.category || '').toLowerCase()
    if (grouped[cat]) grouped[cat].push(p)
    else grouped.other.push(p)
  }
  const hasAnyCategorized = grouped.indoor.length || grouped.outdoor.length || grouped.gift.length

  const gridClass = `product-grid ${singleCol ? 'single-col' : ''}`

  return (
    <div className="container">
      <div className="shop-toolbar">
        <h1 className="shop-title">Store</h1>
        <div className="grid-toggle">
          <button className={!singleCol ? 'active' : ''} onClick={() => setSingleCol(false)}>
            2-col
          </button>
          <button className={singleCol ? 'active' : ''} onClick={() => setSingleCol(true)}>
            1-col
          </button>
        </div>
      </div>

      {customer && (
        <p className="status-banner" style={{ marginBottom: '1rem' }}>
          Welcome back! 🌿
          {customer.recent_order ? ` Your last order is ${customer.recent_order.status}.` : ''}
        </p>
      )}

      {loading && <p>Loading products…</p>}
      {error && <p className="status-banner error">{error}</p>}
      {!loading && !error && products.length === 0 && (
        <p>No products available right now — check back soon.</p>
      )}

      {['indoor', 'outdoor', 'gift'].map((cat) =>
        grouped[cat].length > 0 ? (
          <section key={cat} id={cat} className="category-section">
            <h2 className="category-title">{CATEGORY_META[cat].title}</h2>
            <div className={gridClass}>
              {grouped[cat].map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
              ))}
            </div>
          </section>
        ) : null
      )}

      {grouped.other.length > 0 && (
        <section id="all" className="category-section">
          <h2 className="category-title">{hasAnyCategorized ? 'More' : 'All Plants'}</h2>
          <div className={gridClass}>
            {grouped.other.map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
