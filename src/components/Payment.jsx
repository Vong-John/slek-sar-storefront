import { useState } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const QR_URL = `${SUPABASE_URL}/storage/v1/object/public/product-images/branding/Payment.jpg`

export default function Payment({ orderId, total, onSubmitted }) {
  const [file, setFile] = useState(null)
  const [txRef, setTxRef] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) {
      setError('Please upload your payment screenshot.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const { uploadPaymentScreenshot, submitPaymentProof } = await import('../lib/supabase')
      const screenshotPath = await uploadPaymentScreenshot(file, orderId)
      await submitPaymentProof({
        order_id: orderId,
        screenshot_path: screenshotPath,
        transaction_ref: txRef.trim() || null,
      })
      onSubmitted()
    } catch (err) {
      setError(err.message || 'Something went wrong submitting your payment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container page-section">
      <h1 className="section-title">Pay for Your Order</h1>

      <div className="status-banner warn">
        Total to pay: <strong>${Number(total).toFixed(2)}</strong>
      </div>

      <div className="qr-code">
        <img src={QR_URL} alt="Scan with your banking app to pay via KHQR" />
      </div>
      <p className="qr-caption">Scan with your banking app (ABA, Wing, ACLEDA, etc.) to pay via KHQR</p>

      {error && <div className="status-banner error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Upload Payment Screenshot</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
        </div>
        <div className="form-field">
          <label>Transaction Reference (optional but helps verification)</label>
          <input value={txRef} onChange={(e) => setTxRef(e.target.value)} placeholder="e.g. ABA123456" />
        </div>
        <button className="primary-btn" type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Payment Proof'}
        </button>
      </form>
    </div>
  )
}
