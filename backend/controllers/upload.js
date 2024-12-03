const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cấu hình lưu tệp
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../public/image');  // Đảm bảo đường dẫn đúng
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);  // Lưu vào thư mục 'image'
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);  // Lưu tên tệp duy nhất
    }
});

const fileFilter = (req, file, cb) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.mimetype)) {
        return cb(new Error('Only images are allowed'), false); // Kiểm tra tệp
    }
    cb(null, true);
};

// Cấu hình multer
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },  // Giới hạn kích thước tệp là 10MB
    fileFilter: fileFilter
});

// Export middleware upload
module.exports = {
    uploadImage: upload.single('image')  // Tải lên một tệp
};
