import { useEffect, useState } from 'react'
import { fetchAllProducts, saveProduct, deleteProduct, uploadProductImage, notifyProducts } from '../lib/adminApi'

const CATEGORIES = [
  { id: 'indoor', label: 'Indoor Plants' },
  { id: 'outdoor', label: 'Outdoor Plants' },
  { id: 'gift', label: 'Gift' },
]

const EMPTY = {
  id: null,
  title: '',
  description: '',
  selling_price: '',
  cost_price: '',
  stock_qty: '0',
  category: 'indoor',
  images: [],
  is_active: true,
}

function money(n) {
  return `$${Number(n ?? 0).toFixed(2)}`
}

export default function ProductManager({ adminId }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)

  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [notifying, setNotifying] = useState(null) // 'new' | 'restock' | null
  const [notifyResult, setNotifyResult] = useState(null)
  const [notifyError, setNotifyError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setProducts(await fetchAllProducts())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (editing) {
    return (
      <ProductForm
        initial={editing}
        adminId={adminId}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          load()
        }}
      />
    )
  }

  const lowStock = products.filter((p) => p.is_active && Number(p.stock_qty) <= 2)

  // Products the announce picker is allowed to show/select. Hidden/inactive
  // products (including test items like "Reject Flow Test") must never be
  // selectable here — they can still be viewed/edited in the normal grid.
  const announceableProducts = products.filter((p) => p.is_active)

  function toggleSelectMode() {
    setSelectMode((v) => !v)
    setSelectedIds([])
    setNotifyResult(null)
    setNotifyError(null)
  }

  function toggleSelected(id) {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  }

  async function handleAnnounce(type) {
    if (selectedIds.length === 0) return
    setNotifying(type)
    setNotifyError(null)
    setNotifyResult(null)
    try {
      const result = await notifyProducts(selectedIds, type, adminId)
      setNotifyResult(result)
      setSelectedIds([])
    } catch (err) {
      setNotifyError(err.message)
    } finally {
      setNotifying(null)
    }
  }

  const visibleProducts = selectMode ? announceableProducts : products

  return (
    <div className="ad-page">
      <div className="ad-page-head">
        <h1 className="ad-page-title">Products</h1>
        <div className="ad-actions-row">
          <button className="ad-btn ad-btn-quiet" onClick={toggleSelectMode}>
            {selectMode ? 'Cancel selecting' : 'Select to announce'}
          </button>
          {!selectMode && (
            <button className="ad-btn ad-btn-primary" onClick={() => setEditing({ ...EMPTY })}>
              Add product
            </button>
          )}
        </div>
      </div>

      {error && <div className="ad-alert ad-alert-error">{error}</div>}
      {notifyError && <div className="ad-alert ad-alert-error">{notifyError}</div>}
      {notifyResult && !notifyResult.skipped && (
        <div className="ad-alert ad-alert-ok">
          Sent to {notifyResult.notified} of {notifyResult.total} subscribers.
        </div>
      )}
      {notifyResult?.skipped && <div className="ad-alert ad-alert-warn">{notifyResult.skipped}</div>}

      {lowStock.length > 0 && (
        <div className="ad-alert ad-alert-warn">
          Running low: {lowStock.map((p) => `${p.title} (${p.stock_qty})`).join(', ')}
        </div>
      )}

      {selectMode && (
        <div className="ad-hint" style={{ marginBottom: '0.5rem' }}>
          Only visible, in-shop products can be announced. Hidden/test products are excluded automatically.
        </div>
      )}

      {loading && <div className="ad-muted">Loading products…</div>}

      {!loading && !error && products.length === 0 && (
        <div className="ad-empty">No products yet. Add your first one to open the shop.</div>
      )}

      {!loading && !error && selectMode && announceableProducts.length === 0 && (
        <div className="ad-empty">No visible products to announce right now.</div>
      )}

      <div className="ad-prod-grid">
        {visibleProducts.map((p) => {
          const checked = selectedIds.includes(p.id)
          return (
            <div key={p.id} className={`ad-prod ${selectMode && checked ? 'is-selected' : ''}`}>
              {selectMode && (
                <label className="ad-prod-check" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={checked} onChange={() => toggleSelected(p.id)} />
                </label>
              )}
              <button
                className="ad-prod-body"
                onClick={() => (selectMode ? toggleSelected(p.id) : setEditing({ ...EMPTY, ...p }))}
              >
                <div className="ad-prod-thumb">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt="" />
                  ) : (
                    <span className="ad-prod-nophoto">No photo</span>
                  )}
                </div>
                <div className="ad-prod-info">
                  <div className="ad-prod-title">{p.title}</div>
                  <div className="ad-prod-meta">
                    <span>{money(p.selling_price)}</span>
                    <span className={Number(p.stock_qty) <= 0 ? 'ad-warn' : ''}>{p.stock_qty} in stock</span>
                  </div>
                  {!p.is_active && <span className="ad-pill ad-pill-hidden">Hidden</span>}
                </div>
              </button>
            </div>
          )
        })}
      </div>

      {selectMode && selectedIds.length > 0 && (
        <div className="ad-bar-actions">
          <span className="ad-muted">{selectedIds.length} selected</span>
          <button
            className="ad-btn ad-btn-primary"
            onClick={() => handleAnnounce('new')}
            disabled={notifying !== null}
          >
            {notifying === 'new' ? 'Sending…' : 'Announce new arrivals'}
          </button>
          <button
            className="ad-btn ad-btn-primary"
            onClick={() => handleAnnounce('restock')}
            disabled={notifying !== null}
          >
            {notifying === 'restock' ? 'Sending…' : 'Announce back in stock'}
          </button>
        </div>
      )}
    </div>
  )
}

