const DELIVERY_FEE = 2.0

export default function Cart({ cart, onUpdateQty, onRemove, onCheckout }) {
  const subtotal = cart.reduce((sum, item) => sum + item.selling_price * item.qty, 0)
  const total = subtotal + (cart.length > 0 ? DELIVERY_FEE : 0)

  if (cart.length === 0) {
    return (
      <div className="container page-section">
        <h1 className="section-title">Your Cart</h1>
        <p>Your cart is empty — go add something you like.</p>
      </div>
    )
  }

  return (
    <div className="container page-section">
      <h1 className="section-title">Your Cart</h1>

      {cart.map((item) => (
        <div
          key={item.id}
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: '1px solid #eee',
          }}
        >
          <div style={{ width: 56, height: 56, border: '2px solid #0a0a0a', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
            {item.images?.[0] && <img src={item.images[0]} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{item.title}</div>
            <div style={{ fontSize: 13, color: '#666' }}>${Number(item.selling_price).toFixed(2)} each</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => onUpdateQty(item.id, item.qty - 1)} style={{ border: '1px solid #ccc', width: 28, height: 28, borderRadius: 4 }}>-</button>
            <span>{item.qty}</span>
            <button onClick={() => onUpdateQty(item.id, item.qty + 1)} style={{ border: '1px solid #ccc', width: 28, height: 28, borderRadius: 4 }}>+</button>
          </div>
          <button onClick={() => onRemove(item.id)} style={{ color: '#B3261E', fontSize: 13, fontWeight: 600 }}>Remove</button>
        </div>
      ))}

      <div style={{ marginTop: 20, fontSize: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span>Delivery Fee</span><span>${DELIVERY_FEE.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 17 }}>
          <span>Total</span><span>${total.toFixed(2)}</span>
        </div>
      </div>

      <button className="primary-btn" style={{ marginTop: 20 }} onClick={onCheckout}>
        Proceed to Checkout
      </button>
    </div>
  )
}
