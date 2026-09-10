import { useEffect, useState } from 'react'
import Header from './components/Header'
import Home from './components/Home'
import Store from './components/Store'
import Contact from './components/Contact'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import Payment from './components/Payment'
import Confirmation from './components/Confirmation'

export default function App() {
  const [page, setPage] = useState('home') // home | store | contact | cart | checkout | payment | confirmation
  const [storeAnchor, setStoreAnchor] = useState(null)
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

  function navigate(target, anchor = null) {
    setPage(target)
    setStoreAnchor(target === 'store' ? anchor : null)
    if (target !== 'store' || !anchor) window.scrollTo(0, 0)
  }

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
      <Header page={page} onNavigate={navigate} cartCount={cartCount} onCartClick={() => navigate('cart')} />

      {page === 'home' && <Home onNavigate={navigate} />}

      {page === 'store' && <Store anchor={storeAnchor} onAddToCart={addToCart} />}

      {page === 'contact' && <Contact />}

      {page === 'cart' && (
        <Cart
          cart={cart}
          onUpdateQty={updateQty}
          onRemove={removeItem}
          onCheckout={() => navigate('checkout')}
        />
      )}

      {page === 'checkout' && (
        <Checkout
          cart={cart}
          telegramToken={telegramToken}
          onOrderCreated={(id, total) => {
            setOrderId(id)
            setOrderTotal(total)
            navigate('payment')
          }}
        />
      )}

      {page === 'payment' && (
        <Payment orderId={orderId} total={orderTotal} onSubmitted={() => navigate('confirmation')} />
      )}

      {page === 'confirmation' && <Confirmation orderId={orderId} />}

      {page === 'store' && cartCount > 0 && (
        <div className="mobile-cart-bar">
          <span className="total">Cart: ${cartTotal.toFixed(2)}</span>
          <button onClick={() => navigate('cart')}>View Cart</button>
        </div>
      )}
    </>
  )
}
