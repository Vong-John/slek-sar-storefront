import { useEffect, useState } from 'react'
import Header from './components/Header'
import Home from './components/Home'
import Store from './components/Store'
import Contact from './components/Contact'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import Payment from './components/Payment'
import Confirmation from './components/Confirmation'
import TelegramGate from './components/TelegramGate'

const CART_STORAGE_KEY = 'sleksar_cart'
const CONTACT_STATUS_KEY = 'sleksar_contact_status' // sessionStorage: 'declined' once acknowledged this visit

function loadStoredCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function App() {
  const [page, setPage] = useState('home') // home | store | contact | cart | checkout | payment | confirmation
  const [storeAnchor, setStoreAnchor] = useState(null)
  const [cart, setCart] = useState(loadStoredCart)
  const [telegramToken, setTelegramToken] = useState(null)
  const [telegramDeclined, setTelegramDeclined] = useState(false)
  const [gateResolved, setGateResolved] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [orderTotal, setOrderTotal] = useState(0)

  // Read the ?token=... from the URL (from the personalized shop link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      setTelegramToken(token)
      setGateResolved(true)
      sessionStorage.removeItem(CONTACT_STATUS_KEY)
      return
    }
    // No token in the URL this load — check if they already acknowledged
    // skipping Telegram earlier in this browser session, so we don't
    // ask twice.
    if (sessionStorage.getItem(CONTACT_STATUS_KEY) === 'declined') {
      setTelegramDeclined(true)
      setGateResolved(true)
    }
  }, [])

  // Persist the cart so it survives a full page reload — including the
  // reload that happens when someone leaves for Telegram and comes back
  // via a fresh link.
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    } catch {
      // ignore storage errors (e.g. private browsing)
    }
  }, [cart])

  function resolveGate(result) {
    if (result === 'declined') {
      sessionStorage.setItem(CONTACT_STATUS_KEY, 'declined')
      setTelegramDeclined(true)
    }
    setGateResolved(true)
  }

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

  if (!gateResolved) {
    return <TelegramGate onResolve={resolveGate} />
  }

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
          telegramDeclined={telegramDeclined}
          onOrderCreated={(id, total) => {
            setOrderId(id)
            setOrderTotal(total)
            setCart([])
            navigate('payment')
          }}
        />
      )}

      {page === 'payment' && (
        <Payment orderId={orderId} total={orderTotal} onSubmitted={() => navigate('confirmation')} />
      )}

      {page === 'confirmation' && <Confirmation orderId={orderId} telegramDeclined={telegramDeclined} />}

      {page === 'store' && cartCount > 0 && (
        <div className="mobile-cart-bar">
          <span className="total">Cart: ${cartTotal.toFixed(2)}</span>
          <button onClick={() => navigate('cart')}>View Cart</button>
        </div>
      )}
    </>
  )
}
