import { useState } from 'react'

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

      {/* Replace this placeholder with your actual ABA/Wing QR image */}
      <div
        style={{
          border: '3px solid #0a0a0a',
          borderRadius: 4,
          aspectRatio: '1 / 1',
          maxWidth: 260,
          margin: '0 auto 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: 13,
          textAlign: 'center',
          padding: 16,
        }}
      >
        [ Your payment QR code goes here — upload it as a static image ]
      </div>

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
