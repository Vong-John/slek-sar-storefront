export default function ProductCard({ product, onAddToCart }) {
  const outOfStock = product.stock_qty <= 0
  const image = product.images?.[0]

  return (
    <div className="product-card">
      <div className="image-frame">
        {image ? (
          <img src={image} alt={product.title} loading="lazy" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 12 }}>
            No image
          </div>
        )}
      </div>
      <div className="info-block">
        <div className="p-title">{product.title}</div>
        {product.description && <div className="p-desc">{product.description}</div>}
        <div className="p-price">${Number(product.selling_price).toFixed(2)}</div>
        {outOfStock && <div className="p-stock">Out of stock</div>}
        <button
          className="add-to-cart-btn"
          disabled={outOfStock}
          onClick={() => onAddToCart(product)}
        >
          {outOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
