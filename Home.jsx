export default function Home({ onNavigate }) {
  return (
    <div className="container">
      <section className="hero">
        <div>
          <div className="hero-eyebrow">Slek Sar — grown & delivered in Cambodia</div>
          <h1>Houseplants that fit your space</h1>
          <p>
            Indoor plants, outdoor greenery, and gift-ready arrangements — order online,
            pay by QR, and get delivery updates straight to Telegram.
          </p>
          <button className="hero-cta" onClick={() => onNavigate('store')}>
            Shop the collection
          </button>
        </div>
        <div className="hero-emoji">🌿</div>
      </section>

      <section className="home-categories">
        <button className="home-cat-card" onClick={() => onNavigate('store', 'indoor')}>
          <span className="home-cat-icon">🪴</span>
          <span className="home-cat-label">Indoor Plants</span>
        </button>
        <button className="home-cat-card" onClick={() => onNavigate('store', 'outdoor')}>
          <span className="home-cat-icon">🌳</span>
          <span className="home-cat-label">Outdoor Plants</span>
        </button>
        <button className="home-cat-card" onClick={() => onNavigate('store', 'gift')}>
          <span className="home-cat-icon">🎁</span>
          <span className="home-cat-label">Gift</span>
        </button>
      </section>
    </div>
  )
}
