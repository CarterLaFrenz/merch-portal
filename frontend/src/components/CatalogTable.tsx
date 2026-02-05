import type { Product, CartItem } from "../types";
import { useState } from "react";


type Props = {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product, size: string | undefined, quantity: number) => void;
};

export function CatalogTable({ products, onAddToCart }: Props) {
  //set state
  const [draftQty, setDraftQty] = useState<Record<string, number>>({});
  const [draftSize, setDraftSize] = useState<Record<string, string>>({});

  return (
    <div className="card">
      <div className="card-header">Merchandise Catalog</div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Description</th>
              <th>Cost</th>
              <th>Quantity</th>
              <th>Size</th>
              <th>Add</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => {
              const qty = draftQty[p.id] ?? 1;
              const size = draftSize[p.id] ?? "";

              const requiresSize = (p.sizes?.length ?? 0) > 0;
              const canAdd = !requiresSize || size.length > 0;

              return (
                <tr key={p.id}>
                  <td>
                    {p.image_url ? (
                      <img className="item-img" src={p.image_url} alt={p.name} />
                    ) : (
                      <div className="item-img-placeholder">No Image</div>
                    )}
                  </td>

                  <td>
                    <div className="product-name">
                      {p.name}
                      {"sku" in p && (p as any).sku ? ` - ${(p as any).sku}` : ""}
                    </div>
                    {"limitedAvailability" in p && (p as any).limitedAvailability ? (
                      <div className="limited-badge">* LIMITED AVAILABILITY</div>
                    ) : null}
                  </td>

                  <td>${p.price}</td>

                  <td>
                    <input
                      className="input qty-input"
                      type="number"
                      min={1}
                      max={99}
                      value={qty}
                      onChange={(e) =>
                        setDraftQty((prev) => ({
                          ...prev,
                          [p.id]: Math.max(1, Math.min(99, Number(e.target.value))),
                        }))
                      }
                    />
                  </td>

                  <td>
                    {p.sizes?.length ? (
                      <select
                        className="input"
                        value={size}
                        onChange={(e) =>
                          setDraftSize((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                      >
                        <option value="">—</option>
                        {p.sizes.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>—</span>
                    )}
                  </td>

                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={!canAdd}
                      onClick={() => onAddToCart(p, size || undefined, qty)}
                      title={canAdd ? "Add to cart" : "Select a size first"}
                    >
                      Add
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
