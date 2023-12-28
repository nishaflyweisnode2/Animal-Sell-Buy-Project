const auth = require("../controllers/adminController");
const express = require("express");
const router = express()


const authJwt = require("../middlewares/auth");

const { profileImage, categoryUpload, subCategoryUpload, animalImage, couponImage, bannerImage } = require('../middlewares/imageUpload');



module.exports = (app) => {

    // api/v1/admin/

    app.post("/api/v1/admin/registration", auth.registration);
    app.post("/api/v1/admin/login", auth.signin);
    app.put("/api/v1/admin/update", [authJwt.isAdmin], auth.update);
    app.get("/api/v1/admin/profile", [authJwt.isAdmin], auth.getAllUser);
    app.get("/api/v1/admin/profile/:userId", [authJwt.isAdmin], auth.getUserById);
    app.delete('/api/v1/admin/users/profile/delete/:id', [authJwt.isAdmin], auth.deleteUser);
    app.get('/api/v1/admin/users/pending-verification', [authJwt.isAdmin], auth.getPendingVerificationUsers);
    app.put('/api/v1/admin/users/:id/update-verification-status', [authJwt.isAdmin], auth.updateVerificationStatus);
    app.get('/api/v1/admin/verified-users', [authJwt.isAdmin], auth.getVerifiedUsers);
    app.post("/api/v1/admin/Category/addCategory", [authJwt.isAdmin], categoryUpload.single('image'), auth.createCategory);
    app.get("/api/v1/admin/Category/allCategory", [authJwt.isAdmin], auth.getCategories);
    app.put("/api/v1/admin/Category/updateCategory/:id", [authJwt.isAdmin], categoryUpload.single('image'), auth.updateCategory);
    app.delete("/api/v1/admin/Category/deleteCategory/:id", [authJwt.isAdmin], auth.removeCategory);
    app.post("/api/v1/admin/SubCategory/addSubCategory", [authJwt.isAdmin], /*subCategoryUpload.single('image'),*/ auth.createSubCategory);
    app.get("/api/v1/admin/SubCategory/allSubCategory", [authJwt.isAdmin], auth.getSubCategories);
    app.get('/api/v1/admin/SubCategory/category/:categoryId', [authJwt.isAdmin], auth.getSubCategoriesByCategoryId);
    app.put("/api/v1/admin/SubCategory/updateSubCategory/:id", [authJwt.isAdmin], /*subCategoryUpload.single('image'),*/ auth.updateSubCategory);
    app.delete("/api/v1/admin/SubCategory/deleteSubCategory/:id", [authJwt.isAdmin], auth.removeSubCategory);
    app.post('/api/v1/admin/animals', [authJwt.isAdmin], animalImage.array('image'), auth.createAnimal);
    app.get('/api/v1/admin/animals', [authJwt.isAdmin], auth.getAllAnimals);
    app.get('/api/v1/admin/animals/user', [authJwt.isAdmin], auth.getAllAnimalsForUser);
    app.get('/api/v1/admin/animals/:id', [authJwt.isAdmin], auth.getAnimalById);
    app.put('/api/v1/admin/animals/:id', [authJwt.isAdmin], animalImage.array('image'), auth.updateAnimal);
    app.delete('/api/v1/admin/animals/:id', [authJwt.isAdmin], auth.deleteAnimalById);
    app.post('/api/v1/admin/animals/:id/reviews', [authJwt.isAdmin], auth.addReview);
    app.get('/api/v1/admin/animals/:id/reviews', [authJwt.isAdmin], auth.getAllReviews);
    app.post('/api/v1/admin/seller-details', [authJwt.isAdmin], auth.createSellerDetails);
    app.get('/api/v1/admin/seller-details', [authJwt.isAdmin], auth.getAllSellerDetails);
    app.get('/api/v1/admin/seller-details/user', [authJwt.isAdmin], auth.getAllSellerDetailsForUser);
    app.get('/api/v1/admin/seller-details/animal/:animalId', [authJwt.isAdmin], auth.getSellerDetailsByAnimal);
    app.get('/api/v1/admin/seller-details/:id', [authJwt.isAdmin], auth.getSellerDetailsById);
    app.put('/api/v1/admin/seller-details/:id', [authJwt.isAdmin], auth.updateSellerDetails);
    app.delete('/api/v1/admin/seller-details/:id', [authJwt.isAdmin], auth.deleteSellerDetailsById);
    app.post('/api/v1/admin/addFavoriteSeller/:sellerId', [authJwt.isAdmin], auth.addFavoriteSeller);
    app.post('/api/v1/admin/addFavoriteAnimal/:animalId', [authJwt.isAdmin], auth.addFavoriteAnimal);
    app.delete('/api/v1/admin/removeFavoriteSeller/:sellerId', [authJwt.isAdmin], auth.removeFavoriteSeller);
    app.delete('/api/v1/admin/removeFavoriteAnimal/:animalId', [authJwt.isAdmin], auth.removeFavoriteAnimal);
    app.get('/api/v1/admin/getFavoriteSellers', [authJwt.isAdmin], auth.getFavoriteSellers);
    app.get('/api/v1/admin/getFavoriteAnimals', [authJwt.isAdmin], auth.getFavoriteAnimals);
    app.post('/api/v1/admin/coupons', [authJwt.isAdmin], couponImage.single('image'), auth.createCoupon);
    app.get('/api/v1/admin/coupons', [authJwt.isAdmin], auth.getAllCoupons);
    app.get('/api/v1/admin/coupons/:id', [authJwt.isAdmin], auth.getCouponById);
    app.put('/api/v1/admin/coupons/:id', [authJwt.isAdmin], couponImage.single('image'), auth.updateCouponById);
    app.delete('/api/v1/admin/coupons/:id', [authJwt.isAdmin], auth.deleteCouponById);
    app.post('/api/v1/admin/banners', [authJwt.isAdmin], bannerImage.single('image'), auth.createBanner);
    app.get('/api/v1/admin/banners', [authJwt.isAdmin], auth.getAllBanners);
    app.get('/api/v1/admin/banners/:id', [authJwt.isAdmin], auth.getBannerById);
    app.put('/api/v1/admin/banners/:id', [authJwt.isAdmin], bannerImage.single('image'), auth.updateBannerById);
    app.delete('/api/v1/admin/banners/:id', [authJwt.isAdmin], auth.deleteBannerById);

}