const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/CategoryController");

// Rotas CRUD para categorias
router.post("/categories", categoryController.create);
router.get("/categories", categoryController.getAll);
router.get("/categories/slug/:slug", categoryController.getBySlug);
router.get("/categories/:id", categoryController.getById);
router.put("/categories/:id", categoryController.update);
router.delete("/categories/:id", categoryController.delete);

module.exports = router;
