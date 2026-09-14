import { useState } from 'react'

const BOT_LINK = 'https://t.me/sleksar_bot'

// Shown once per visit, before the customer starts browsing. Two honest
// paths: start the bot (best experience — order updates + PDF summary
// land in Telegram automatically), or continue anyway with a real,
// explicit acknowledgement that they won't get an order summary.
// We never silently let people through without knowing which case they're in.
export default function TelegramGate({ onResolve }) {
  const [checked, setChecked] = useState(false)

  function startTelegram() {
    window.location.href = BOT_LINK
  }

  function continueWithoutTelegram() {
    if (!checked) return
    onResolve('declined')
  }

  return (
    <div className="gate-overlay">
      <div className="gate-card">
        <div className="gate-eyebrow">Hey there 👋</div>
        <h2 className="gate-title">We noticed you haven't started our Telegram bot yet</h2>
        <p className="gate-body">
          It only takes a few seconds, and it's how we send you your order summary and
          delivery updates. Without it, we won't be able to deliver your order summary to you.
        </p>

        <button className="gate-primary-btn" onClick={startTelegram}>
          Start on Telegram
        </button>

        <div className="gate-divider">
          <span>or</span>
        </div>

        <label className="gate-checkbox-row">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <span>
            I understand — if I continue without Telegram, I <strong>won't receive my order
            summary</strong>.
          </span>
        </label>

        <button
          className="gate-secondary-btn"
          disabled={!checked}
          onClick={continueWithoutTelegram}
        >
          Continue without Telegram
        </button>
      </div>
    </div>
  )
}
