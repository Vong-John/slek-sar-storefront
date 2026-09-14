export default function Confirmation({ orderId, telegramDeclined }) {
  const logoUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/branding/sleksar.jpg`
  return (
    <div className="container page-section" style={{ textAlign: 'center' }}>
      <img src={logoUrl} alt="Slek Sar" style={{ height: 60, margin: '0 auto 16px' }} />
      <h1 className="section-title">Thank you!</h1>
      <div className="status-banner success">
        Your payment proof has been submitted for order #{orderId?.slice(0, 8).toUpperCase()}.
      </div>
      {telegramDeclined ? (
        <p style={{ marginTop: 12, color: '#555' }}>
          We'll verify your payment and prepare your order. Since you continued without
          Telegram, you won't receive an automatic order summary — hang on to your order
          number above.
        </p>
      ) : (
        <p style={{ marginTop: 12, color: '#555' }}>
          We'll verify your payment and send a confirmation message via Telegram shortly.
          You'll also receive your order summary there if you haven't already.
        </p>
      )}
    </div>
  )
}
