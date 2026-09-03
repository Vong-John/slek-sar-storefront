import { useEffect, useState } from 'react'
import Shop from './components/Shop'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import Payment from './components/Payment'
import Confirmation from './components/Confirmation'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const LOGO_URL = `${SUPABASE_URL}/storage/v1/object/public/product-images/branding/sleksar.jpg`

export default function App() {
  const [page, setPage] = useState('shop') // shop | cart | checkout | payment | confirmation
  const [cart, setCart] = useState([])
  const [telegramToken, setTelegramToken] = useState(null)
  const [orderId, setOrderId] = useState(null)
  const [orderTotal, setOrderTotal] = useState(0)

  // Read the ?token=... from the URL (from the personalized shop link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) setTelegramToken(token)
  }, [])

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  function updateQty(id, qty) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== id))
      return
    }
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)))
  }

  function removeItem(id) {
    setCart((prev) => prev.filter((i) => i.id !== id))
  }

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0)
  const cartTotal = cart.reduce((sum, i) => sum + i.selling_price * i.qty, 0) + (cart.length > 0 ? 2 : 0)

  return (
    <>
      <header className="site-header">
        <div className="container">
          <div className="brand" onClick={() => setPage('shop')} style={{ cursor: 'pointer' }}>
            <img src={LOGO_URL} alt="Slek Sar" />
            Slek Sar
          </div>
          <button className="cart-btn" onClick={() => setPage('cart')}>
            Cart {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>
        </div>
      </header>

      {page === 'shop' && <Shop onAddToCart={addToCart} />}

      {page === 'cart' && (
        <Cart
          cart={cart}
          onUpdateQty={updateQty}
          onRemove={removeItem}
          onCheckout={() => setPage('checkout')}
        />
      )}

      {page === 'checkout' && (
        <Checkout
          cart={cart}
          telegramToken={telegramToken}
          onOrderCreated={(id, total) => {
            setOrderId(id)
            setOrderTotal(total)
            setPage('payment')
          }}
        />
      )}

      {page === 'payment' && (
        <Payment orderId={orderId} total={orderTotal} onSubmitted={() => setPage('confirmation')} />
      )}

      {page === 'confirmation' && <Confirmation orderId={orderId} />}

      {page === 'shop' && cartCount > 0 && (
        <div className="mobile-cart-bar">
          <span className="total">Cart: ${cartTotal.toFixed(2)}</span>
          <button onClick={() => setPage('cart')}>View Cart</button>
        </div>
      )}
    </>
  )
}
