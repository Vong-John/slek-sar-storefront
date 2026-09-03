import { useEffect, useState } from 'react'
import { fetchActiveProducts } from '../lib/supabase'
import ProductCard from './ProductCard'

export default function Shop({ onAddToCart }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [singleCol, setSingleCol] = useState(false)

  useEffect(() => {
    fetchActiveProducts()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container">
      <div className="shop-toolbar">
        <h1 className="shop-title">Shop</h1>
        <div className="grid-toggle">
          <button className={!singleCol ? 'active' : ''} onClick={() => setSingleCol(false)}>
            2-col
          </button>
          <button className={singleCol ? 'active' : ''} onClick={() => setSingleCol(true)}>
            1-col
          </button>
        </div>
      </div>

      {loading && <p>Loading products…</p>}
      {error && <p className="status-banner error">{error}</p>}
      {!loading && !error && products.length === 0 && (
        <p>No products available right now — check back soon.</p>
      )}

      <div className={`product-grid ${singleCol ? 'single-col' : ''}`}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
        ))}
      </div>
    </div>
  )
}
