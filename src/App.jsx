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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

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

// Notification links look like  /?tg=<chat_id>&link_sig=<signature>&section=new
// (link_sig, NOT token — ?token= is already used by the Telegram gate below).
function readNotificationLink() {
  const params = new URLSearchParams(window.location.search)
  const tg = params.get('tg')
  const sig = params.get('link_sig')
  return tg && sig ? { tg, sig } : null
}

// Asks the backend whether the link is genuine. Returns the customer info
// if it is, or null if it isn't (or the request failed).
async function verifyNotificationLink({ tg, sig }) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-customer-link`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: tg, token: sig }),
    })
    const data = await res.json()
    return data?.valid ? data : null
  } catch {
    return null
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

  // Verified customer from a notification link (null for everyone else).
  const [customer, setCustomer] = useState(null)
  // True while we're checking a notification link, so the Telegram gate
  // doesn't flash on screen for someone who's about to be let straight in.
  const [linkChecking, setLinkChecking] = useState(() => readNotificationLink() !== null)

  // Read the ?token=... (and, for the payment re-upload flow, ?order_id=...)
  // from the URL (from the personalized shop link / reject-flow link).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const orderIdParam = params.get('order_id')

    if (token) {
      setTelegramToken(token)
      setGateResolved(true)
      sessionStorage.removeItem(CONTACT_STATUS_KEY)

      if (orderIdParam) {
        // Arriving via a re-upload link (e.g. after a payment rejection).
        // Fetch the real order total instead of trusting orderTotal state,
        // which only ever gets set during a normal checkout flow and would
        // otherwise show as $0.00 here.
        import('./lib/supabase').then(({ fetchOrderTotal }) => {
          fetchOrderTotal(orderIdParam)
            .then((total) => {
              setOrderId(orderIdParam)
              setOrderTotal(total)
              setPage('payment')
            })
            .catch((err) => {
              console.error('Failed to fetch order total:', err)
              // Fallback: still send them to payment so they aren't
              // stranded on the home page, just without a prefilled total.
              setOrderId(orderIdParam)
              setPage('payment')
            })
        })
      }
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

  // Notification link (new arrivals / back in stock): if the signature checks
  // out, skip the Telegram gate and open the store page. If it doesn't, we do
  // nothing special and the visitor just sees the normal gate/home flow.
  useEffect(() => {
    const link = readNotificationLink()
    if (!link) return

    verifyNotificationLink(link)
      .then((result) => {
        if (!result) return
        setCustomer(result)
        setTelegramDeclined(false)
        sessionStorage.removeItem(CONTACT_STATUS_KEY)
        setGateResolved(true)
        setPage('store')
        setStoreAnchor(null)
      })
      .finally(() => setLinkChecking(false))
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

  // Brief wait while a notification link is being verified.
  if (linkChecking) {
    return <p style={{ padding: '2rem', textAlign: 'center' }}>Loading… 🌿</p>
  }

  if (!gateResolved) {
    return <TelegramGate onResolve={resolveGate} />
  }

  return (
    <>
      <Header page={page} onNavigate={navigate} cartCount={cartCount} onCartClick={() => navigate('cart')} />

      {page === 'home' && <Home onNavigate={navigate} />}

      {page === 'store' && <Store anchor={storeAnchor} onAddToCart={addToCart} customer={customer} />}

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
