import { FastifyInstance } from 'fastify';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pipeline } from 'stream/promises';
import { createWriteStream, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db/index.js';
import {
  CreateProductRequest,
  UpdateProductRequest
} from '../types';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

export async function productRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/products
   * Get all products (public)
   * Optional query params: ?category_id=1&is_active=true
   */
  fastify.get('/products', async (request, reply) => {
    try {
      const { category_id, is_active } = request.query as {
        category_id?: string;
        is_active?: string
      };

      let query = `
        SELECT
          p.*,
          c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (category_id) {
        query += ' AND p.category_id = ?';
        params.push(parseInt(category_id));
      }

      if (is_active !== undefined) {
        query += ' AND p.is_active = ?';
        params.push(is_active === 'true' ? 1 : 0);
      }

      query += ' ORDER BY p.created_at DESC';

      const [rows] = await db.query<RowDataPacket[]>(query, params);

      // MySQL2 automatically parses JSON fields, no need to JSON.parse
      const products = rows;

      return reply.send({
        success: true,
        data: products,
        count: products.length
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch products',
        statusCode: 500
      });
    }
  });

  /**
   * POST /api/products/upload-image
   * Upload a product image (admin only)
   */
  fastify.post('/products/upload-image', {
    preHandler: [authenticateToken, requireAdmin]
  }, async (request, reply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({
          success: false,
          error: 'No file uploaded',
          statusCode: 400
        });
      }

      // Validate file type
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimes.includes(data.mimetype)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP',
          statusCode: 400
        });
      }

      // Generate unique filename
      const ext = path.extname(data.filename) || '.jpg';
      const uniqueName = `${randomUUID()}${ext}`;

      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
      mkdirSync(uploadsDir, { recursive: true });

      const filePath = path.join(uploadsDir, uniqueName);
      await pipeline(data.file, createWriteStream(filePath));

      return reply.send({
        success: true,
        data: { url: `/uploads/${uniqueName}` }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to upload image',
        statusCode: 500
      });
    }
  });

  /**
   * GET /api/products/:id
   * Get single product by ID (public)
   */
  fastify.get<{ Params: { id: string } }>('/products/:id', async (request, reply) => {
    try {
      const productId = parseInt(request.params.id);

      if (isNaN(productId)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid product ID',
          statusCode: 400
        });
      }

      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT
          p.*,
          c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?`,
        [productId]
      );

      if (rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Product not found',
          statusCode: 404
        });
      }

      const product = rows[0];

      return reply.send({
        success: true,
        data: product
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch product',
        statusCode: 500
      });
    }
  });

  /**
   * GET /api/products/category/:categoryId
   * Get products by category (public)
   */
  fastify.get<{ Params: { categoryId: string } }>('/products/category/:categoryId', async (request, reply) => {
    try {
      const categoryId = parseInt(request.params.categoryId);

      if (isNaN(categoryId)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid category ID',
          statusCode: 400
        });
      }

      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT
          p.*,
          c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.category_id = ? AND p.is_active = 1
        ORDER BY p.created_at DESC`,
        [categoryId]
      );

      const products = rows.map(row => ({
        ...row,
        sizes: row.sizes ? JSON.parse(row.sizes) : null,
        colors: row.colors ? JSON.parse(row.colors) : null
      }));

      return reply.send({
        success: true,
        data: products,
        count: products.length
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch products',
        statusCode: 500
      });
    }
  });

  /**
   * POST /api/products
   * Create new product (admin only)
   */
  fastify.post<{ Body: CreateProductRequest }>('/products', {
    preHandler: [authenticateToken, requireAdmin]
  }, async (request, reply) => {
    try {
      const {
        name,
        description,
        category_id,
        sku,
        price,
        stock_quantity = 0,
        min_stock_level = 10,
        image_url,
        sizes,
        colors,
        limited_availability = false
      } = request.body;

      // Validate required fields
      if (!name || price === undefined) {
        return reply.status(400).send({
          success: false,
          error: 'Name and price are required',
          statusCode: 400
        });
      }

      if (price < 0) {
        return reply.status(400).send({
          success: false,
          error: 'Price must be positive',
          statusCode: 400
        });
      }

      // Convert arrays to JSON strings for MySQL
      const sizesJson = sizes ? JSON.stringify(sizes) : null;
      const colorsJson = colors ? JSON.stringify(colors) : null;

      const [result] = await db.query<ResultSetHeader>(
        `INSERT INTO products (
          name, description, category_id, sku, price,
          stock_quantity, min_stock_level, image_url,
          sizes, colors, limited_availability
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          description || null,
          category_id || null,
          sku || null,
          price,
          stock_quantity,
          min_stock_level,
          image_url || null,
          sizesJson,
          colorsJson,
          limited_availability
        ]
      );

      // Fetch the created product
      const [rows] = await db.query<RowDataPacket[]>(
        'SELECT * FROM products WHERE id = ?',
        [result.insertId]
      );

      const product = rows[0];

      return reply.status(201).send({
        success: true,
        data: product
      });
    } catch (error) {
      fastify.log.error(error);

      // Check for duplicate SKU error
      if ((error as any).code === 'ER_DUP_ENTRY') {
        return reply.status(409).send({
          success: false,
          error: 'Product with this SKU already exists',
          statusCode: 409
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'Failed to create product',
        statusCode: 500
      });
    }
  });

  /**
   * PUT /api/products/:id
   * Update product (admin only)
   */
  fastify.put<{
    Params: { id: string };
    Body: UpdateProductRequest
  }>('/products/:id', {
    preHandler: [authenticateToken, requireAdmin]
  }, async (request, reply) => {
    try {
      const productId = parseInt(request.params.id);

      if (isNaN(productId)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid product ID',
          statusCode: 400
        });
      }

      // Check if product exists
      const [existing] = await db.query<RowDataPacket[]>(
        'SELECT id FROM products WHERE id = ?',
        [productId]
      );

      if (existing.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Product not found',
          statusCode: 404
        });
      }

      const updates: string[] = [];
      const values: any[] = [];

      // Build dynamic update query
      const fields = [
        'name', 'description', 'category_id', 'sku', 'price',
        'stock_quantity', 'min_stock_level', 'image_url',
        'limited_availability', 'is_active'
      ];

      fields.forEach(field => {
        if (request.body[field as keyof UpdateProductRequest] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(request.body[field as keyof UpdateProductRequest]);
        }
      });

      // Handle JSON fields
      if (request.body.sizes !== undefined) {
        updates.push('sizes = ?');
        values.push(request.body.sizes ? JSON.stringify(request.body.sizes) : null);
      }

      if (request.body.colors !== undefined) {
        updates.push('colors = ?');
        values.push(request.body.colors ? JSON.stringify(request.body.colors) : null);
      }

      if (updates.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'No fields to update',
          statusCode: 400
        });
      }

      values.push(productId);

      await db.query(
        `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      // Fetch updated product
      const [rows] = await db.query<RowDataPacket[]>(
        'SELECT * FROM products WHERE id = ?',
        [productId]
      );

      const product = rows[0];

      return reply.send({
        success: true,
        data: product
      });
    } catch (error) {
      fastify.log.error(error);

      if ((error as any).code === 'ER_DUP_ENTRY') {
        return reply.status(409).send({
          success: false,
          error: 'Product with this SKU already exists',
          statusCode: 409
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'Failed to update product',
        statusCode: 500
      });
    }
  });

  /**
   * PATCH /api/products/:id/stock
   * Update product stock quantity (admin only)
   */
  fastify.patch<{
    Params: { id: string };
    Body: { stock_quantity: number }
  }>('/products/:id/stock', {
    preHandler: [authenticateToken, requireAdmin]
  }, async (request, reply) => {
    try {
      const productId = parseInt(request.params.id);
      const { stock_quantity } = request.body;

      if (isNaN(productId)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid product ID',
          statusCode: 400
        });
      }

      if (stock_quantity === undefined || stock_quantity < 0) {
        return reply.status(400).send({
          success: false,
          error: 'Valid stock quantity is required',
          statusCode: 400
        });
      }

      const [result] = await db.query<ResultSetHeader>(
        'UPDATE products SET stock_quantity = ? WHERE id = ?',
        [stock_quantity, productId]
      );

      if (result.affectedRows === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Product not found',
          statusCode: 404
        });
      }

      // Fetch updated product
      const [rows] = await db.query<RowDataPacket[]>(
        'SELECT * FROM products WHERE id = ?',
        [productId]
      );

      const product = rows[0];

      return reply.send({
        success: true,
        data: product
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to update stock',
        statusCode: 500
      });
    }
  });

  /**
   * DELETE /api/products/:id
   * Delete product (soft delete - sets is_active to false) (admin only)
   */
  fastify.delete<{ Params: { id: string } }>('/products/:id', {
    preHandler: [authenticateToken, requireAdmin]
  }, async (request, reply) => {
    try {
      const productId = parseInt(request.params.id);

      if (isNaN(productId)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid product ID',
          statusCode: 400
        });
      }

      // Soft delete - set is_active to false
      const [result] = await db.query<ResultSetHeader>(
        'UPDATE products SET is_active = 0 WHERE id = ?',
        [productId]
      );

      if (result.affectedRows === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Product not found',
          statusCode: 404
        });
      }

      return reply.send({
        success: true,
        data: { message: 'Product deleted successfully' }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to delete product',
        statusCode: 500
      });
    }
  });
}
