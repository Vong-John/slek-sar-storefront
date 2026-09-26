import { useEffect, useState } from 'react'
import { fetchOrders, fetchPaymentProof, reviewPayment, resetOrder, terminateOrder } from '../lib/adminApi'

const MAX_ATTEMPTS = 3 // mirrors the cap in review-payment — for display only

const FILTERS = [
  { id: 'pending_verification', label: 'Needs review' },
  { id: 'pending_payment', label: 'Awaiting payment' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'payment_rejected', label: 'Rejected' },
  { id: null, label: 'All' },
]

const STATUS_LABELS = {
  pending_info: 'Pending info',
  pending_payment: 'Awaiting payment',
  pending_verification: 'Needs review',
  confirmed: 'Confirmed',
  payment_rejected: 'Rejected',
  cancelled: 'Cancelled',
}

function money(n) {
  return `$${Number(n ?? 0).toFixed(2)}`
}

function whenShort(iso) {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export default function OrderQueue({ adminId }) {
  const [filter, setFilter] = useState('pending_verification')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openId, setOpenId] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setOrders(await fetchOrders(filter))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    setOpenId(null)
  }, [filter])

  return (
    <div className="ad-page">
      <div className="ad-page-head">
        <h1 className="ad-page-title">Orders</h1>
        <button className="ad-btn ad-btn-quiet" onClick={load} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="ad-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            className={`ad-tab ${filter === f.id ? 'is-active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="ad-alert ad-alert-error">{error}</div>}

      {loading && <div className="ad-muted">Loading orders…</div>}

      {!loading && !error && orders.length === 0 && (
        <div className="ad-empty">
          {filter === 'pending_verification'
            ? 'Nothing waiting on you. New payments will appear here.'
            : 'No orders in this view.'}
        </div>
      )}

      <div className="ad-order-list">
        {orders.map((order) => (
          <OrderRow
            key={order.id}
            order={order}
            adminId={adminId}
            open={openId === order.id}
            onToggle={() => setOpenId(openId === order.id ? null : order.id)}
            onReviewed={load}
          />
        ))}
      </div>
    </div>
  )
}

function OrderRow({ order, adminId, open, onToggle, onReviewed }) {
  const code = order.id.slice(0, 8).toUpperCase()

  return (
    <div className={`ad-order ${open ? 'is-open' : ''}`}>
      <button className="ad-order-head" onClick={onToggle}>
        <div className="ad-order-head-main">
          <span className="ad-order-code">#{code}</span>
          <span className="ad-order-name">{order.customer_name}</span>
        </div>
        <div className="ad-order-head-meta">
          {order.failed_payment_count > 0 && (
            <span className="ad-pill ad-pill-payment_rejected">
              {order.failed_payment_count}/{MAX_ATTEMPTS} attempts
            </span>
          )}
          <span className={`ad-pill ad-pill-${order.status}`}>{STATUS_LABELS[order.status] ?? order.status}</span>
          <span className="ad-order-total">{money(order.total)}</span>
          <span className="ad-order-when">{whenShort(order.created_at)}</span>
        </div>
      </button>

      {open && <OrderDetail order={order} adminId={adminId} onReviewed={onReviewed} />}
    </div>
  )
}

