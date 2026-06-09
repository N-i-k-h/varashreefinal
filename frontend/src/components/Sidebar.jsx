import "./Sidebar.css"; // Import Custom Animations
import { NavLink } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function Sidebar({ toggleSidebar, open }) {
  // Sidebar component handling navigation
  // close sidebar only on mobile
  const closeSidebar = () => {
    if (window.innerWidth <= 768) toggleSidebar(false);
  };

  return (
    <>
      {/* MOBILE TOP BAR */}


      {/* MOBILE OVERLAY */}
      {open && (
        <div className="sidebar-overlay d-md-none" onClick={() => toggleSidebar(false)}></div>
      )}

      {/* SIDEBAR */}
      <div className={`sidebar-container ${open ? "sidebar-open" : ""}`}>
        <div
          className="d-flex flex-column flex-shrink-0 p-3 custom-sidebar text-white"
          style={{ width: "250px", height: "100vh", overflowY: "auto" }}
        >
          <div className="text-center mb-4 mt-2">
            <img
              src="/logo.png?v=2"
              alt="Varashree Farm"
              className="img-fluid"
              style={{
                maxWidth: '160px',
                filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.2))",
                transition: "transform 0.3s ease"
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
            />
          </div>

          <ul className="nav flex-column mb-auto list-unstyled">
            {[
              { to: "/", icon: "speedometer2", label: "Dashboard" },
              { to: "/advances", icon: "wallet2", label: "Advance Orders" },
              { to: "/advances/create", icon: "plus-square-dotted", label: "New Advance Deal" },
              { to: "/plants", icon: "flower1", label: "Plant Catalog" },
              { to: "/plants/add", icon: "plus-circle", label: "Add Plant" },
              { to: "/plants/manage", icon: "pencil-square", label: "Manage Plants" },
              { to: "/orders/create", icon: "basket", label: "Create Order" },
              { to: "/balances", icon: "cash-coin", label: "Balance Management" },
              { to: "/purchases", icon: "bag-check", label: "Sales Report" },
              { to: "/estimations/create", icon: "file-earmark-text", label: "Create Estimation" },
              { to: "/reports", icon: "bar-chart", label: "Reports" },
            ].map((item, index) => (
              <li className="nav-item" key={index}>
                <NavLink
                  to={item.to}
                  end
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `custom-nav-link text-decoration-none ${isActive ? "active" : ""}`
                  }
                >
                  <i className={`bi bi-${item.icon}`}></i> {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="text-center small opacity-75 mt-4 pb-2" style={{ letterSpacing: "1px" }}>
            © 2025 Varashree Nursery
          </div>
        </div>
      </div>

      {/* DESKTOP SPACE FIXER */}
      <div className="d-none d-md-block" style={{ width: "250px" }}></div>
    </>
  );
}
