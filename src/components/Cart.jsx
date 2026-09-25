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
        <div key={item.id} className="cart-item">
          <div className="cart-item-thumb">
            {item.images?.[0] && <img src={item.images[0]} alt={item.title} />}
          </div>
          <div className="cart-item-info">
            <div className="cart-item-title">{item.title}</div>
            <div className="cart-item-price">${Number(item.selling_price).toFixed(2)} each</div>
          </div>
          <div className="qty-control">
            <button onClick={() => onUpdateQty(item.id, item.qty - 1)}>−</button>
            <span>{item.qty}</span>
            <button onClick={() => onUpdateQty(item.id, item.qty + 1)}>+</button>
          </div>
          <button className="remove-btn" onClick={() => onRemove(item.id)}>Remove</button>
        </div>
      ))}

      <div className="cart-summary">
        <div className="cart-summary-row">
          <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="cart-summary-row">
          <span>Delivery Fee</span><span>${DELIVERY_FEE.toFixed(2)}</span>
        </div>
        <div className="cart-summary-row total">
          <span>Total</span><span>${total.toFixed(2)}</span>
        </div>
      </div>

      <button className="primary-btn" style={{ marginTop: 20 }} onClick={onCheckout}>
        Proceed to Checkout
      </button>
    </div>
  )
}
