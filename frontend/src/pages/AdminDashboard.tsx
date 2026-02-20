import { useEffect, useState } from "react";
import type { Product, Order, OrderWithItems } from "../types";
import { getProducts, createProduct, updateProduct, deleteProduct, getOrders, getOrderById, updateOrderStatus, deleteOrder, uploadProductImage, updateOrder } from "../utils/api";
import "./App.css";

type ProductFormData = {
  name: string;
  description: string;
  price: string;
  stock_quantity: string;
  image_url: string;
  category_id: string;
  sizes: string;
  colors: string;
  sku: string;
  limited_availability: boolean;
};

const emptyForm: ProductFormData = {
  name: "",
  description: "",
  price: "",
  stock_quantity: "",
  image_url: "",
  category_id: "",
  sizes: "",
  colors: "",
  sku: "",
  limited_availability: false,
};

export function AdminDashboard() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');

  // Product state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);

  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editOrderData, setEditOrderData] = useState<{
    customer_name: string;
    customer_email: string;
    notes: string;
    items: Array<{
      id: number;
      product_id: number;
      product_name: string;
      quantity: number;
      price_at_purchase: number;
      selected_size: string | null;
    }>;
  } | null>(null);
  const [editOrderLoading, setEditOrderLoading] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadOrders();
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    }
  }, [activeTab]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      image_url: product.image_url || "",
      category_id: product.category_id?.toString() || "",
      sizes: product.sizes ? product.sizes.join(", ") : "",
      colors: product.colors ? product.colors.join(", ") : "",
      sku: product.sku || "",
      limited_availability: product.limited_availability || false,
    });
    setImagePreview(product.image_url || null);
    setShowForm(true);
  };

  const handleDelete = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await deleteProduct(productId);
      await loadProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete product");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      // Parse and validate form data
      const price = parseFloat(formData.price);
      const stock_quantity = parseInt(formData.stock_quantity, 10);
      const category_id = formData.category_id ? parseInt(formData.category_id, 10) : null;

      if (isNaN(price) || price < 0) {
        throw new Error("Price must be a valid positive number");
      }
      if (isNaN(stock_quantity) || stock_quantity < 0) {
        throw new Error("Stock quantity must be a valid positive number");
      }

      const sizes = formData.sizes
        ? formData.sizes.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;
      const colors = formData.colors
        ? formData.colors.split(",").map((c) => c.trim()).filter(Boolean)
        : undefined;

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price,
        stock_quantity,
        image_url: formData.image_url.trim() || undefined,
        category_id: category_id ?? undefined,
        sizes,
        colors,
        sku: formData.sku.trim() || undefined,
        limited_availability: formData.limited_availability,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await createProduct(productData);
      }

      // Reset form and reload products
      setShowForm(false);
      setEditingProduct(null);
      setFormData(emptyForm);
      await loadProducts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData(emptyForm);
    setFormError(null);
    setImagePreview(null);
    setDragActive(false);
  };

  const handleImageUpload = async (file: File) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    setFormError('Invalid image type. Allowed: JPEG, PNG, GIF, WebP');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    setFormError('Image must be under 5MB');
    return;
  }

  setImageUploading(true);
  setFormError(null);
  try {
    setImagePreview(URL.createObjectURL(file));
    const url = await uploadProductImage(file);
    const fullUrl = url.startsWith('/') ? `http://localhost:3000${url}` : url;
    setFormData(prev => ({ ...prev, image_url: fullUrl }));
  } catch (err) {
    setFormError(err instanceof Error ? err.message : 'Failed to upload image');
    setImagePreview(null);
  } finally {
    setImageUploading(false);
  }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };
  
  const handleStatusChange = async (orderId: number, newStatus: 'pending' | 'processing' | 'completed' | 'cancelled') => {
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update order status");
    }
  };

  const handleViewOrder = async (orderId: number) => {
    try {
      const data = await getOrderById(orderId);
      setSelectedOrder(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to load order details");
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to delete this order?")) {
      return;
    }

    try {
      await deleteOrder(orderId);
      await loadOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete order");
    }
  };

  const handleEditOrder = () => {
    if (!selectedOrder) return;
    setEditOrderData({
      customer_name: selectedOrder.customer_name || '',
      customer_email: selectedOrder.customer_email || selectedOrder.user_email || '',
      notes: selectedOrder.notes || '',
      items: selectedOrder.items.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name || `Product #${item.product_id}`,
        quantity: item.quantity,
        price_at_purchase: typeof item.price_at_purchase === 'string'
          ? parseFloat(item.price_at_purchase) : item.price_at_purchase,
        selected_size: item.selected_size
      }))
    });
    setIsEditingOrder(true);
  };

  const handleSaveOrder = async () => {
    if (!selectedOrder || !editOrderData) return;
    setEditOrderLoading(true);
    try {
      const updated = await updateOrder(selectedOrder.id, {
        customer_name: editOrderData.customer_name,
        customer_email: editOrderData.customer_email,
        notes: editOrderData.notes,
        items: editOrderData.items.map(i => ({
          id: i.id,
          quantity: i.quantity
        }))
      });
      setSelectedOrder(updated);
      setIsEditingOrder(false);
      setEditOrderData(null);
      await loadOrders();  // refresh the orders table
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setEditOrderLoading(false);
    }
  };

  const handleCancelEditOrder = () => {
    setIsEditingOrder(false);
    setEditOrderData(null);
  };

  if (loading) {
    return (
      <div className="page">
        <h1>Admin Dashboard</h1>
        <div className="spinner">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <h1>Admin Dashboard</h1>
        <div className="error-box">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        {activeTab === 'products' && (
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
            disabled={showForm}
          >
            Add New Product
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          onClick={() => setActiveTab('products')}
          className={`admin-tab ${activeTab === 'products' ? 'active' : ''}`}
        >
          Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
        >
          Orders ({orders.length})
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <>
          {showForm && (
        <div className="admin-form-card">
          <h2>{editingProduct ? "Edit Product" : "Create New Product"}</h2>

          {formError && (
            <div className="error-box">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="admin-form-grid">
              <label className="form-label-admin">
                Name *
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </label>

              <label className="form-label-admin">
                Price *
                <input
                  type="number"
                  className="input"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </label>

              <label className="form-label-admin">
                Stock Quantity *
                <input
                  type="number"
                  className="input"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  required
                />
              </label>

              <label className="form-label-admin">
                Category ID
                <input
                  type="number"
                  className="input"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  placeholder="1=T-Shirts, 2=Hoodies, 3=Hats, 4=Accessories"
                />
              </label>

              <label className="form-label-admin">
                SKU
                <input
                  type="text"
                  className="input"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="NL-TS-001"
                />
              </label>

              <div className="form-label-admin">
                Image
                <div
                  className={`image-dropzone ${dragActive ? 'drag-active' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('image-file-input')?.click()}
                >
                  {imageUploading ? (
                    <span>Uploading...</span>
                  ) : imagePreview || formData.image_url ? (
                    <div className="image-preview-container">
                      <img
                        src={imagePreview || formData.image_url}
                        alt="Preview"
                        className="image-preview"
                      />
                      <span className="image-change-hint">Click or drag to replace</span>
                    </div>
                  ) : (
                    <div className="dropzone-placeholder">
                      <span className="dropzone-icon">+</span>
                      <span>Drag & drop image here, or click to select</span>
                    </div>
                  )}
                  <input
                    id="image-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                </div>
                <input
                  type="text"
                  className="input"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="Or paste image URL..."
                  style={{ marginTop: '0.5rem' }}
                />
              </div>

              <label className="form-label-admin full-width">
                Description
                <textarea
                  className="input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </label>

              <label className="form-label-admin">
                Sizes (comma-separated)
                <input
                  type="text"
                  className="input"
                  value={formData.sizes}
                  onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                  placeholder="XS, S, M, L, XL"
                />
              </label>

              <label className="form-label-admin">
                Colors (comma-separated)
                <input
                  type="text"
                  className="input"
                  value={formData.colors}
                  onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                  placeholder="Black, White, Navy"
                />
              </label>

              <label className="form-checkbox-row">
                <input
                  type="checkbox"
                  checked={formData.limited_availability}
                  onChange={(e) => setFormData({ ...formData, limited_availability: e.target.checked })}
                />
                Limited Availability
              </label>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={formLoading}
              >
                {formLoading ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary"
                disabled={formLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
          )}

          <div className="card">
            <div className="card-header">Products ({products.length})</div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Category</th>
                    <th>Sizes</th>
                    <th>Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>{product.name}</td>
                      <td>{product.sku || "-"}</td>
                      <td>${typeof product.price === 'number' ? product.price.toFixed(2) : parseFloat(product.price).toFixed(2)}</td>
                      <td>{product.stock_quantity}</td>
                      <td>{product.category_name || "-"}</td>
                      <td>
                        {product.sizes ? product.sizes.join(", ") : "-"}
                      </td>
                      <td>
                        {product.is_active ? "Yes" : "No"}
                      </td>
                      <td>
                        <button
                          onClick={() => handleEdit(product)}
                          className="btn btn-sm"
                          style={{ marginRight: "0.5rem" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="card">
          <div className="card-header">Orders ({orders.length})</div>
          {ordersLoading ? (
            <div className="spinner">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="spinner">No orders found</div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.order_number}</td>
                      <td>{order.customer_name || order.user_full_name || "-"}</td>
                      <td>{order.customer_email || order.user_email || "-"}</td>
                      <td>{order.item_count || 0}</td>
                      <td>
                        ${typeof order.total_amount === 'number' ? order.total_amount.toFixed(2) : parseFloat(order.total_amount).toFixed(2)}
                      </td>
                      <td>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                          className={`status-select status-${order.status}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          onClick={() => handleViewOrder(order.id)}
                          className="btn btn-sm"
                          style={{ marginRight: "0.5rem" }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <>
          <div
            onClick={() => { setSelectedOrder(null); handleCancelEditOrder(); }}
            className="modal-overlay"
          />
          <div className="modal modal-wide" style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 101,
          }}>
            <div className="modal-header-row">
              <h2 style={{ margin: 0 }}>Order #{selectedOrder.order_number}</h2>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {isEditingOrder ? (
                  <>
                    <button onClick={handleSaveOrder} className="btn btn-primary btn-sm" disabled={editOrderLoading}>
                      {editOrderLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={handleCancelEditOrder} className="btn btn-secondary btn-sm" disabled={editOrderLoading}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={handleEditOrder} className="btn btn-sm">Edit</button>
                )}
                <button onClick={() => { setSelectedOrder(null); handleCancelEditOrder(); }} className="modal-close">✕</button>
              </div>
            </div>

            <div style={{ padding: "0 1.25rem 1.5rem" }}>
              <div className="order-info-grid">
                <div><strong>Status:</strong> {selectedOrder.status}</div>
                <div>
                  <strong>Total:</strong> $
                  {isEditingOrder && editOrderData
                    ? editOrderData.items
                        .filter(i => i.quantity > 0)
                        .reduce((sum, i) => sum + i.price_at_purchase * i.quantity, 0)
                        .toFixed(2)
                    : (typeof selectedOrder.total_amount === 'number'
                        ? selectedOrder.total_amount.toFixed(2)
                        : parseFloat(selectedOrder.total_amount).toFixed(2))
                  }
                </div>
                <div>
                  <strong>Customer:</strong>{' '}
                  {isEditingOrder && editOrderData ? (
                    <input className="input" value={editOrderData.customer_name}
                      onChange={e => setEditOrderData({...editOrderData, customer_name: e.target.value})} />
                  ) : (selectedOrder.customer_name || selectedOrder.user_full_name || '-')}
                </div>
                <div>
                  <strong>Email:</strong>{' '}
                  {isEditingOrder && editOrderData ? (
                    <input className="input" value={editOrderData.customer_email}
                      onChange={e => setEditOrderData({...editOrderData, customer_email: e.target.value})} />
                  ) : (selectedOrder.customer_email || selectedOrder.user_email || '-')}
                </div>
                <div><strong>Placed:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</div>
                <div className="full-width">
                  <strong>Notes:</strong>{' '}
                  {isEditingOrder && editOrderData ? (
                    <textarea className="input" rows={2} value={editOrderData.notes}
                      onChange={e => setEditOrderData({...editOrderData, notes: e.target.value})} />
                  ) : (selectedOrder.notes || '-')}
                </div>
              </div>

              <h3 style={{ margin: "1rem 0 0.5rem" }}>Items</h3>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Size</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Subtotal</th>
                      {isEditingOrder && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(isEditingOrder && editOrderData
                      ? editOrderData.items.filter(i => i.quantity > 0)
                      : selectedOrder.items
                    ).map((item, index) => {
                      const price = typeof item.price_at_purchase === 'string'
                        ? parseFloat(item.price_at_purchase) : item.price_at_purchase;
                      return (
                        <tr key={item.id}>
                          <td>{item.product_name || `Product #${item.product_id}`}</td>
                          <td>{item.selected_size || '-'}</td>
                          <td>
                            {isEditingOrder && editOrderData ? (
                              <input type="number" min="1" className="input"
                                style={{ width: '60px' }}
                                value={item.quantity}
                                onChange={e => {
                                  const newItems = [...editOrderData.items];
                                  newItems[index] = { ...newItems[index], quantity: parseInt(e.target.value) || 1 };
                                  setEditOrderData({ ...editOrderData, items: newItems });
                                }}
                              />
                            ) : item.quantity}
                          </td>
                          <td>${price.toFixed(2)}</td>
                          <td>${(price * item.quantity).toFixed(2)}</td>
                          {isEditingOrder && editOrderData && (
                            <td>
                              <button className="btn btn-danger btn-sm" onClick={() => {
                                const newItems = editOrderData.items.filter((_, i) => i !== index);
                                if (newItems.length === 0) {
                                  alert('Order must have at least one item');
                                  return;
                                }
                                setEditOrderData({ ...editOrderData, items: newItems });
                              }}>
                                Remove
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
