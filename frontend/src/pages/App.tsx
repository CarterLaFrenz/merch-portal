import type { Product, CartItem } from "../types";
import { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import "./App.css";
import { CatalogTable } from "../components/CatalogTable";
import { CartDrawer} from "../components/CartDrawer";
import { LoginPage } from "./LoginPage";
import { AdminDashboard } from "./AdminDashboard";
import { isAuthed, logout, getUserEmail, isAdmin } from "../utils/auth";
import { getProducts, setOnSessionExpired } from "../utils/api";


function App() {
  //set cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [authed, setAuthed] = useState(isAuthed());
  const navigate = useNavigate();

  // Product state - loaded from backend
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  //initialize auth on load
  useEffect(() => {
    setAuthed(isAuthed());
  }, []);

  // Load products from backend
  useEffect(() => {
    if (authed) {
      setProductsLoading(true);
      getProducts()
        .then((data) => {
          setProducts(data);
          setProductsLoading(false);
        })
        .catch((error) => {
          console.error('Failed to load products:', error);
          setProductsLoading(false);
        });
    }
  }, [authed]);

  //Cart logic
  const addToCart = (product: Product, size: string | undefined, quantity: number) => {
    const q = Math.max(1, Math.min(99, quantity));

    setCart((prev) => {
      const idx = prev.findIndex(
        (i) => i.product.id === product.id && (i.size ?? "") === (size ?? "")
      );

      if (idx !== -1) {
        return prev.map((i, n) => (n === idx ? { ...i, quantity: i.quantity + q } : i));
      }

      return [...prev, { product, size, quantity: q }];
    });
  };

  // Used by CartDrawer controls (must target variant!)
  const setVariantQuantity = (product: Product, size: string | undefined, quantity: number) => {
    const q = Math.max(0, Math.min(99, quantity));
    setCart((prev) => {
      const next = prev
        .map((i) =>
          i.product.id === product.id && (i.size ?? "") === (size ?? "")
            ? { ...i, quantity: q }
            : i
        )
        .filter((i) => i.quantity > 0);
      return next;
    });
  };

  const removeVariant = (product: Product, size: string | undefined) => {
    setCart((prev) =>
      prev.filter((i) => !(i.product.id === product.id && (i.size ?? "") === (size ?? "")))
    );
  };

  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handleLogout = () => {
    logout();
    setAuthed(false);
    setCartOpen(false);
    setCart([]);
    navigate("/");
  };

  // Auto-logout if refresh token is also expired
  useEffect(() => {
    setOnSessionExpired(handleLogout);
  });

  if (!authed) {
    return <LoginPage onLoginSuccess={() => setAuthed(true)} />;
  }

  return (
    <>
      <header className="header">
        <div className="logo">
          <div className="logo-icon">N</div>
          <h1 className="logo-text">Nextlink Merch Store</h1>
        </div>

        <nav className="nav-menu">
          <Link to="/" className="nav-item">
            Products
          </Link>

          {isAdmin() && (
            <Link to="/admin" className="nav-item">
              Admin Dashboard
            </Link>
          )}

          <span className="user-email">{getUserEmail()}</span>

          <button className="btn btn-secondary" onClick={() => setCartOpen(true)}>
            Cart<span className="cart-badge">{itemCount}</span>
          </button>

          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>

      <div className="page">
        <Routes>
        <Route
          path="/"
          element={
            productsLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                Loading products...
              </div>
            ) : (
              <CatalogTable products={products} cart={cart} onAddToCart={addToCart} />
            )
          }
        />
        <Route
          path="/admin"
          element={
            isAdmin() ? (
              <AdminDashboard />
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
                Access denied. Admin privileges required.
              </div>
            )
          }
        />
      </Routes>
      </div>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onSetVariantQuantity={setVariantQuantity}
        onRemoveVariant={removeVariant}
        onClearCart={() => setCart([])}
      />
    </>
  );
}


export default App;
