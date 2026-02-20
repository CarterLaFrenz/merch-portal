import type { Product, CartItem } from "../types";
import { createOrder } from "../utils/api";



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

  const handleCheckout = async () => {
    try {
      const items = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        selected_size: item.size
      }));

      await createOrder(items, {});
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
                  src={item.product.image_url ?? ""}
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
