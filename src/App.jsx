import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login from "./components/Login"
import Devices from "./components/device/Devices"
import DashboardLayout from "./components/DashboardLayout"

// Optional: other dashboard pages
import Home from "./components/Home"
import Locations from "./components/Locations"
import Campaigns from "./components/campaign/Campaigns"
import CampaignDetail from "./components/campaign/CampaignDetail"
import Register from "./components/auth/RegisterModal.jsx"

function App() {
  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard routes with sidebar */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route path="home" element={<Home />} />
          <Route path="devices" element={<Devices />} />
          <Route path="locations" element={<Locations />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="/dashboard/campaigns/:campaignId" element={<CampaignDetail />} />
        </Route>

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
