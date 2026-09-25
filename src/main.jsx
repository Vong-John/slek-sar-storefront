import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Everything under /admin is the staff portal; everything else is the
// shop. The admin bundle is loaded lazily so customers never download
// it — it's dead weight for them, and it keeps the shop fast.
const isAdmin = window.location.pathname.startsWith('/admin')

const AdminApp = React.lazy(() => import('./admin/AdminApp.jsx'))

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? (
      <React.Suspense fallback={null}>
        <AdminApp />
      </React.Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>,
)
