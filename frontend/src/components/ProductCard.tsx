import type { Product } from "../types";

type ProductCardProps = {
  product: Product;
  onAddToCart?: (product: Product) => void;
};

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div>
      <img src={product.imageUrl} alt={product.name} />
      <h2>{product.name}</h2>
      <p>${product.price}</p>
      {onAddToCart && (
        <button onClick={() => onAddToCart(product)}>Add to Cart</button>
      )}
    </div>
  );
}
