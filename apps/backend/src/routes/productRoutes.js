const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const upload = require("../middleware/upload");

// Rotas CRUD para produtos COM upload
router.post(
  "/products",
  upload.fields([
    { name: "main_image", maxCount: 1 },
    { name: "gallery_images", maxCount: 10 },
  ]),
  productController.create,
);

// Rota para atualizar produto COM upload de imagens
router.put(
  "/products/:id",
  upload.fields([
    { name: "main_image", maxCount: 1 },
    { name: "gallery_images", maxCount: 10 },
  ]),
  productController.update, // ← ADICIONE upload aqui também!
);

// Rotas GET e DELETE (não precisam de upload)
router.get("/products", productController.getAll);
// routes/productRoutes.js - ADICIONE ESTA ROTA
router.get(
  "/products/category-id/:categoryId",
  productController.getByCategoryId,
);
router.get("/products/featured", productController.getFeatured);
router.get("/products/category/:category", productController.getByCategory);
router.get("/products/:id", productController.getById);
router.delete("/products/:id", productController.delete);

module.exports = router;
