var multer = require("multer");
require('dotenv').config()
const authConfig = require("../configs/auth.config");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
cloudinary.config({ cloud_name: authConfig.cloud_name, api_key: authConfig.api_key, api_secret: authConfig.api_secret, });



const storage = new CloudinaryStorage({ cloudinary: cloudinary, params: { folder: "Animal-sell-buy-Backend/profileImage", allowed_formats: ["jpg", "jpeg", "png", "PNG", "xlsx", "xls", "pdf", "PDF"], }, });
const profileImage = multer({ storage: storage });
const storage1 = new CloudinaryStorage({ cloudinary: cloudinary, params: { folder: "Animal-sell-buy-Backend/categoryUpload", allowed_formats: ["jpg", "jpeg", "png", "PNG", "xlsx", "xls", "pdf", "PDF"], }, });
const categoryUpload = multer({ storage: storage1 });
const storage2 = new CloudinaryStorage({ cloudinary: cloudinary, params: { folder: "Animal-sell-buy-Backend/subCategoryUpload", allowed_formats: ["jpg", "jpeg", "png", "PNG", "xlsx", "xls", "pdf", "PDF"], }, });
const subCategoryUpload = multer({ storage: storage2 });
const storage3 = new CloudinaryStorage({ cloudinary: cloudinary, params: { folder: "Animal-sell-buy-Backend/animalImage", allowed_formats: ["jpg", "jpeg", "png", "PNG", "xlsx", "xls", "pdf", "PDF"], }, });
const animalImage = multer({ storage: storage3 });
const storage4 = new CloudinaryStorage({ cloudinary: cloudinary, params: { folder: "Animal-sell-buy-Backend/couponImage", allowed_formats: ["jpg", "jpeg", "png", "PNG", "xlsx", "xls", "pdf", "PDF"], }, });
const couponImage = multer({ storage: storage4 });
const storage5 = new CloudinaryStorage({ cloudinary: cloudinary, params: { folder: "Animal-sell-buy-Backend/bannerImage", allowed_formats: ["jpg", "jpeg", "png", "PNG", "xlsx", "xls", "pdf", "PDF"], }, });
const bannerImage = multer({ storage: storage5 });




module.exports = { profileImage, categoryUpload, subCategoryUpload, animalImage, couponImage, bannerImage }