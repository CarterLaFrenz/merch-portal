import type { Product, CartItem, Warehouse } from "../types";
import { useState, useEffect } from "react";
import { createOrder, getWarehouses } from "../utils/api";



type Props = {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  onSetVariantQuantity: (product: Product, size: string | undefined, quantity: number) => void;
  onRemoveVariant: (product: Product, size: string | undefined) => void;
  onClearCart: () => void;
};



export function CartDrawer({
  open,
  onClose,
  cart,
  onSetVariantQuantity,
  onRemoveVariant,
  onClearCart,
}: Props) {
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);

  useEffect(() => {
    getWarehouses().then((data) => {
      setWarehouses(data);
      if (data.length > 0) setSelectedWarehouseId(data[0].id);
    }).catch(() => {});
  }, []);

  const handleCheckout = async () => {
    if (!selectedWarehouseId) {
      alert("Please select a warehouse.");
      return;
    }
    try {
      const items = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        selected_size: item.size
      }));

      await createOrder(items, {}, selectedWarehouseId);
      onClearCart();
      alert("Order placed successfully!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to place order");
    }
  };

  return (
    <>
      <div className={`cartBackdrop ${open ? "isOpen" : ""}`} onClick={onClose} />

      <aside className={`cartDrawer ${open ? "isOpen" : ""}`} aria-hidden={!open}>
        <div className="cartHeader">
          <div className="cartTitle">Cart</div>
          <button className="cartCloseBtn" onClick={onClose}>✕</button>
        </div>

        <div className="cartBody">
          {cart.length === 0 ? (
            <div className="cartEmpty">Your cart is empty.</div>
          ) : (
            cart.map((item) => (
              <div key={`${item.product.id}::${item.size ?? ""}`} className="cartLine">
                <img
                  className="cartLineImg"
                  src={item.product.image_url?.startsWith('/uploads/') ? `http://localhost:3000${item.product.image_url}` : (item.product.image_url ?? "")}
                  alt={item.product.name}
                />
                <div className="cartLineDetails">
                <div className="cartLineName">
                  {item.product.name}
                  {item.size ? <span className="cartLineMeta"> • Size: {item.size}</span> : null}
                </div>

                <div className="cartLineActions">
                  <button
                    className="cartQtyBtn"
                    onClick={() =>
                      onSetVariantQuantity(item.product, item.size, item.quantity - 1)
                    }
                    disabled={item.quantity <= 1}
                  >
                    −
                  </button>

                  <input
                    className="cartQtyInput"
                    type="number"
                    min={1}
                    max={99}
                    value={item.quantity}
                    onChange={(e) =>
                      onSetVariantQuantity(item.product, item.size, Number(e.target.value))
                    }
                  />

                  <button
                    className="cartQtyBtn"
                    onClick={() =>
                      onSetVariantQuantity(item.product, item.size, item.quantity + 1)
                    }
                    disabled={item.quantity >= 99}
                  >
                    +
                  </button>

                  <button
                    className="cartRemoveBtn"
                    onClick={() => onRemoveVariant(item.product, item.size)}
                  >
                    Remove
                  </button>
                </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cartFooter">
          <div className="cartTotalRow">
            <span>Total</span>
            <strong>${total}</strong>
          </div>
          {warehouses.length > 0 && (
            <select
              className="cartWarehouseSelect"
              value={selectedWarehouseId ?? ""}
              onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          )}
          <button
            className="cartCheckoutBtn"
            onClick={handleCheckout}
            disabled={cart.length === 0}>
            Place Order
          </button>
        </div>
      </aside>
    </>
  );
}