function ProductForm({ initial, adminId, onCancel, onSaved }) {
  const [form, setForm] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isNew = !form.id

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const url = await uploadProductImage(file)
      set('images', [...(form.images ?? []), url])
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function removeImage(url) {
    set('images', (form.images ?? []).filter((u) => u !== url))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.title.trim()) return setError('Give the product a name.')
    if (form.selling_price === '' || Number(form.selling_price) < 0) {
      return setError('Set a selling price.')
    }
    setBusy(true)
    setError(null)
    try {
      await saveProduct(form)
      // Notifications are now manual — use "Select to announce" in the
      // product grid instead of auto-firing here.
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return setConfirmDelete(true)
    setBusy(true)
    try {
      await deleteProduct(form.id)
      onSaved()
    } catch (err) {
      setError(err.message)
      setBusy(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="ad-page">
      <div className="ad-page-head">
        <h1 className="ad-page-title">{isNew ? 'Add product' : 'Edit product'}</h1>
        <button className="ad-btn ad-btn-quiet" onClick={onCancel}>
          Cancel
        </button>
      </div>

      {error && <div className="ad-alert ad-alert-error">{error}</div>}

      <form onSubmit={handleSave} className="ad-form">
        <div className="ad-field">
          <label htmlFor="p-title">Name</label>
          <input id="p-title" value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </div>

        <div className="ad-field">
          <label htmlFor="p-desc">Description</label>
          <textarea
            id="p-desc"
            rows={3}
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Light, watering, pot size — whatever helps someone choose."
          />
        </div>

        <div className="ad-field-row">
          <div className="ad-field">
            <label htmlFor="p-price">Selling price ($)</label>
            <input
              id="p-price"
              type="number"
              step="0.01"
              min="0"
              value={form.selling_price}
              onChange={(e) => set('selling_price', e.target.value)}
              required
            />
          </div>
          <div className="ad-field">
            <label htmlFor="p-cost">Cost price ($)</label>
            <input
              id="p-cost"
              type="number"
              step="0.01"
              min="0"
              value={form.cost_price ?? ''}
              onChange={(e) => set('cost_price', e.target.value)}
              placeholder="Optional"
            />
            <div className="ad-hint">Never shown to customers.</div>
          </div>
        </div>

        <div className="ad-field-row">
          <div className="ad-field">
            <label htmlFor="p-stock">Stock</label>
            <input
              id="p-stock"
              type="number"
              min="0"
              value={form.stock_qty}
              onChange={(e) => set('stock_qty', e.target.value)}
            />
          </div>
          <div className="ad-field">
            <label htmlFor="p-cat">Category</label>
            <select id="p-cat" value={form.category ?? ''} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="ad-field">
          <label>Photos</label>
          <div className="ad-photos">
            {(form.images ?? []).map((url) => (
              <div key={url} className="ad-photo">
                <img src={url} alt="" />
                <button type="button" className="ad-photo-x" onClick={() => removeImage(url)} aria-label="Remove photo">
                  ×
                </button>
              </div>
            ))}
            <label className="ad-photo-add">
              <input type="file" accept="image/*" onChange={handleUpload} hidden />
              {uploading ? 'Uploading…' : '+ Add photo'}
            </label>
          </div>
          <div className="ad-hint">The first photo is the one customers see in the shop grid.</div>
        </div>

        <label className="ad-check">
          <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
          <span>Show this product in the shop</span>
        </label>

        <div className="ad-form-actions">
          <button className="ad-btn ad-btn-primary" type="submit" disabled={busy || uploading}>
            {busy ? 'Saving…' : isNew ? 'Add product' : 'Save changes'}
          </button>
          {!isNew && (
            <button
              type="button"
              className={confirmDelete ? 'ad-btn ad-btn-reject-armed' : 'ad-btn ad-btn-reject'}
              onClick={handleDelete}
              disabled={busy}
            >
              {confirmDelete ? 'Tap again to delete' : 'Delete'}
            </button>
          )}
        </div>
        {!isNew && (
          <div className="ad-hint">
            To take something off the shop without losing its order history, untick "Show this product" instead of
            deleting.
          </div>
        )}
      </form>
    </div>
  )
}
