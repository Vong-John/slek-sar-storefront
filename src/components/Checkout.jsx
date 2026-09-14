import { useState } from 'react'

export default function Checkout({ cart, telegramToken, telegramDeclined, onOrderCreated }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
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
        // Lets you tell "no Telegram, customer was warned and chose this"
        // apart from a silent drop-off, once the create-order function and
        // orders table have a place to store it.
        telegram_declined: telegramDeclined || undefined,
        items: cart.map((item) => ({ product_id: item.id, quantity: item.qty })),
      })
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

      {telegramDeclined && (
        <div className="status-banner warn">
          Just a reminder — since you're continuing without Telegram, you won't receive an
          order summary or delivery updates for this order.
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
        <button className="primary-btn" type="submit" disabled={!canSubmit}>
          {submitting ? 'Placing order…' : 'Place Order'}
        </button>
      </form>
    </div>
  )
}
