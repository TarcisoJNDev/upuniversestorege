// routes/categoryRoutes.js - CORRIGIDO!
const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");

// ✅ AGORA AS ROTAS SÃO DIRETAS (sem /categories)
router.post("/", categoryController.create);
router.get("/", categoryController.getAll);
router.get("/with-count", categoryController.getAllWithProductCount);
router.get("/slug/:slug", categoryController.getBySlug);
router.get("/:id", categoryController.getById);
router.get("/:id/products", categoryController.getProductsByCategory);
router.get("/:id/product-count", categoryController.getProductCountByCategory);
router.put("/:id", categoryController.update);
router.delete("/:id", categoryController.delete);

module.exports = router;