function OrderDetail({ order, adminId, onReviewed }) {
  const [proof, setProof] = useState(null)
  const [proofState, setProofState] = useState('loading') // loading | ready | none | error
  const [busy, setBusy] = useState(null) // 'confirm' | 'reject'
  const [actionError, setActionError] = useState(null)
  const [confirmingReject, setConfirmingReject] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [terminating, setTerminating] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchPaymentProof(order.id)
      .then((p) => {
        if (cancelled) return
        setProof(p)
        setProofState(p ? 'ready' : 'none')
      })
      .catch(() => {
        if (!cancelled) setProofState('error')
      })
    return () => {
      cancelled = true
    }
  }, [order.id])

  // A proof already reviewed (confirmed/rejected) shouldn't offer the
  // buttons again — review-payment doesn't check this itself, so the
  // guard lives here to prevent an accidental double stock-decrement.
  const canReview = proofState === 'ready' && proof?.status === 'pending'

  async function act(action) {
    if (!proof) return
    if (action === 'reject' && !confirmingReject) {
      setConfirmingReject(true)
      return
    }
    setBusy(action)
    setActionError(null)
    try {
      await reviewPayment(order.id, proof.id, action, adminId)
      onReviewed()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy(null)
      setConfirmingReject(false)
    }
  }

  async function handleReset() {
    setResetting(true)
    setActionError(null)
    try {
      await resetOrder(order.id, adminId)
      onReviewed()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setResetting(false)
    }
  }

  async function handleTerminate() {
    setTerminating(true)
    setActionError(null)
    try {
      await terminateOrder(order.id, adminId)
      onReviewed()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setTerminating(false)
    }
  }

  return (
    <div className="ad-order-body">
      <div className="ad-order-cols">
        <div className="ad-order-col">
          <h3 className="ad-sub">Customer</h3>
          <dl className="ad-dl">
            <dt>Phone</dt>
            <dd>
              <a href={`tel:${order.customer_phone}`}>{order.customer_phone}</a>
            </dd>
            <dt>Address</dt>
            <dd>{order.customer_address}</dd>
            <dt>Telegram</dt>
            <dd>
              {order.telegram_chat_id ? (
                <span className="ad-ok">Linked</span>
              ) : order.telegram_declined ? (
                <span className="ad-warn">Declined — no auto updates</span>
              ) : (
                <span className="ad-warn">Not linked</span>
              )}
            </dd>
          </dl>

          <h3 className="ad-sub">Items</h3>
          <table className="ad-items">
            <tbody>
              {(order.order_items ?? []).map((item, i) => (
                <tr key={i}>
                  <td>{item.products?.title ?? 'Item'}</td>
                  <td className="ad-num">×{item.quantity}</td>
                  <td className="ad-num">{money(item.price_at_order * item.quantity)}</td>
                </tr>
              ))}
              <tr className="ad-items-sub">
                <td>Delivery</td>
                <td />
                <td className="ad-num">{money(order.delivery_fee)}</td>
              </tr>
              <tr className="ad-items-total">
                <td>Total</td>
                <td />
                <td className="ad-num">{money(order.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="ad-order-col">
          <h3 className="ad-sub">Payment proof</h3>
          {proofState === 'loading' && <div className="ad-muted">Loading screenshot…</div>}
          {proofState === 'none' && <div className="ad-muted">No screenshot uploaded yet.</div>}
          {proofState === 'error' && <div className="ad-alert ad-alert-error">Couldn't load the screenshot.</div>}
          {proofState === 'ready' && proof && (
            <>
              {proof.transaction_ref && (
                <div className="ad-txref">
                  Reference: <strong>{proof.transaction_ref}</strong>
                </div>
              )}
              <a href={proof.url} target="_blank" rel="noreferrer" className="ad-proof">
                <img src={proof.url} alt={`Payment screenshot for order ${order.id.slice(0, 8)}`} />
              </a>
              <div className="ad-hint">Tap the image to open it full size.</div>
              {proof.status !== 'pending' && (
                <div className="ad-reviewed">
                  Already marked <strong>{proof.status}</strong>
                  {proof.reviewed_at ? ` on ${new Date(proof.reviewed_at).toLocaleString()}` : ''}.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {canReview && (
        <div className="ad-actions">
          {actionError && <div className="ad-alert ad-alert-error">{actionError}</div>}

          <div className="ad-actions-row">
            <button className="ad-btn ad-btn-confirm" onClick={() => act('confirm')} disabled={busy !== null}>
              {busy === 'confirm' ? 'Confirming…' : 'Confirm payment'}
            </button>
            <button
              className={`ad-btn ${confirmingReject ? 'ad-btn-reject-armed' : 'ad-btn-reject'}`}
              onClick={() => act('reject')}
              disabled={busy !== null}
            >
              {busy === 'reject' ? 'Rejecting…' : confirmingReject ? 'Tap again to reject' : 'Reject'}
            </button>
          </div>
          <div className="ad-hint">
            Confirming reduces stock and messages the customer on Telegram.
            {order.failed_payment_count >= MAX_ATTEMPTS - 1 &&
              " Rejecting now will use their last retry — they'll be told to contact you directly instead."}
          </div>
        </div>
      )}

      {order.status === 'payment_rejected' && order.failed_payment_count >= MAX_ATTEMPTS && (
        <div className="ad-actions">
          {actionError && <div className="ad-alert ad-alert-error">{actionError}</div>}
          <button className="ad-btn ad-btn-quiet" onClick={handleReset} disabled={resetting}>
            {resetting ? 'Resetting…' : 'Reset order (allow retry)'}
          </button>
          <div className="ad-hint">Clears the reject count and lets the customer submit a new payment.</div>
        </div>
      )}

      {order.status === 'payment_rejected' && (
        <div className="ad-actions">
          {actionError && <div className="ad-alert ad-alert-error">{actionError}</div>}
          <button className="ad-btn ad-btn-quiet" onClick={handleTerminate} disabled={terminating}>
            {terminating ? 'Terminating…' : 'Terminate (let them /start fresh)'}
          </button>
          <div className="ad-hint">
            Closes this order permanently. Customer can send /start to begin a brand new order.
          </div>
        </div>
      )}
    </div>
  )
}
