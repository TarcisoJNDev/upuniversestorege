// src/routes/cartRoutes.js
const express = require("express");
const router = express.Router();
const cartController = require("../controllers/CartController");

// Rotas do carrinho baseadas em sessionId
router.get("/cart/:sessionId", cartController.getCart);
router.post("/cart/:sessionId", cartController.saveCart);
router.delete("/cart/:sessionId", cartController.clearCart);

module.exports = router;
