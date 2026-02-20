export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: number | null;
  category_name?: string; // From JOIN query
  stock_quantity: number;
  sizes?: string[] | null;
  colors?: string[] | null;
  sku?: string | null;
  limited_availability?: boolean;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export type CartItem = {
  product: Product;
  quantity: number;
  size?: string;
};

export interface Order {
  id: number;
  order_number: string;
  user_id: number | null;
  customer_email: string | null;
  customer_name: string | null;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  // From JOIN queries
  user_email?: string;
  user_full_name?: string;
  item_count?: number;
  items_fingerprint?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  selected_size: string | null;
  price_at_purchase: number;
  // From JOIN queries
  product_name?: string;
  product_image_url?: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}
