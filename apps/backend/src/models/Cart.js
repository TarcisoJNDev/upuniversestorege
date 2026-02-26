// src/models/Cart.js
const { pool } = require("../config/database-simple");

class Cart {
  // Buscar carrinho por sessionId
  static async findBySessionId(sessionId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT * FROM carts WHERE session_id = ?",
        [sessionId],
      );

      if (rows.length === 0) return null;

      return {
        sessionId: rows[0].session_id,
        items: JSON.parse(rows[0].items || "[]"),
        total: parseFloat(rows[0].total) || 0,
        count: parseInt(rows[0].count) || 0,
        updatedAt: rows[0].updated_at,
      };
    } finally {
      connection.release();
    }
  }

  // Salvar carrinho
  static async save(sessionId, cartData) {
    const connection = await pool.getConnection();
    try {
      const itemsJson = JSON.stringify(cartData.items || []);
      const total = cartData.total || 0;
      const count = cartData.count || 0;

      await connection.query(
        `INSERT INTO carts (session_id, items, total, count, updated_at) 
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE 
         items = VALUES(items),
         total = VALUES(total),
         count = VALUES(count),
         updated_at = NOW()`,
        [sessionId, itemsJson, total, count],
      );

      return true;
    } finally {
      connection.release();
    }
  }

  // Deletar carrinho
  static async delete(sessionId) {
    const connection = await pool.getConnection();
    try {
      await connection.query("DELETE FROM carts WHERE session_id = ?", [
        sessionId,
      ]);
      return true;
    } finally {
      connection.release();
    }
  }
}

module.exports = Cart;
