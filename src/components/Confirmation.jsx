export default function Confirmation({ orderId }) {
  const logoUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/branding/sleksar.jpg`
  return (
    <div className="container page-section" style={{ textAlign: 'center' }}>
      <img src={logoUrl} alt="Slek Sar" style={{ height: 60, margin: '0 auto 16px' }} />
      <h1 className="section-title">Thank you!</h1>
      <div className="status-banner success">
        Your payment proof has been submitted for order #{orderId?.slice(0, 8).toUpperCase()}.
      </div>
      <p style={{ marginTop: 12, color: '#555' }}>
        We'll verify your payment and send a confirmation message via Telegram shortly.
        You'll also receive your order summary there if you haven't already.
      </p>
    </div>
  )
}
