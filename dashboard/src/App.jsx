import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Navbar from './components/Navbar'
import ProductCRUD from './pages/Admin/ProductCRUD'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Receipt from './pages/Receipt'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Orders from './pages/Orders'

function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/produtos" element={<ProductCRUD />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/receipt/:orderId" element={<Receipt />} />
        <Route path="/produtos" element={<Products />} />
        <Route path="/produtos/:id" element={<ProductDetail />} />
        <Route path="/orders/:id" element={<Orders />} />
      </Routes>
    </div>
  )
}

export default App
