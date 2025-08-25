// components/DashboardLayout.js
import { Link, Outlet } from "react-router-dom"

export default function DashboardLayout() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-400 shadow-md p-4">
        <div className="text-purple-400 font-extrabold text-2xl px-4 py-6 border-b border-gray-700">
          adverty
          </div>
        <nav className="flex flex-col space-y-3">
          <Link to="/dashboard/home" className="hover:text-purple-500">Home</Link>
          <Link to="/dashboard/devices" className="hover:text-purple-500">Devices</Link>
          <Link to="/dashboard/locations" className="hover:text-purple-500">Locations</Link>
          <Link to="/dashboard/campaigns" className="hover:text-purple-500">Campaigns</Link>
        </nav>
      </aside>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-10xl mx-auto p-10">
          <Outlet />
        </div>
      </main>
      
    </div>
  )
}
