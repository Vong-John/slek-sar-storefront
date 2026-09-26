import { useEffect, useState } from 'react'
import { getSession, getAdminProfile, signOut } from '../lib/adminApi'
import Login from './Login'
import OrderQueue from './OrderQueue'
import ProductManager from './ProductManager'
import './admin.css'

export default function AdminApp() {
  const [profile, setProfile] = useState(null)
  const [checking, setChecking] = useState(true)
  const [tab, setTab] = useState('orders')

  useEffect(() => {
    let cancelled = false
    async function restore() {
      const session = await getSession()
      if (!session) {
        if (!cancelled) setChecking(false)
        return
      }
      const p = await getAdminProfile()
      if (cancelled) return
      setProfile(p)
      setChecking(false)
    }
    restore()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSignOut() {
    await signOut()
    setProfile(null)
    setTab('orders')
  }

  if (checking) {
    return (
      <div className="ad-boot">
        <span className="ad-muted">Loading…</span>
      </div>
    )
  }

  if (!profile) {
    return <Login onSignedIn={setProfile} />
  }

  return (
    <div className="ad-shell">
      <header className="ad-bar">
        <div className="ad-bar-inner">
          <div className="ad-bar-brand">
            Slek Sar <span className="ad-bar-sub">Staff</span>
          </div>
          <nav className="ad-bar-nav">
            <button className={tab === 'orders' ? 'is-active' : ''} onClick={() => setTab('orders')}>
              Orders
            </button>
            <button className={tab === 'products' ? 'is-active' : ''} onClick={() => setTab('products')}>
              Products
            </button>
          </nav>
          <div className="ad-bar-user">
            <span className="ad-bar-who">{profile.full_name || profile.email}</span>
            <button className="ad-btn ad-btn-quiet ad-btn-sm" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="ad-main">
        {tab === 'orders' ? <OrderQueue adminId={profile.user_id} /> : <ProductManager adminId={profile.user_id} />}
      </main>
    </div>
  )
}
