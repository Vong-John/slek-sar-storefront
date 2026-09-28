import { useState } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Saves the customer's "yes, send me announcements" choice. Fire-and-forget:
// if this fails, the order itself must not be affected.
async function saveMarketingOptIn(token) {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/set-marketing-opt-in`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, opt_in: true }),
    })
  } catch (err) {
    console.error('Could not save announcement preference:', err)
  }
}

export default function Checkout({ cart, telegramToken, onOrderCreated }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [wantsUpdates, setWantsUpdates] = useState(false) // unticked by default — real consent
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const canSubmit = name.trim() && phone.trim() && address.trim() && !submitting

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const { createOrder } = await import('../lib/supabase')
      const result = await createOrder({
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_address: address.trim(),
        telegram_access_token: telegramToken || undefined,
        items: cart.map((item) => ({ product_id: item.id, quantity: item.qty })),
      })

      // Only ever send "yes". An unticked box does nothing, so it can't
      // undo a "yes" the customer gave earlier.
      if (wantsUpdates && telegramToken) saveMarketingOptIn(telegramToken)

      onOrderCreated(result.order_id, result.total)
    } catch (err) {
      setError(err.message || 'Something went wrong creating your order.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container page-section">
      <h1 className="section-title">Your Details</h1>

      {!telegramToken && (
        <div className="status-banner warn">
          You didn't come in through our Telegram bot link, so we won't be able to send your invoice there.
          <br />
          <a href="https://t.me/sleksar_bot" style={{ textDecoration: 'underline', fontWeight: 700 }}>
            Tap here to start the bot first
          </a>
        </div>
      )}

      {error && <div className="status-banner error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Full Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
        </div>
        <div className="form-field">
          <label>Phone Number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="012 345 678" required />
        </div>
        <div className="form-field">
          <label>Delivery Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street, area, city"
            rows={3}
            required
          />
        </div>

        {telegramToken && (
          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', margin: '0.75rem 0' }}>
            <input
              type="checkbox"
              checked={wantsUpdates}
              onChange={(e) => setWantsUpdates(e.target.checked)}
              style={{ marginTop: '0.25rem' }}
            />
            <span>Tell me on Telegram when new plants arrive or come back in stock.</span>
          </label>
        )}

        <button className="primary-btn" type="submit" disabled={!canSubmit}>
          {submitting ? 'Placing order…' : 'Place Order'}
        </button>
      </form>
    </div>
  )
}
