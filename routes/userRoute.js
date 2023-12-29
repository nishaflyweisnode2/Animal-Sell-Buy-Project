const auth = require("../controllers/userController");
const express = require("express");
const router = express()


const authJwt = require("../middlewares/auth");

const { profileImage, publishAddImage } = require('../middlewares/imageUpload');



module.exports = (app) => {

    // api/v1/user/

    app.post("/api/v1/user/loginWithPhone", auth.loginWithPhone);
    app.post("/api/v1/user/:id", auth.verifyOtp);
    app.post("/api/v1/user/resendOtp/:id", auth.resendOTP);
    app.post('/api/v1/user/socialLogin', auth.socialLogin);
    app.post("/api/v1/user/register/1", [authJwt.verifyToken], auth.registration);
    app.put("/api/v1/user/upload-profile-picture", [authJwt.verifyToken], profileImage.single('image'), auth.uploadProfilePicture);
    app.put("/api/v1/user/edit-profile", [authJwt.verifyToken], auth.editProfile);
    app.get("/api/v1/user/profile", [authJwt.verifyToken], auth.getUserProfile);
    app.get("/api/v1/user/profile/:userId", [authJwt.verifyToken], auth.getUserProfileById);
    app.put("/api/v1/user/updateLocation", [authJwt.verifyToken], auth.updateLocation);
    app.post('/api/v1/user/address/create', [authJwt.verifyToken], auth.createAddress);
    app.get('/api/v1/user/address/getAll', [authJwt.verifyToken], auth.getAllAddress);
    app.get('/api/v1/user/address/:id', [authJwt.verifyToken], auth.getAddressById);
    app.put('/api/v1/user/address/:id', [authJwt.verifyToken], auth.updateAddressById);
    app.delete('/api/v1/user/address/:id', [authJwt.verifyToken], auth.deleteAddressById);
    app.get('/api/v1/user/address/type/:type', [authJwt.verifyToken], auth.getAddressByType);
    app.put('/api/v1/user/notifications/:notificationId', [authJwt.verifyToken], auth.markNotificationAsRead);
    app.get('/api/v1/user/notifications/user/:userId', [authJwt.verifyToken], auth.getNotificationsForUser);
    app.get('/api/v1/user/notifications/user', [authJwt.verifyToken], auth.getAllNotificationsForUser);
    app.get("/api/v1/user/Category/allCategory", [authJwt.verifyToken], auth.getCategories);
    app.get("/api/v1/user/SubCategory/allSubCategory", [authJwt.verifyToken], auth.getSubCategories);
    app.get('/api/v1/user/SubCategory/category/:categoryId', [authJwt.verifyToken], auth.getSubCategoriesByCategoryId);
    app.get('/api/v1/user/animals', [authJwt.verifyToken], auth.getAllAnimals);
    app.get('/api/v1/user/animals/user', [authJwt.verifyToken], auth.getAllAnimalsForUser);
    app.get('/api/v1/user/category/:categoryId', [authJwt.verifyToken], auth.getAnimalsByCategory);
    app.get('/api/v1/user/subCategory/:subCategoryId', [authJwt.verifyToken], auth.getAnimalsBySubCategory);
    app.get('/api/v1/user/animal/search', [authJwt.verifyToken], auth.searchAnimals);
    app.get('/api/v1/user/animals/:id', [authJwt.verifyToken], auth.getAnimalById);
    app.post('/api/v1/user/animals/:id/reviews', [authJwt.verifyToken], auth.addReview);
    app.get('/api/v1/user/animals/:id/reviews', [authJwt.verifyToken], auth.getAllReviews);
    app.get('/api/v1/user/animals/:id/reviews/user', [authJwt.verifyToken], auth.getReviewsForUserAndAnimal);
    app.post('/api/v1/user/seller-details/user', [authJwt.verifyToken], auth.createSellerDetails);
    app.get('/api/v1/user/seller-details/user', [authJwt.verifyToken], auth.getAllSellerDetailsForUser);
    app.get('/api/v1/user/seller-details/animal/:animalId', [authJwt.verifyToken], auth.getSellerDetailsByAnimal);
    app.get('/api/v1/user/seller-details/:id', [authJwt.verifyToken], auth.getSellerDetailsById);
    app.put('/api/v1/user/seller-details/:id', [authJwt.verifyToken], auth.updateSellerDetails);
    app.delete('/api/v1/user/seller-details/:id', [authJwt.verifyToken], auth.deleteSellerDetailsById);
    app.post('/api/v1/user/addFavoriteSeller/:sellerId', [authJwt.verifyToken], auth.addFavoriteSeller);
    app.post('/api/v1/user/addFavoriteAnimal/:animalId', [authJwt.verifyToken], auth.addFavoriteAnimal);
    app.delete('/api/v1/user/removeFavoriteSeller/:sellerId', [authJwt.verifyToken], auth.removeFavoriteSeller);
    app.delete('/api/v1/user/removeFavoriteAnimal/:animalId', [authJwt.verifyToken], auth.removeFavoriteAnimal);
    app.get('/api/v1/user/getFavoriteSellers', [authJwt.verifyToken], auth.getFavoriteSellers);
    app.get('/api/v1/user/getFavoriteAnimals', [authJwt.verifyToken], auth.getFavoriteAnimals);
    app.get('/api/v1/user/coupons', [authJwt.verifyToken], auth.getAllCoupons);
    app.get('/api/v1/user/coupons/:id', [authJwt.verifyToken], auth.getCouponById);
    app.get('/api/v1/user/banners', [authJwt.verifyToken], auth.getAllBanners);
    app.get('/api/v1/user/banners/:id', [authJwt.verifyToken], auth.getBannerById);
    app.post('/api/v1/user/publish-ads/create', [authJwt.verifyToken], publishAddImage.array('images'), auth.createPublishAd);
    app.get('/api/v1/user/publish-ads/get', [authJwt.verifyToken], auth.getAllPublishAds);
    app.get('/api/v1/user/publish-ads/:id', [authJwt.verifyToken], auth.getPublishAdById);
    app.put('/api/v1/user/publish-ads/:id', [authJwt.verifyToken], publishAddImage.array('images'), auth.updatePublishAdById);
    app.delete('/api/v1/user/publish-ads/:id', [authJwt.verifyToken], auth.deletePublishAdById);
    app.get('/api/v1/user/subscription-plans', [authJwt.verifyToken], auth.getAllSubscriptionPlans);
    app.get('/api/v1/user/subscription-plans/:id', [authJwt.verifyToken], auth.getSubscriptionPlanById);
    app.post('/api/v1/user/user-subscriptions/create', [authJwt.verifyToken], auth.createUserSubscription);
    app.get('/api/v1/user/user-subscriptions/get', [authJwt.verifyToken], auth.getAllUserSubscriptions);
    app.get('/api/v1/user/user-subscriptions/:id', [authJwt.verifyToken], auth.getUserSubscriptionById);
    app.put('/api/v1/user/user-subscriptions/:id', [authJwt.verifyToken], auth.updateUserSubscriptionById);
    app.post('/api/v1/user/voice-call/initiate', [authJwt.verifyToken], auth.initiateVoiceCall);
    app.post('/api/v1/user/voice-call/:id/accept', [authJwt.verifyToken], auth.acceptVoiceCall);
    app.post('/api/v1/user/voice-call/:id/end', [authJwt.verifyToken], auth.endVoiceCall);
    app.post('/api/v1/user/voice-call/:id/missed', [authJwt.verifyToken], auth.missedVoiceCall);

}