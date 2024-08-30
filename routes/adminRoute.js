const auth = require("../controllers/adminController");
const express = require("express");
const router = express()


const authJwt = require("../middlewares/auth");

const { profileImage, categoryUpload, subCategoryUpload, animalImage, couponImage, bannerImage, animalMelaImage, animalFeedsImage } = require('../middlewares/imageUpload');



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
    app.post('/api/v1/admin/subscription-plans', [authJwt.isAdmin], auth.createSubscriptionPlan);
    app.get('/api/v1/admin/subscription-plans', [authJwt.isAdmin], auth.getAllSubscriptionPlans);
    app.get('/api/v1/admin/subscription-plans/:id', [authJwt.isAdmin], auth.getSubscriptionPlanById);
    app.put('/api/v1/admin/subscription-plans/:id', [authJwt.isAdmin], auth.updateSubscriptionPlanById);
    app.delete('/api/v1/admin/subscription-plans/:id', [authJwt.isAdmin], auth.deleteSubscriptionPlanById);
    app.get('/api/v1/admin/user-subscriptions/get', [authJwt.isAdmin], auth.getAllUserSubscriptions);
    app.get('/api/v1/admin/user-subscriptions/:id', [authJwt.isAdmin], auth.getUserSubscriptionById);
    app.put('/api/v1/admin/user-subscriptions/:id', [authJwt.isAdmin], auth.updateUserSubscriptionById);
    app.delete('/api/v1/admin/user-subscriptions/:id', [authJwt.isAdmin], auth.deleteUserSubscriptionById);
    app.get('/api/v1/admin/publish-ads/get', [authJwt.isAdmin], auth.getAllPublishAds);
    app.get('/api/v1/admin/publish-ads/:id', [authJwt.isAdmin], auth.getPublishAdById);
    app.delete('/api/v1/admin/publish-ads/:id', [authJwt.isAdmin], auth.deletePublishAdById);
    app.get('/api/v1/admin/order/orders', [authJwt.isAdmin], auth.getAllorder)
    app.get('/api/v1/admin/order/Paid-orders', [authJwt.isAdmin], auth.getAllPaidOrder)
    app.put('/api/v1/admin/order/updateOrderStatus/:orderId', [authJwt.isAdmin], auth.updateOrderStatus);
    app.get('/api/v1/admin/:userId/wallet', [authJwt.isAdmin], auth.getUserWalletBalance);
    app.post('/api/v1/admin/mela/animalmela', [authJwt.isAdmin], animalMelaImage.array('image'), auth.createAnimalMela)
    app.get('/api/v1/admin/mela/animalmela', [authJwt.isAdmin], auth.getAnimalMela)
    app.get('/api/v1/admin/mela/animalmela/:id', [authJwt.isAdmin], auth.getAnimalMelaById)
    app.put('/api/v1/admin/mela/animalmela/:id', [authJwt.isAdmin], animalMelaImage.array('image'), auth.updateAnimalMela)
    app.delete('/api/v1/admin/mela/animalmela/:id', [authJwt.isAdmin], auth.deleteAnimalMelaById)
    app.post('/api/v1/admin/feed/animalfeeds', [authJwt.isAdmin], animalFeedsImage.array('image'), auth.createAnimalFeed);
    app.get('/api/v1/admin/feed/animalfeeds', [authJwt.isAdmin], auth.getAllAnimalFeeds);
    app.get('/api/v1/admin/feed/animalfeeds/:id', [authJwt.isAdmin], auth.getAnimalFeedById);
    app.put('/api/v1/admin/feed/animalfeeds/update/:id', [authJwt.isAdmin], animalFeedsImage.array('image'), auth.updateAnimalFeedById);
    app.delete('/api/v1/admin/feed/animalfeeds/:id', [authJwt.isAdmin], auth.deleteAnimalFeedById);
    app.post('/api/v1/admin/feed/animalfeeds/:id/reviews', [authJwt.isAdmin], auth.addReviewAndRating);
    app.get('/api/v1/admin/animalfeeds/:id/reviews', [authJwt.isAdmin], auth.getAllReviewsForAnimalFeed);
    app.get('/api/v1/admin/animalfeeds/reviews', [authJwt.isAdmin], auth.getReviewsByToken);
    app.get('/api/v1/admin/animalfeeds/reviews/:id', [authJwt.isAdmin], auth.getReviewsByTokenAndAnimalFeedId);
    app.post('/api/v1/admin/referral/create', [authJwt.isAdmin], auth.createReferral);
    app.put('/api/v1/admin/referral/:referralId', [authJwt.isAdmin], auth.updateReferralStatus);
    app.get('/api/v1/admin/referrals', [authJwt.isAdmin], auth.getAllReferrals);
    app.get('/api/v1/admin/referrals/:referralId', [authJwt.isAdmin], auth.getReferralById);
    app.delete('/api/v1/admin/referrals/:referralId', [authJwt.isAdmin], auth.deleteReferral);



}