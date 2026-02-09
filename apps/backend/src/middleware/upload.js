const multer = require("multer");
const path = require("path");
const fs = require("fs");

// CAMINHO CORRETO para salvar
const uploadDir = path.join(process.cwd(), "uploads");
console.log("📁 Middleware: Diretório de upload:", uploadDir);

// Criar diretório uploads se não existir
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Pasta uploads criada:", uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(`📁 Salvando ${file.originalname} em ${uploadDir}`);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + "-" + uniqueSuffix + ext;
    console.log(`📁 Nome do arquivo: ${filename}`);
    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase(),
    );

    if (mimetype && extname) {
      console.log(`✅ Arquivo ${file.originalname} aceito`);
      return cb(null, true);
    } else {
      console.log(
        `❌ Arquivo ${file.originalname} rejeitado: tipo não suportado`,
      );
      cb(new Error("Apenas imagens são permitidas"));
    }
  },
});

module.exports = upload;
