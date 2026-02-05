// ============================================
// Database Schema Types
// ============================================

export interface User {
  id: number;
  email: string;
  password_hash: string;
  full_name: string | null;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: Date;
  last_login: Date | null;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  category_id: number | null;
  sku: string | null;
  price: number;
  stock_quantity: number;
  min_stock_level: number;
  image_url: string | null;
  sizes: string[] | null;
  colors: string[] | null;
  limited_availability: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number | null;
  customer_email: string | null;
  customer_name: string | null;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total_amount: number;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  selected_size: string | null;
  price_at_purchase: number;
}

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  selected_size: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
}

// ============================================
// API Request/Response Types
// ============================================

// Authentication
export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    full_name: string | null;
    role: 'user' | 'admin';
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Products
export interface CreateProductRequest {
  name: string;
  description?: string;
  category_id?: number;
  sku?: string;
  price: number;
  stock_quantity?: number;
  min_stock_level?: number;
  image_url?: string;
  sizes?: string[];
  colors?: string[];
  limited_availability?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  category_id?: number;
  sku?: string;
  price?: number;
  stock_quantity?: number;
  min_stock_level?: number;
  image_url?: string;
  sizes?: string[];
  colors?: string[];
  limited_availability?: boolean;
  is_active?: boolean;
}

// Orders
export interface CreateOrderRequest {
  customer_email?: string;
  customer_name?: string;
  items: Array<{
    product_id: number;
    quantity: number;
    selected_size?: string;
  }>;
  notes?: string;
}

export interface UpdateOrderStatusRequest {
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
}

export interface OrderWithItems extends Order {
  items: Array<OrderItem & {
    product_name: string;
    product_image_url: string | null;
  }>;
}

// Cart
export interface AddToCartRequest {
  product_id: number;
  quantity: number;
  selected_size?: string;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CartItemWithProduct extends CartItem {
  product: Product;
}

// ============================================
// API Response Wrappers
// ============================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiListResponse<T> {
  success: true;
  data: T[];
  count: number;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  statusCode: number;
}

// ============================================
// JWT Payload Types
// ============================================

export interface JwtPayload {
  userId: number;
  email: string;
  role: 'user' | 'admin';
}

export interface JwtRefreshPayload {
  userId: number;
  tokenId: number;
}
