import { useState } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const LOGO_URL = `${SUPABASE_URL}/storage/v1/object/public/product-images/branding/sleksar.jpg`

const CATEGORIES = [
  { id: 'indoor', label: 'Indoor Plants', icon: '🪴' },
  { id: 'outdoor', label: 'Outdoor Plants', icon: '🌳' },
  { id: 'gift', label: 'Gift', icon: '🎁' },
]

export default function Header({ page, onNavigate, cartCount, onCartClick }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [storeAccordionOpen, setStoreAccordionOpen] = useState(false)

  function navigate(target, anchor) {
    onNavigate(target, anchor)
    setDrawerOpen(false)
  }

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <button className="hamburger" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <span></span><span></span><span></span>
          </button>

          <div className="brand" onClick={() => navigate('home')} style={{ cursor: 'pointer' }}>
            <img src={LOGO_URL} alt="Slek Sar" />
            Slek Sar
          </div>

          <nav className="main-nav">
            <button className={page === 'home' ? 'active' : ''} onClick={() => navigate('home')}>
              Home
            </button>
            <div className="nav-item nav-item-hover">
              <button className={page === 'store' ? 'active' : ''} onClick={() => navigate('store')}>
                Store <span className="caret"></span>
              </button>
              <div className="mega-panel">
                {CATEGORIES.map((c) => (
                  <button key={c.id} className="mega-tile" onClick={() => navigate('store', c.id)}>
                    <span className="mega-tile-icon">{c.icon}</span>
                    <span className="mega-tile-label">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <button className={page === 'contact' ? 'active' : ''} onClick={() => navigate('contact')}>
              Contact
            </button>
          </nav>

          <button className="cart-btn" onClick={onCartClick}>
            Cart {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>
        </div>
      </header>

      <div className={`drawer-overlay ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)} />
      <div className={`drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-head">
          <img src={LOGO_URL} alt="Slek Sar" />
          <button className="drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">&times;</button>
        </div>

        <div className="drawer-item">
          <button className="drawer-item-head" onClick={() => navigate('home')}>Home</button>
        </div>

        <div className={`drawer-item ${storeAccordionOpen ? 'open' : ''}`}>
          <button className="drawer-item-head" onClick={() => setStoreAccordionOpen((o) => !o)}>
            Store <span className="drawer-caret"></span>
          </button>
          <div className="drawer-panel">
            <div className="drawer-tiles">
              {CATEGORIES.map((c) => (
                <button key={c.id} className="drawer-tile" onClick={() => navigate('store', c.id)}>
                  <span className="drawer-tile-icon">{c.icon}</span>
                  <span className="drawer-tile-label">{c.label}</span>
                </button>
              ))}
            </div>
            <ul className="drawer-links">
              <li><button onClick={() => navigate('store')}>Shop all plants</button></li>
            </ul>
          </div>
        </div>

        <div className="drawer-item">
          <button className="drawer-item-head" onClick={() => navigate('contact')}>Contact</button>
        </div>
      </div>
    </>
  )
}
