import type { Product, CartItem } from "../types";
import { useState } from "react";

function getProductKeyword(product: Product): string {
  const name = product.name.toLowerCase();
  if (name.includes('water bottle'))               return 'water+bottle';
  if (name.includes('backpack'))                   return 'backpack';
  if (name.includes('tote'))                       return 'tote+bag';
  if (name.includes('sticker'))                    return 'stickers';
  if (name.includes('pin') || name.includes('enamel')) return 'enamel+pin';
  if (name.includes('beanie'))                     return 'beanie+hat';
  if (name.includes('snapback'))                   return 'snapback+cap';
  if (name.includes('dad hat'))                    return 'baseball+cap';
  if (name.includes('polo'))                       return 'polo+shirt';
  if (name.includes('quarter-zip') || name.includes('quarter zip')) return 'quarter+zip';
  if (name.includes('zip-up') || name.includes('zip up')) return 'zip+hoodie';
  if (name.includes('pullover') || name.includes('hoodie')) return 'pullover+hoodie';
  const cat = (product.category_name ?? '').toLowerCase();
  if (cat.includes('hoodie'))     return 'hoodie';
  if (cat.includes('hat'))        return 'hat+cap';
  if (cat.includes('t-shirt') || cat.includes('tshirt')) return 't-shirt';
  if (cat.includes('accessor'))   return 'merch+accessory';
  return 'apparel+clothing';
}

function getProductImage(product: Product): string {
  if (product.image_url) return product.image_url;
  const keyword = getProductKeyword(product);
  return `https://loremflickr.com/400/400/${keyword}?lock=${product.id}`;
}

type Props = {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product, size: string | undefined, quantity: number) => void;
};

export function CatalogTable({ products, onAddToCart }: Props) {
  //set state
  const [draftQty, setDraftQty] = useState<Record<string, number>>({});
  const [draftSize, setDraftSize] = useState<Record<string, string>>({});
  const [expandedImage, setExpandedImage] = useState<{ url: string; name: string } | null>(null);

  return (
    <>
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
                const imgUrl = getProductImage(p);

                return (
                  <tr key={p.id}>
                    <td>
                      <img
                        className="item-img item-img-clickable"
                        src={imgUrl}
                        alt={p.name}
                        onClick={() => setExpandedImage({ url: imgUrl, name: p.name })}
                        title="Click to expand"
                      />
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

      {expandedImage && (
        <div className="img-lightbox-overlay" onClick={() => setExpandedImage(null)}>
          <div className="img-lightbox" onClick={(e) => e.stopPropagation()}>
            <button className="img-lightbox-close" onClick={() => setExpandedImage(null)}>✕</button>
            <img src={expandedImage.url} alt={expandedImage.name} />
            <div className="img-lightbox-caption">{expandedImage.name}</div>
          </div>
        </div>
      )}
    </>
  );
}
