import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { Navbar } from './components/layout/Navbar.jsx'
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx'

import { Home }           from './pages/Home.jsx'
import { ListingDetail }  from './pages/ListingDetail.jsx'
import { CreateListing }  from './pages/CreateListing.jsx'
import { Profile }        from './pages/Profile.jsx'
import { Login, Register } from './pages/Auth.jsx'

 
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/"            element={<Home />} />
            <Route path="/listings/:id" element={<ListingDetail />} />
            <Route path="/login"       element={<Login />} />
            <Route path="/register"    element={<Register />} />

            {/* Protected — must be logged in */}
            <Route path="/create" element={
              <ProtectedRoute><CreateListing /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App