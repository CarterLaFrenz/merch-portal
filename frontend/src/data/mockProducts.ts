import type { Product } from "../types";

export const mockProducts: Product[] = [
  {
    id: "hoodie-001",
    name: "Nextlink Logo Hoodie",
    description: "Cozy hoodie with the Nextlink logo.",
    price: 40,
    imageUrl: "/images/hoodie-001.png",
    category: "Hoodie",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "Navy"]
  },
  {
    id: "hat-001",
    name: "Nextlink Trucker Hat",
    description: "Mesh-back trucker hat with embroidered logo.",
    price: 20,
    imageUrl: "/images/hat-001.png",
    category: "Hat",
    colors: ["Black", "Gray"]
  }
];
