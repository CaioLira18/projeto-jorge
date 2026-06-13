import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './css/Login.css'
import './css/Register.css'
import './css/Home.css'
import './css/Products.css'
import './css/Orders.css'
import './css/ProductCRUD.css'
import './css/AdminDashboard.css'
import './css/PaginaRestrita.css'

import App from './App'
import { AuthProvider, CartProvider, ToastProvider } from './pages/Index'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
