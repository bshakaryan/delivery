const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb (null, "public/uploads/");
    },
    filename: function (req, file, cb) {
        cb (null, req.user.id + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    }
    else {
        cb(new Error("Загружать можно только изображения"), false);
    }
};

const upload = multer({storage: storage, fileFilter: fileFilter});

module.exports = upload;