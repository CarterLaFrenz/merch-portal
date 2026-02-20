import type { Product, Order, OrderWithItems } from "../types";

const API_BASE_URL = "http://localhost:3000/api";
const TOKEN_KEY = "merch_auth_token";
const REFRESH_TOKEN_KEY = "merch_refresh_token";

// ============================================
// Silent token refresh
// ============================================

let sessionExpiredHandler: (() => void) | null = null;
export function setOnSessionExpired(handler: () => void) {
  sessionExpiredHandler = handler;
}

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function attemptRefresh(): Promise<string> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) throw new Error("SESSION_EXPIRED");

    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) throw new Error("SESSION_EXPIRED");

    const json = await res.json();
    localStorage.setItem(TOKEN_KEY, json.data.accessToken);
    return json.data.accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = { ...options.headers, Authorization: `Bearer ${token}` };

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    try {
      const newToken = await attemptRefresh();
      const retryHeaders = { ...options.headers, Authorization: `Bearer ${newToken}` };
      response = await fetch(url, { ...options, headers: retryHeaders });
    } catch (err) {
      sessionExpiredHandler?.();
      throw new Error("Session expired. Please log in again.");
    }
  }

  return response;
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  const json = await response.json();
  return json.data;
}

// ============================================
// Product API
// ============================================

export async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE_URL}/products`);
  return handleResponse<Product[]>(response);
}

export async function getProductById(id: number): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/products/${id}`);
  return handleResponse<Product>(response);
}

export async function createProduct(
  productData: {
    name: string;
    description?: string;
    category_id?: number;
    sku?: string;
    price: number;
    stock_quantity?: number;
    image_url?: string;
    sizes?: string[];
    colors?: string[];
    limited_availability?: boolean;
  }
): Promise<Product> {
  const response = await fetchWithAuth(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData)
  });
  return handleResponse<Product>(response);
}

export async function updateProduct(
  id: number,
  productData: Partial<{
    name: string;
    description: string;
    category_id: number;
    sku: string;
    price: number;
    stock_quantity: number;
    image_url: string;
    sizes: string[];
    colors: string[];
    limited_availability: boolean;
    is_active: boolean;
  }>
): Promise<Product> {
  const response = await fetchWithAuth(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData)
  });
  return handleResponse<Product>(response);
}

export async function updateProductStock(
  id: number,
  stock_quantity: number
): Promise<Product> {
  const response = await fetchWithAuth(`${API_BASE_URL}/products/${id}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock_quantity })
  });
  return handleResponse<Product>(response);
}

export async function deleteProduct(id: number): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE'
  });
  await handleResponse<{ message: string }>(response);
}

// ============================================
// Authentication API
// ============================================

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    full_name: string | null;
    role: 'user' | 'admin';
  };
  accessToken: string;
  refreshToken: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return handleResponse<LoginResponse>(response);
}

export async function register(
  email: string,
  password: string,
  full_name: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name })
  });
  return handleResponse<LoginResponse>(response);
}

export async function getCurrentUser() {
  const response = await fetchWithAuth(`${API_BASE_URL}/auth/me`);
  return handleResponse<{
    id: number;
    email: string;
    full_name: string | null;
    role: 'user' | 'admin';
    created_at: Date;
    last_login: Date | null;
  }>(response);
}

export async function logout(refreshToken: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  await handleResponse<{ message: string }>(response);
}

// ============================================
// Order API
// ============================================

export async function getOrders(): Promise<Order[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/orders`);
  return handleResponse<Order[]>(response);
}

export async function getOrderById(id: number): Promise<OrderWithItems> {
  const response = await fetchWithAuth(`${API_BASE_URL}/orders/${id}`);
  return handleResponse<OrderWithItems>(response);
}

export async function updateOrderStatus(
  id: number,
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
): Promise<Order> {
  const response = await fetchWithAuth(`${API_BASE_URL}/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return handleResponse<Order>(response);
}

export async function updateOrder(
  id: number,
  data: {
    customer_name?: string;
    customer_email?: string;
    notes?: string;
    items?: Array<{ id: number; quantity: number }>;
  }
): Promise<OrderWithItems> {
  const response = await fetchWithAuth(`${API_BASE_URL}/orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse<OrderWithItems>(response);
}

export async function deleteOrder(id: number): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/orders/${id}`, {
    method: 'DELETE'
  });
  await handleResponse<{ message: string }>(response);
}

export async function createOrder(
  items: Array<{
    product_id: number;
    quantity: number;
    selected_size?: string;
  }>,
  customerInfo: {
    customer_name?: string;
    customer_email?: string;
    notes?: string;
  }
): Promise<Order> {
  const response = await fetchWithAuth(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, ...customerInfo })
  });
  return handleResponse<Order>(response);
}

export async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetchWithAuth(`${API_BASE_URL}/products/upload-image`, {
    method: 'POST',
    body: formData
  });
  const result = await handleResponse<{ url: string }>(response);
  return result.url;
}