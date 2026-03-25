import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { db } from '../db/index.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { CreateWarehouseRequest, UpdateWarehouseRequest } from '../types';

export async function warehouseRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/warehouses
   * Get all active warehouses (authenticated users)
   * Used by the checkout flow to populate the warehouse dropdown
   */
  fastify.get('/warehouses', {
    preHandler: [authenticateToken]
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        'SELECT id, name, address FROM warehouses WHERE is_active = 1 ORDER BY name ASC'
      );
      return reply.send({ success: true, data: rows });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, error: 'Failed to fetch warehouses', statusCode: 500 });
    }
  });

  /**
   * GET /api/warehouses/all
   * Get all warehouses including inactive (admin only)
   * Used by the Admin Dashboard warehouses tab
   */
  fastify.get('/warehouses/all', {
    preHandler: [authenticateToken, requireAdmin]
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        'SELECT * FROM warehouses ORDER BY name ASC'
      );
      return reply.send({ success: true, data: rows });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, error: 'Failed to fetch warehouses', statusCode: 500 });
    }
  });

  /**
   * POST /api/warehouses
   * Create a new warehouse (admin only)
   */
  fastify.post<{ Body: CreateWarehouseRequest }>('/warehouses', {
    preHandler: [authenticateToken, requireAdmin]
  }, async (request, reply) => {
    try {
      const { name, address } = request.body;

      if (!name || !name.trim()) {
        return reply.status(400).send({
          success: false,
          error: 'Warehouse name is required',
          statusCode: 400
        });
      }

      const [result] = await db.query<ResultSetHeader>(
        'INSERT INTO warehouses (name, address) VALUES (?, ?)',
        [name.trim(), address?.trim() || null]
      );

      const [rows] = await db.query<RowDataPacket[]>(
        'SELECT * FROM warehouses WHERE id = ?',
        [result.insertId]
      );

      return reply.status(201).send({ success: true, data: rows[0] });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, error: 'Failed to create warehouse', statusCode: 500 });
    }
  });

  /**
   * PUT /api/warehouses/:id
   * Update a warehouse (admin only)
   */
  fastify.put<{ Params: { id: string }; Body: UpdateWarehouseRequest }>('/warehouses/:id', {
    preHandler: [authenticateToken, requireAdmin]
  }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id, 10);

      if (isNaN(id)) {
        return reply.status(400).send({ success: false, error: 'Invalid warehouse ID', statusCode: 400 });
      }

      const { name, address, is_active } = request.body;

      const updates: string[] = [];
      const values: (string | number | null)[] = [];

      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name.trim());
      }
      if (address !== undefined) {
        updates.push('address = ?');
        values.push(address?.trim() || null);
      }
      if (is_active !== undefined) {
        updates.push('is_active = ?');
        values.push(is_active ? 1 : 0);
      }

      if (updates.length === 0) {
        return reply.status(400).send({ success: false, error: 'No fields to update', statusCode: 400 });
      }

      updates.push('updated_at = NOW()');
      values.push(id);

      const [result] = await db.query<ResultSetHeader>(
        `UPDATE warehouses SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        return reply.status(404).send({ success: false, error: 'Warehouse not found', statusCode: 404 });
      }

      const [rows] = await db.query<RowDataPacket[]>(
        'SELECT * FROM warehouses WHERE id = ?',
        [id]
      );

      return reply.send({ success: true, data: rows[0] });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, error: 'Failed to update warehouse', statusCode: 500 });
    }
  });

  /**
   * DELETE /api/warehouses/:id
   * Delete a warehouse (admin only)
   * Returns 409 if any orders reference this warehouse — deactivate instead
   */
  fastify.delete<{ Params: { id: string } }>('/warehouses/:id', {
    preHandler: [authenticateToken, requireAdmin]
  }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id, 10);

      if (isNaN(id)) {
        return reply.status(400).send({ success: false, error: 'Invalid warehouse ID', statusCode: 400 });
      }

      // Prevent deletion if orders reference this warehouse
      const [orderCheck] = await db.query<RowDataPacket[]>(
        'SELECT COUNT(*) as cnt FROM orders WHERE warehouse_id = ?',
        [id]
      );

      if (orderCheck[0].cnt > 0) {
        return reply.status(409).send({
          success: false,
          error: 'Cannot delete a warehouse that has existing orders. Deactivate it instead.',
          statusCode: 409
        });
      }

      const [result] = await db.query<ResultSetHeader>(
        'DELETE FROM warehouses WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        return reply.status(404).send({ success: false, error: 'Warehouse not found', statusCode: 404 });
      }

      return reply.send({ success: true, data: { message: 'Warehouse deleted successfully' } });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, error: 'Failed to delete warehouse', statusCode: 500 });
    }
  });
}
