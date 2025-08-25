import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth";

export default function Sidebar() {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const Nav = ({ to, children }) => (
    <Link to={to} className={`block px-4 py-2 rounded-xl ${pathname===to?"bg-black text-white":"hover:bg-gray-100"}`}>
      {children}
    </Link>
  );

  return (
    <aside className="w-64 bg-white border-r p-4 space-y-2">
      <div className="text-lg font-semibold mb-2">Farm Tracker</div>
      <Nav to="/">Dashboard</Nav>
      <button onClick={logout} className="mt-4 w-full border rounded-xl py-2">Logout</button>
    </aside>
  );
}
