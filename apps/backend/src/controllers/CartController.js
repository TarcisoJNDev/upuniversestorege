// src/controllers/cartController.js
const Cart = require("../models/Cart");

class CartController {
  // Obter carrinho por sessionId
  async getCart(req, res) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: "sessionId é obrigatório",
        });
      }

      let cart = await Cart.findBySessionId(sessionId);

      if (!cart) {
        cart = { items: [], total: 0, count: 0 };
      }

      res.json({
        success: true,
        cart,
      });
    } catch (error) {
      console.error("❌ Erro ao buscar carrinho:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao buscar carrinho",
      });
    }
  }

  // Salvar carrinho
  async saveCart(req, res) {
    try {
      const { sessionId } = req.params;
      const cartData = req.body;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: "sessionId é obrigatório",
        });
      }

      await Cart.save(sessionId, cartData);

      res.json({
        success: true,
        message: "Carrinho salvo com sucesso",
      });
    } catch (error) {
      console.error("❌ Erro ao salvar carrinho:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao salvar carrinho",
      });
    }
  }

  // Limpar carrinho
  async clearCart(req, res) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: "sessionId é obrigatório",
        });
      }

      await Cart.save(sessionId, { items: [], total: 0, count: 0 });

      res.json({
        success: true,
        message: "Carrinho limpo com sucesso",
      });
    } catch (error) {
      console.error("❌ Erro ao limpar carrinho:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao limpar carrinho",
      });
    }
  }
}

module.exports = new CartController();
