import { useState } from 'react'
import { signIn, getAdminProfile, signOut } from '../lib/adminApi'

export default function Login({ onSignedIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(email.trim(), password)
      const profile = await getAdminProfile()
      if (!profile) {
        // Signed in successfully, but not on the admin allowlist. Sign
        // them back out so they aren't left in a half-authenticated state.
        await signOut()
        setError('That account doesn\u2019t have admin access.')
        return
      }
      onSignedIn(profile)
    } catch (err) {
      setError(err.message || 'Could not sign in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ad-login">
      <form className="ad-login-card" onSubmit={handleSubmit}>
        <div className="ad-login-brand">Slek Sar</div>
        <h1 className="ad-login-title">Staff sign in</h1>

        {error && <div className="ad-alert ad-alert-error">{error}</div>}

        <div className="ad-field">
          <label htmlFor="ad-email">Email</label>
          <input
            id="ad-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div className="ad-field">
          <label htmlFor="ad-password">Password</label>
          <input
            id="ad-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button className="ad-btn ad-btn-primary ad-btn-block" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
