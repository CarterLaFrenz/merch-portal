import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { db } from '../db/index.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

export async function orderRoutes(fastify: FastifyInstance) {
  // POST /api/orders - Create new order (authenticated users)
  fastify.post<{
    Body: {
      items: Array<{
        product_id: number;
        quantity: number;
        selected_size?: string;
      }>;
      customer_name?: string;
      customer_email?: string;
      notes?: string;
    };
  }>('/orders', {
    preHandler: [authenticateToken]
  }, async (request, reply) => {
    try {
      const { items, customer_name, customer_email, notes } = request.body;
      const userId = request.user?.userId;

      // Validate items
      if (!items || items.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'Order must contain at least one item',
          statusCode: 400
        });
      }

      // Calculate total and validate products
      let totalAmount = 0;
      const orderItems: Array<{
        product_id: number;
        product_name: string;
        quantity: number;
        selected_size: string | null;
        price_at_purchase: number;
      }> = [];

      for (const item of items) {
        // Get product price and validate stock
        const [productRows] = await db.query<RowDataPacket[]>(
          'SELECT id, name, price, stock_quantity FROM products WHERE id = ? AND is_active = true',
          [item.product_id]
        );

        if (productRows.length === 0) {
          return reply.status(400).send({
            success: false,
            error: `Product ${item.product_id} not found or inactive`,
            statusCode: 400
          });
        }

        const product = productRows[0];
        const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;

        if (product.stock_quantity < item.quantity) {
          return reply.status(400).send({
            success: false,
            error: `Insufficient stock for product ${item.product_id}`,
            statusCode: 400
          });
        }

        totalAmount += price * item.quantity;
        orderItems.push({
          product_id: item.product_id,
          product_name: product.name,
          quantity: item.quantity,
          selected_size: item.selected_size || null,
          price_at_purchase: price
        });
      }

      // Generate order number (format: ORD-YYYYMMDD-XXXXX)
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      const orderNumber = `ORD-${dateStr}-${randomNum}`;

      // Create order
      const [orderResult] = await db.query<ResultSetHeader>(
        `INSERT INTO orders (order_number, user_id, customer_email, customer_name, status, total_amount, notes)
         VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
        [orderNumber, userId || null, customer_email || null, customer_name || null, totalAmount, notes || null]
      );

      const orderId = orderResult.insertId;

      // Create order items and update stock
      for (const item of orderItems) {
        await db.query(
          `INSERT INTO order_items (order_id, product_id, product_name, quantity, selected_size, price_at_purchase)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, item.product_id, item.product_name, item.quantity, item.selected_size, item.price_at_purchase]
        );

        // Decrease stock
        await db.query(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      // Fetch created order
      const [createdOrder] = await db.query<RowDataPacket[]>(
        'SELECT * FROM orders WHERE id = ?',
        [orderId]
      );

      return reply.status(201).send({
        success: true,
        data: createdOrder[0],
        statusCode: 201
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to create order',
        statusCode: 500
      });
    }
  });

  // GET /api/orders - Get all orders (admin only)
  fastify.get('/orders', {
    preHandler: [authenticateToken, requireAdmin]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [rows] = await db.query<RowDataPacket[]>(`
        SELECT
          o.*,
          u.email as user_email,
          u.full_name as user_full_name,
          COUNT(oi.id) as item_count,
          (SELECT GROUP_CONCAT(CONCAT(oi2.product_id, ':', oi2.quantity, ':', IFNULL(oi2.selected_size, '')) ORDER BY oi2.product_id, oi2.selected_size)
           FROM order_items oi2 WHERE oi2.order_id = o.id) as items_fingerprint
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `);

      return reply.send({
        success: true,
        data: rows,
        statusCode: 200
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch orders',
        statusCode: 500
      });
    }
  });

  // GET /api/orders/:id - Get order details with items
  fastify.get<{ Params: { id: string } }>('/orders/:id', {
    preHandler: [authenticateToken, requireAdmin]
  }, async (request, reply) => {
    try {
      const orderId = parseInt(request.params.id, 10);

      // Get order details
      const [orderRows] = await db.query<RowDataPacket[]>(
        `SELECT
          o.*,
          u.email as user_email,
          u.full_name as user_full_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.id = ?`,
        [orderId]
      );

      if (orderRows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Order not found',
          statusCode: 404
        });
      }

      const order = orderRows[0];

      // Get order items with product details
      const [itemRows] = await db.query<RowDataPacket[]>(
        `SELECT
          oi.*,
          p.name as product_name,
          p.image_url as product_image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?`,
        [orderId]
      );

      return reply.send({
        success: true,
        data: {
          ...order,
          items: itemRows
        },
        statusCode: 200
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch order details',
        statusCode: 500
      });
    }
  });

  // PATCH /api/orders/:id/status - Update order status
  fastify.patch<{
    Params: { id: string };
    Body: { status: 'pending' | 'processing' | 'completed' | 'cancelled' };
  }>('/orders/:id/status', {
    preHandler: [authenticateToken, requireAdmin]
  }, async (request, reply) => {
    try {
      const orderId = parseInt(request.params.id, 10);
      const { status } = request.body;

      // Validate status
      const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid status value',
          statusCode: 400
        });
      }

      // Update order status
      const updateFields: string[] = ['status = ?', 'updated_at = NOW()'];
      const values: any[] = [status];

      // Set completed_at if status is completed
      if (status === 'completed') {
        updateFields.push('completed_at = NOW()');
      }

      values.push(orderId);

      const [result] = await db.query<ResultSetHeader>(
        `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Order not found',
          statusCode: 404
        });
      }

      // Fetch updated order
      const [rows] = await db.query<RowDataPacket[]>(
        'SELECT * FROM orders WHERE id = ?',
        [orderId]
      );

      return reply.send({
        success: true,
        data: rows[0],
        statusCode: 200
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to update order status',
        statusCode: 500
      });
    }
  });

  // PUT /api/orders/:id - Update order details (admin only)
  fastify.put<{
    Params: { id: string };
    Body: {
      customer_name?: string;
      customer_email?: string;
      notes?: string;
      items?: Array<{ id: number; quantity: number }>;
    };
  }>('/orders/:id', {
    preHandler: [authenticateToken, requireAdmin]
  }, async (request, reply) => {
    try {
      const orderId = parseInt(request.params.id, 10);

      if (isNaN(orderId)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid order ID',
          statusCode: 400
        });
      }

      // Check order exists
      const [existingRows] = await db.query<RowDataPacket[]>(
        'SELECT id FROM orders WHERE id = ?',
        [orderId]
      );

      if (existingRows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Order not found',
          statusCode: 404
        });
      }

      const { customer_name, customer_email, notes, items } = request.body;

      // Update customer fields if provided
      const orderUpdates: string[] = [];
      const orderValues: any[] = [];

      if (customer_name !== undefined) {
        orderUpdates.push('customer_name = ?');
        orderValues.push(customer_name || null);
      }
      if (customer_email !== undefined) {
        orderUpdates.push('customer_email = ?');
        orderValues.push(customer_email || null);
      }
      if (notes !== undefined) {
        orderUpdates.push('notes = ?');
        orderValues.push(notes || null);
      }

      if (orderUpdates.length > 0) {
        orderUpdates.push('updated_at = NOW()');
        orderValues.push(orderId);
        await db.query(
          `UPDATE orders SET ${orderUpdates.join(', ')} WHERE id = ?`,
          orderValues
        );
      }

      // Update items if provided
      if (items && items.length > 0) {
        for (const item of items) {
          if (item.quantity <= 0) {
            // Remove item
            await db.query(
              'DELETE FROM order_items WHERE id = ? AND order_id = ?',
              [item.id, orderId]
            );
          } else {
            // Update quantity
            await db.query(
              'UPDATE order_items SET quantity = ? WHERE id = ? AND order_id = ?',
              [item.quantity, item.id, orderId]
            );
          }
        }

        // Ensure at least 1 item remains
        const [countRows] = await db.query<RowDataPacket[]>(
          'SELECT COUNT(*) as cnt FROM order_items WHERE order_id = ?',
          [orderId]
        );

        if (countRows[0].cnt === 0) {
          return reply.status(400).send({
            success: false,
            error: 'Order must have at least one item',
            statusCode: 400
          });
        }

        // Recalculate total
        const [totalRows] = await db.query<RowDataPacket[]>(
          'SELECT SUM(price_at_purchase * quantity) as total FROM order_items WHERE order_id = ?',
          [orderId]
        );

        await db.query(
          'UPDATE orders SET total_amount = ?, updated_at = NOW() WHERE id = ?',
          [totalRows[0].total, orderId]
        );
      }

      // Return updated order with items (same pattern as GET /orders/:id)
      const [orderRows] = await db.query<RowDataPacket[]>(
        `SELECT o.*, u.email as user_email, u.full_name as user_full_name
         FROM orders o
         LEFT JOIN users u ON o.user_id = u.id
         WHERE o.id = ?`,
        [orderId]
      );

      const [itemRows] = await db.query<RowDataPacket[]>(
        `SELECT oi.*, p.name as product_name, p.image_url as product_image_url
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [orderId]
      );

      return reply.send({
        success: true,
        data: {
          ...orderRows[0],
          items: itemRows
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to update order',
        statusCode: 500
      });
    }
  });

  // DELETE /api/orders/:id - Delete order (admin only)
  fastify.delete<{ Params: { id: string } }>('/orders/:id', {
    preHandler: [authenticateToken, requireAdmin]
  }, async (request, reply) => {
    try {
      const orderId = parseInt(request.params.id, 10);

      // Delete order items first (foreign key constraint)
      await db.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);

      // Delete order
      const [result] = await db.query<ResultSetHeader>(
        'DELETE FROM orders WHERE id = ?',
        [orderId]
      );

      if (result.affectedRows === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Order not found',
          statusCode: 404
        });
      }

      return reply.send({
        success: true,
        data: { message: 'Order deleted successfully' },
        statusCode: 200
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to delete order',
        statusCode: 500
      });
    }
  });
}
