import * as React from 'react';
import { Container, Nav, Navbar, Dropdown } from 'react-bootstrap';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Users, Package, ShoppingCart, CircleUser as UserCircle, LogOut, Menu, X, Globe } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user: profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/employees', icon: Users, label: 'Employees' },
    { path: '/admin/products', icon: Package, label: 'Products' },
    { path: '/admin/inventory', icon: Package, label: 'Inventory' },
    { path: '/admin/sales', icon: ShoppingCart, label: 'Sales' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigate to login page after logout
      navigate('/login');
    } catch (error) {
      // Even if there's an error, still navigate to login
      // since local state is cleared anyway
      navigate('/login');
    }
  };

  const handleViewWebsite = () => {
    window.open('/', '_blank');
  };

  return (
    <div className="d-flex">
      <div
        className={`sidebar text-white ${sidebarOpen ? '' : 'd-none'}`}
        style={{ width: '280px', position: 'fixed', height: '100vh', overflowY: 'auto', zIndex: 1000 }}
      >
        <div className="p-4">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h4 className="mb-0 fw-bold">Business Admin</h4>
            <button
              className="btn btn-link text-white d-lg-none"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          <div className="mb-4 p-3 bg-white bg-opacity-10 rounded">
            <div className="d-flex align-items-center">
              <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                <UserCircle size={24} />
              </div>
              <div>
                <div className="fw-semibold">{profile?.full_name}</div>
                <small className="text-white-50">{profile?.role}</small>
              </div>
            </div>
          </div>

          <Nav className="flex-column sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Nav.Link
                  key={item.path}
                  as={Link}
                  to={item.path}
                  className={isActive ? 'active' : ''}
                >
                  <Icon size={20} className="me-2" />
                  {item.label}
                </Nav.Link>
              );
            })}
          </Nav>
        </div>
      </div>

      <div className={`flex-grow-1 ${sidebarOpen ? 'ms-0' : ''}`} style={{ marginLeft: sidebarOpen ? '280px' : '0' }}>
        <Navbar bg="white" className="border-bottom shadow-sm sticky-top">
          <Container fluid>
            <button
              className="btn btn-link text-dark"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={24} />
            </button>

            <Nav className="ms-auto">
              <Dropdown align="end">
                <Dropdown.Toggle variant="link" className="text-decoration-none text-dark">
                  <UserCircle size={28} />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/admin/profile">
                    Profile
                  </Dropdown.Item>
                  <Dropdown.Item onClick={handleViewWebsite}>
                    <Globe size={16} className="me-2" />
                    View Website
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleSignOut}>
                    <LogOut size={16} className="me-2" />
                    Sign Out
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Container>
        </Navbar>

        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};  