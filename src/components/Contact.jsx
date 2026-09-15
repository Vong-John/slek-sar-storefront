export default function Contact() {
  return (
    <div className="container page-section">
      <h1 className="section-title">Get in touch</h1>
      <div className="contact-card">
        <div className="contact-row">
          <span className="contact-icon">✈️</span>
          <div>
            Telegram<br />
            <a href="https://t.me/sleksar_bot" target="_blank" rel="noreferrer">@sleksar_bot</a>
          </div>
        </div>
        <div className="contact-row">
          <span className="contact-icon">📘</span>
          <div>
            Facebook<br />
            {/* TODO: replace with your real Facebook page URL */}
            <a href="https://web.facebook.com/sleksar" target="_blank" rel="noreferrer"> ស្លឹកសារ - Slek Sar</a>
          </div>
        </div>
        <div className="contact-row">
          <span className="contact-icon">📍</span>
          <div>
            Location<br />
            {/* TODO: replace with your real address */}
            Kampong Tralach Ler Village, Kampong Tralach Commune, Kampong Tralach Disctrict, Kampong Chhnang Provice.
          </div>
        </div>
      </div>
    </div>
  )
}
