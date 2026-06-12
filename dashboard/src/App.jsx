import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Navbar from './components/Navbar'
import ProductCRUD from './pages/Admin/ProductCRUD'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Receipt from './pages/Receipt'

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

      </Routes>
    </div>
  )
}

export default App
