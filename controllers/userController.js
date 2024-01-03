const User = require('../models/userModel');
const authConfig = require("../configs/auth.config");
const jwt = require("jsonwebtoken");
const newOTP = require("otp-generators");
const mongoose = require('mongoose');
const Notification = require('../models/notificationModel');
const Address = require("../models/addressModel");
const Category = require("../models/categoryModel");
const SubCategory = require("../models/subCategoryModel");
const Animal = require('../models/animalModel');
const SellerDetails = require('../models/sellerDetailsModel');
const Coupon = require('../models/couponModel');
const Banner = require('../models/bannerModel');
const PublishAd = require('../models/publishAddModel');
const SubscriptionPlan = require('../models/subscriptionPlanModel');
const UserSubscription = require('../models/userSubscriptionModel');
const cron = require('node-cron');
const VoiceCall = require('../models/voiceCallModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const Referral = require('../models/refferModel');
const CardDetail = require('../models/cardDetailsModel');
const AnimalMela = require('../models/animalMelaModel');
const AnimalFeed = require('../models/animalFeedModel');






const reffralCode = async () => {
    var digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let OTP = '';
    for (let i = 0; i < 9; i++) {
        OTP += digits[Math.floor(Math.random() * 36)];
    }
    return OTP;
}

exports.loginWithPhone = async (req, res) => {
    try {
        const { mobileNumber } = req.body;

        if (mobileNumber.replace(/\D/g, '').length !== 10) {
            return res.status(400).send({ status: 400, message: "Invalid mobileNumber number length" });
        }

        const user = await User.findOne({ mobileNumber: mobileNumber, userType: "USER" });
        if (!user) {
            let otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false });
            let otpExpiration = new Date(Date.now() + 60 * 1000);
            let accountVerification = false;
            const newUser = await User.create({ mobileNumber: mobileNumber, otp, otpExpiration, accountVerification, userType: "USER" });
            let obj = { id: newUser._id, otp: newUser.otp, mobileNumber: newUser.mobileNumber }
            const welcomeMessage = `Welcome, ${newUser.mobileNumber}! Thank you for registering.`;
            const welcomeNotification = new Notification({
                recipient: newUser._id,
                content: welcomeMessage,
                type: 'welcome',
            });
            await welcomeNotification.save();

            return res.status(200).send({ status: 200, message: "logged in successfully", data: obj });
        } else {
            const userObj = {};
            userObj.otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false });
            userObj.otpExpiration = new Date(Date.now() + 60 * 1000);
            userObj.accountVerification = false;
            const updated = await User.findOneAndUpdate({ mobileNumber: mobileNumber, userType: "USER" }, userObj, { new: true });
            let obj = { id: updated._id, otp: updated.otp, mobileNumber: updated.mobileNumber }
            return res.status(200).send({ status: 200, message: "logged in successfully", data: obj });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: "Server error" });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send({ status: 404, message: "user not found" });
        }
        console.log("Current Time:", new Date());
        console.log("OTP Expiration:", user.otpExpiration);

        if (user.otp !== otp || user.otpExpiration < Date.now()) {
            console.log("Invalid or expired OTP");
            return res.status(400).json({ status: 400, message: "Invalid or expired OTP" });
        }
        const updated = await User.findByIdAndUpdate({ _id: user._id }, { accountVerification: true }, { new: true });
        const accessToken = await jwt.sign({ id: user._id }, authConfig.secret, {
            expiresIn: authConfig.accessTokenTime,
        });
        let obj = {
            userId: updated._id,
            otp: updated.otp,
            mobileNumber: updated.mobileNumber,
            token: accessToken,
            completeProfile: updated.completeProfile
        }
        return res.status(200).send({ status: 200, message: "logged in successfully", data: obj });
    } catch (err) {
        console.log(err.message);
        return res.status(500).send({ status: 500, error: "internal server error" + err.message });
    }
};

exports.resendOTP = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findOne({ _id: id, userType: "USER" });
        if (!user) {
            return res.status(404).send({ status: 404, message: "User not found" });
        }
        const otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
        const otpExpiration = new Date(Date.now() + 60 * 1000);
        const accountVerification = false;
        const updated = await User.findOneAndUpdate({ _id: user._id }, { otp, otpExpiration, accountVerification }, { new: true });
        let obj = {
            id: updated._id,
            otp: updated.otp,
            mobileNumber: updated.mobileNumber
        }
        return res.status(200).send({ status: 200, message: "OTP resent", data: obj });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 500, message: "Server error" + error.message });
    }
};

exports.socialLogin = async (req, res) => {
    try {
        const { firstname, lastname, email, socialType } = req.body;

        const existingUser = await userModel.findOne({ $or: [{ email }], });

        if (existingUser) {
            const accessToken = jwt.sign({ id: existingUser.id, email: existingUser.email }, process.env.SECRETK, { expiresIn: "365d" });
            return res.status(200).json({
                status: 200,
                msg: "Login successfully",
                userId: existingUser._id,
                accessToken,
            });
        } else {
            const user = await userModel.create({ firstname, lastname, email, socialType, userType: "Distributor" });

            if (user) {
                const accessToken = jwt.sign({ id: user.id, email: user.email }, process.env.SECRETK, { expiresIn: "365d" });

                return res.status(200).json({
                    status: 200,
                    msg: "Login successfully",
                    userId: user._id,
                    accessToken,
                });
            }
        }
    } catch (err) {
        console.error("Error in socialLogin:", err);
        return res.status(500).json({
            status: 500,
            message: "Server error",
            error: err.message,
        });
    }
};

exports.registration = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user._id });
        if (user) {
            if (req.body.refferalCode == null || req.body.refferalCode == undefined) {
                req.body.otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
                req.body.otpExpiration = new Date(Date.now() + 60 * 1000);
                req.body.accountVerification = true;
                req.body.refferalCode = await reffralCode();
                req.body.completeProfile = true;
                const userCreate = await User.findOneAndUpdate({ _id: user._id }, req.body, { new: true, });
                let obj = { id: userCreate._id, completeProfile: userCreate.completeProfile, phone: userCreate.mobileNumber }
                return res.status(200).send({ status: 200, message: "Registered successfully ", data: obj, });
            } else {
                const findUser = await User.findOne({ refferalCode: req.body.refferalCode });
                if (findUser) {
                    req.body.otp = newOTP.generate(6, { alphabets: false, upperCase: false, specialChar: false, });
                    req.body.otpExpiration = new Date(Date.now() + 60 * 1000);
                    req.body.accountVerification = true;
                    req.body.userType = "USER";
                    req.body.refferalCode = await reffralCode();
                    req.body.refferUserId = findUser._id;
                    req.body.completeProfile = true;
                    const userCreate = await User.findOneAndUpdate({ _id: user._id }, req.body, { new: true, });
                    if (userCreate) {
                        let updateWallet = await User.findOneAndUpdate({ _id: findUser._id }, { $push: { joinUser: userCreate._id } }, { new: true });
                        let obj = { id: userCreate._id, completeProfile: userCreate.completeProfile, phone: userCreate.mobileNumber }
                        return res.status(200).send({ status: 200, message: "Registered successfully ", data: obj, });
                    }
                } else {
                    return res.status(404).send({ status: 404, message: "Invalid refferal code", data: {} });
                }
            }
        } else {
            return res.status(404).send({ status: 404, msg: "Not found" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: "Server error" });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const memberSince = user.createdAt.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
        });

        return res.status(200).json({
            status: 200,
            data: {
                user,
                memberSince,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.getUserProfileById = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const memberSince = user.createdAt.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
        });

        return res.status(200).json({
            status: 200, data: {
                user,
                memberSince,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.uploadProfilePicture = async (req, res) => {
    try {
        const userId = req.user._id;

        if (!req.file) {
            return res.status(400).json({ status: 400, error: "Image file is required" });
        }

        const updatedUser = await User.findByIdAndUpdate(userId, { image: req.file.path, }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        return res.status(200).json({ status: 200, message: 'Profile Picture Uploaded successfully', data: updatedUser });
    } catch (error) {
        return res.status(500).json({ status: 500, message: 'Failed to upload profile picture', error: error.message });
    }
};

exports.editProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const { firstName, lastName, email, mobileNumber } = req.body;

        const updateObject = {};
        if (firstName) updateObject.firstName = firstName;
        if (lastName) updateObject.lastName = lastName;
        if (email) updateObject.email = email;
        if (mobileNumber) updateObject.mobileNumber = mobileNumber;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateObject },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        return res.status(200).json({ status: 200, message: 'Edit Profile updated successfully', data: updatedUser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.updateLocation = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user._id });
        if (!user) {
            return res.status(404).send({ status: 404, message: "User not found" });
        }

        let updateFields = {};

        if (req.body.currentLat || req.body.currentLong) {
            const coordinates = [parseFloat(req.body.currentLat), parseFloat(req.body.currentLong)];
            updateFields.currentLocation = { type: "Point", coordinates };
        }

        const updatedUser = await User.findByIdAndUpdate(
            { _id: user._id },
            { $set: updateFields },
            { new: true }
        );

        if (updatedUser) {
            let obj = {
                currentLocation: updatedUser.currentLocation
            };
            return res.status(200).send({ status: 200, message: "Location update successful.", data: obj });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 500, message: "Server error" + error.message });
    }
};

exports.createAddress = async (req, res) => {
    try {
        const userId = req.user._id;

        const { name, coordinates, type, address } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const pickupLocation = new Address({
            user: user.id,
            name,
            coordinates,
            type,
            address,
        });

        const savedPickupLocation = await pickupLocation.save();

        return res.status(201).json({
            status: 201,
            message: 'Address created successfully',
            data: { pickupLocation: savedPickupLocation },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.getAllAddress = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const address = await Address.find({ user: userId });

        return res.status(200).json({ status: 200, data: address });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.getAddressById = async (req, res) => {
    try {
        const addressId = req.params.id;
        const address = await Address.findById(addressId);

        if (!address) {
            return res.status(404).json({ status: 404, message: 'address not found' });
        }

        return res.status(200).json({ status: 200, data: address });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.updateAddressById = async (req, res) => {
    try {
        const userId = req.user._id;
        const addressId = req.params.id;
        const updateFields = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const existingAddress = await Address.findById(addressId);

        if (!existingAddress) {
            return res.status(404).json({ status: 404, message: 'Address not found' });
        }

        if (existingAddress.user.toString() !== userId.toString()) {
            return res.status(403).json({ status: 403, message: 'Unauthorized: User does not have permission to update this Address' });
        }

        const updatedAddress = await Address.findByIdAndUpdate(addressId, updateFields, { new: true });

        return res.status(200).json({
            status: 200,
            message: 'Address updated successfully',
            data: updatedAddress,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.deleteAddressById = async (req, res) => {
    try {
        const addressId = req.params.id;
        const deletedLocation = await Address.findByIdAndDelete(addressId);

        if (!deletedLocation) {
            return res.status(404).json({ status: 404, message: 'Address not found' });
        }

        return res.status(200).json({ status: 200, message: 'Address deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.getAddressByType = async (req, res) => {
    try {
        const { type } = req.params;

        const locations = await Address.find({ type: type });
        console.log(locations);

        if (locations && locations.length > 0) {
            return res.json(locations);
        } else {
            return res.status(404).json({ status: 404, message: `No address found for type: ${type}` });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: `Failed to retrieve address for type: ${type}` });
    }
};

exports.markNotificationAsRead = async (req, res) => {
    try {
        const notificationId = req.params.notificationId;

        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { status: 'read' },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ status: 404, message: 'Notification not found' });
        }

        return res.status(200).json({ status: 200, message: 'Notification marked as read', data: notification });
    } catch (error) {
        return res.status(500).json({ status: 500, message: 'Error marking notification as read', error: error.message });
    }
};

exports.getNotificationsForUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const notifications = await Notification.find({ recipient: userId });

        return res.status(200).json({ status: 200, message: 'Notifications retrieved successfully', data: notifications });
    } catch (error) {
        return res.status(500).json({ status: 500, message: 'Error retrieving notifications', error: error.message });
    }
};

exports.getAllNotificationsForUser = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }
        const notifications = await Notification.find({ recipient: userId });

        return res.status(200).json({ status: 200, message: 'Notifications retrieved successfully', data: notifications });
    } catch (error) {
        return res.status(500).json({ status: 500, message: 'Error retrieving notifications', error: error.message });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find({});
        return res.status(200).json({ status: 200, message: "Category Found", data: categories, });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: "Internal server error", data: error.message });
    }
};

exports.getSubCategories = async (req, res) => {
    try {
        const SubCategories = await SubCategory.find({}).populate('Category');
        return res.status(200).json({ status: 200, message: "SubCategories Found", data: SubCategories, });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: "Internal server error", data: error.message });
    }
};

exports.getSubCategoriesByCategoryId = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const SubCategories = await SubCategory.find({ Category: categoryId }).populate('Category');

        if (!SubCategories || SubCategories.length === 0) {
            return res.status(404).json({ message: "Subcategories Not Found for the specified Category ID", status: 404, data: {} });
        }

        return res.status(200).json({ message: "SubCategories Found", status: 200, data: SubCategories });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: "Internal server error", data: error.message });
    }
};

exports.getAllAnimals = async (req, res) => {
    try {
        const animals = await Animal.find().populate('reviews.user category subCategory owner');
        return res.status(200).json({ status: 200, message: 'Animals retrieved successfully', data: animals });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getAllAnimalsForUser = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const animals = await Animal.find({ owner: userId }).populate('reviews.user category subCategory owner');
        return res.status(200).json({ status: 200, message: 'Animals retrieved successfully', data: animals });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getAnimalsByCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ status: 400, message: 'Invalid category ID', data: {} });
        }

        const animals = await Animal.find({ 'category': categoryId })
            .populate('reviews.user category subCategory owner');

        return res.status(200).json({ status: 200, message: 'Animals retrieved successfully', data: animals });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.searchAnimals = async (req, res) => {
    try {
        const { search } = req.query;

        const animalCount = await Animal.countDocuments();

        if (search) {
            let data1 = [
                {
                    $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "category" },
                },
                { $unwind: "$category" },
                {
                    $lookup: { from: "subcategories", localField: "subCategory", foreignField: "_id", as: "subCategory", },
                },
                { $unwind: "$subCategory" },
                {
                    $match: {
                        $or: [
                            { "category.name": { $regex: search, $options: "i" }, },
                            { "subCategory.name": { $regex: search, $options: "i" }, },
                            { "name": { $regex: search, $options: "i" }, },
                            { "description": { $regex: search, $options: "i" }, },
                            { "breed": { $regex: search, $options: "i" }, },
                        ]
                    }
                },
                { $sort: { numOfReviews: -1 } }
            ]
            let apiFeature = await Animal.aggregate(data1);
            return res.status(200).json({ status: 200, message: "Animal data found.", data: apiFeature, count: animalCount });
        } else {
            let apiFeature = await Animal.aggregate([
                { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "category" } },
                { $unwind: "$category" },
                { $lookup: { from: "subcategories", localField: "subCategory", foreignField: "_id", as: "subCategory", }, },
                { $unwind: "$subCategory" },
                { $sort: { numOfReviews: -1 } }
            ]);

            return res.status(200).json({ status: 200, message: "Animal data found.", data: apiFeature, count: animalCount });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Error searching products', error: error.message });
    }
};

exports.getAnimalsBySubCategory = async (req, res) => {
    try {
        const subCategoryId = req.params.subCategoryId;

        if (!mongoose.Types.ObjectId.isValid(subCategoryId)) {
            return res.status(400).json({ status: 400, message: 'Invalid category ID', data: {} });
        }

        const animals = await Animal.find({ 'subCategory': subCategoryId })
            .populate('reviews.user category subCategory owner');

        return res.status(200).json({ status: 200, message: 'Animals retrieved successfully', data: animals });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getAnimalById = async (req, res) => {
    try {
        const animal = await Animal.findById(req.params.id).populate('reviews.user category subCategory owner');
        if (!animal) {
            return res.status(404).json({ status: 404, message: 'Animal not found', data: {} });
        }
        return res.status(200).json({ status: 200, message: 'Animal retrieved successfully', data: animal });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const animalId = req.params.id;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const animal = await Animal.findById(animalId);
        if (!animal) {
            return res.status(404).json({ status: 404, message: 'Animal not found', data: {} });
        }

        if (rating < 0 || rating > 5) {
            return res.status(400).json({ status: 400, message: 'Invalid rating. Rating should be between 0 and 5.', data: {} });
        }

        const newReview = { user: user._id, name: user.firstName + " " + user.lastName, rating, comment };
        animal.reviews.push(newReview);

        animal.rating = parseFloat(((animal.rating * animal.numOfUserReviews + rating) / (animal.numOfUserReviews + 1)).toFixed(2));

        animal.numOfUserReviews += 1;
        await animal.save();

        return res.status(201).json({ status: 201, message: 'Review added successfully', data: newReview });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getAllReviews = async (req, res) => {
    try {
        const animalId = req.params.id;

        const animal = await Animal.findById(animalId).populate({
            path: 'reviews.user',
            select: 'firstName lastName image mobileNumber email',
        });
        if (!animal) {
            return res.status(404).json({ status: 404, message: 'Animal not found', data: {} });
        }

        const reviews = animal.reviews;

        return res.status(200).json({ status: 200, message: 'Reviews retrieved successfully', data: reviews });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getReviewsForUserAndAnimal = async (req, res) => {
    try {
        const userId = req.user._id;
        const animalId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const animal = await Animal.findById(animalId).populate({
            path: 'reviews.user',
            select: 'firstName lastName image mobileNumber email',
        });
        if (!animal) {
            return res.status(404).json({ status: 404, message: 'Animal not found', data: {} });
        }

        const userReview = animal.reviews.find(review => review.user.equals(userId));

        if (!userReview) {
            return res.status(404).json({ status: 404, message: 'Review not found for the specified user and animal', data: {} });
        }

        return res.status(200).json({ status: 200, message: 'Review retrieved successfully', data: userReview });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.createSellerDetails = async (req, res) => {
    try {
        const { animal, flock, address, safetyTips } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const animalId = await Animal.findById(animal);
        if (!animalId) {
            return res.status(404).json({ status: 404, message: 'Animal not found' });
        }

        if (userId.toString() !== animalId.owner.toString()) {
            return res.status(403).json({ status: 403, message: 'Access forbidden. You are not the owner of the animal.' });
        }

        const existingSeller = await SellerDetails.findOne({ animal: animalId });
        if (existingSeller) {
            return res.status(400).json({ status: 400, message: 'Seller details already exist for this animal.' });
        }

        const memberSince = user.createdAt.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
        });

        const newSellerDetails = new SellerDetails({
            sellerDetails: user._id,
            animal,
            sellerName: user.firstName + " " + user.lastName,
            flock,
            age: animalId.age,
            weight: animalId.weight,
            joinedDate: memberSince,
            productDescription: animalId.description,
            breed: animalId.breed,
            location: animalId.location,
            contactNumber: user.mobileNumber,
            address,
            safetyTips,
        });

        await newSellerDetails.save();

        return res.status(201).json({ status: 201, message: 'Seller details created successfully', data: newSellerDetails });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getAllSellerDetails = async (req, res) => {
    try {
        const allSellerDetails = await SellerDetails.find().populate('sellerDetails animal');
        return res.status(200).json({ status: 200, message: 'All seller details retrieved successfully', data: allSellerDetails });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getAllSellerDetailsForUser = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const userSellerDetails = await SellerDetails.find({ sellerDetails: userId }).populate('sellerDetails animal');
        return res.status(200).json({ status: 200, message: 'Seller details retrieved successfully', data: userSellerDetails });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getSellerDetailsByAnimal = async (req, res) => {
    try {
        const animalId = req.params.animalId;

        await SellerDetails.findOneAndUpdate({ animal: animalId }, { $inc: { views: 1 } });

        const userSellerDetails = await SellerDetails.find({ animal: animalId }).populate('sellerDetails animal');

        return res.status(200).json({ status: 200, message: 'Seller details retrieved successfully', data: userSellerDetails });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getSellerDetailsById = async (req, res) => {
    try {
        const sellerDetails = await SellerDetails.findById(req.params.id).populate('sellerDetails animal');
        if (!sellerDetails) {
            return res.status(404).json({ message: 'Seller details not found', data: {} });
        }
        return res.status(200).json({ status: 200, message: 'Seller details retrieved successfully', data: sellerDetails });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.updateSellerDetails = async (req, res) => {
    try {
        const { flock, address, safetyTips } = req.body;
        const userId = req.user._id;
        const sellerDetailsId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const sellerDetails = await SellerDetails.findById(sellerDetailsId);
        if (!sellerDetails) {
            return res.status(404).json({ status: 404, message: 'Seller details not found' });
        }

        if (sellerDetails.sellerDetails.toString() !== userId.toString()) {
            return res.status(403).json({ status: 403, message: 'Unauthorized: You are not the owner of this seller details' });
        }

        sellerDetails.flock = flock;
        sellerDetails.address = address;
        sellerDetails.safetyTips = safetyTips;

        await sellerDetails.save();

        return res.status(200).json({ status: 200, message: 'Seller details updated successfully', data: sellerDetails });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.deleteSellerDetailsById = async (req, res) => {
    try {
        const deletedSellerDetails = await SellerDetails.findByIdAndDelete(req.params.id);
        if (!deletedSellerDetails) {
            return res.status(404).json({ status: 404, message: 'Seller details not found', data: {} });
        }
        return res.status(200).json({ status: 200, message: 'Seller details deleted successfully', data: deletedSellerDetails });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.addFavoriteAnimal = async (req, res) => {
    try {
        const userId = req.user._id;
        const animalId = req.params.animalId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const animal = await Animal.findById(animalId);
        if (!animal) {
            return res.status(404).json({ status: 404, message: 'Animal not found' });
        }

        if (user.favouriteAnimal.includes(animalId)) {
            return res.status(400).json({ status: 400, message: 'Animal is already in favorites' });
        }

        user.favouriteAnimal.push(animalId);
        await user.save();

        return res.status(200).json({ status: 200, message: 'Favorite seller added successfully', data: user.favouriteAnimal });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.addFavoriteSeller = async (req, res) => {
    try {
        const userId = req.user._id;
        const sellerId = req.params.sellerId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const seller = await SellerDetails.findById(sellerId);
        if (!seller) {
            return res.status(404).json({ status: 404, message: 'Seller not found' });
        }

        if (user.favouriteSeller.includes(sellerId)) {
            return res.status(400).json({ status: 400, message: 'Seller is already in favorites' });
        }

        user.favouriteSeller.push(sellerId);
        await user.save();

        seller.favorites += 1;
        await seller.save();

        return res.status(200).json({ status: 200, message: 'Favorite seller added successfully', data: user.favouriteSeller });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getFavoriteSellers = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).populate('favouriteSeller');

        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const favoriteSellers = user.favouriteSeller;
        return res.status(200).json({ status: 200, message: 'Favorite sellers retrieved successfully', data: favoriteSellers });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getFavoriteAnimals = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).populate('favouriteAnimal');

        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const favoriteAnimals = user.favouriteAnimal;
        return res.status(200).json({ status: 200, message: 'Favorite animals retrieved successfully', data: favoriteAnimals });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.removeFavoriteAnimal = async (req, res) => {
    try {
        const userId = req.user._id;
        const animalId = req.params.animalId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const animal = await Animal.findById(animalId);
        if (!animal) {
            return res.status(404).json({ status: 404, message: 'Seller not found' });
        }

        if (!user.favouriteAnimal.includes(animalId)) {
            return res.status(400).json({ status: 400, message: 'Seller is not in favorites' });
        }

        user.favouriteAnimal = user.favouriteAnimal.filter(id => id.toString() !== animalId);
        await user.save();

        return res.status(200).json({ status: 200, message: 'Favorite seller removed successfully', data: user.favouriteAnimal });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.removeFavoriteSeller = async (req, res) => {
    try {
        const userId = req.user._id;
        const sellerId = req.params.sellerId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const seller = await SellerDetails.findById(sellerId);
        if (!seller) {
            return res.status(404).json({ status: 404, message: 'Seller not found' });
        }

        if (!user.favouriteSeller.includes(sellerId)) {
            return res.status(400).json({ status: 400, message: 'Seller is not in favorites' });
        }

        user.favouriteSeller = user.favouriteSeller.filter(id => id.toString() !== sellerId);
        await user.save();

        seller.favorites = Math.max(seller.favorites - 1, 0);
        await seller.save();

        return res.status(200).json({ status: 200, message: 'Favorite seller removed successfully', data: user.favouriteSeller });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.status(200).json({ status: 200, data: coupons });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.getCouponById = async (req, res) => {
    try {
        const couponId = req.params.id;
        const coupon = await Coupon.findById(couponId);

        if (!coupon) {
            return res.status(404).json({ status: 404, message: 'Coupon not found' });
        }

        res.status(200).json({ status: 200, data: coupon });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.getAllBanners = async (req, res) => {
    try {
        const banners = await Banner.find();
        res.status(200).json({ status: 200, message: 'Banners retrieved successfully', data: banners });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.getBannerById = async (req, res) => {
    try {
        const bannerId = req.params.id;
        const banner = await Banner.findById(bannerId);

        if (!banner) {
            return res.status(404).json({ status: 404, message: 'Banner not found' });
        }

        res.status(200).json({ status: 200, message: 'Banner retrieved successfully', data: banner });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.createPublishAd = async (req, res) => {
    try {
        const { species, breed, age, gender, colour, location, address, healthCondition, vaccinationStatus, medicalHistory, microchipID, temperament, trainingLevel, socialization, videos, price, negotiation, reasonForSelling } = req.body;

        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const findCategory = await Category.findById(species);
        if (!findCategory) {
            return res.status(409).json({ message: "Category Not found.", status: 404, data: {} });
        }

        const findSubCategory = await SubCategory.findById(breed);
        if (!findSubCategory) {
            return res.status(409).json({ message: "SubCategory Not Found.", status: 404, data: {} });
        }

        let images = [];
        if (req.files) {
            for (let j = 0; j < req.files.length; j++) {
                let obj = {
                    img: req.files[j].path,
                };
                images.push(obj);
            }
        }

        const { type, coordinates } = location;
        const formattedLocation = {
            type,
            coordinates: coordinates.map(coord => parseFloat(coord)),
        };

        const formattedAddress = {
            houseNo: address.houseNo,
            street: address.street,
            state: address.state,
            city: address.city,
            pincode: address.pincode,
        };

        const newPublishAd = new PublishAd({
            postBy: user._id,
            species,
            breed,
            age,
            gender,
            colour,
            location: formattedLocation,
            address: formattedAddress,
            healthCondition,
            vaccinationStatus,
            medicalHistory,
            microchipID,
            temperament,
            trainingLevel,
            socialization,
            images,
            videos,
            price,
            negotiation,
            reasonForSelling,
        });

        await newPublishAd.save();

        res.status(201).json({ message: 'Publish ad created successfully', data: newPublishAd });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', data: error.message });
    }
};

exports.getAllPublishAds = async (req, res) => {
    try {
        const allPublishAds = await PublishAd.find().populate('species breed postBy').populate({
            path: 'comments.user',
            model: 'User',
            select: 'firstName lastName image mobileNumber email',
        });

        const adsWithCounts = allPublishAds.map(ad => {
            const { _id, likes, dislikes, ...rest } = ad._doc;
            const likeCount = likes.length;
            const dislikeCount = dislikes.length;
            return { _id, likeCount, dislikeCount, ...rest };
        });

        res.status(200).json({ message: 'All publish ads retrieved successfully', data: adsWithCounts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', data: error.message });
    }
};

exports.getAllPublishUserAds = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const allPublishAds = await PublishAd.find({ postBy: userId }).populate('species breed postBy').populate({
            path: 'comments.user',
            model: 'User',
            select: 'firstName lastName image mobileNumber email',
        });

        const adsWithCounts = allPublishAds.map(ad => {
            const { _id, likes, dislikes, ...rest } = ad._doc;
            const likeCount = likes.length;
            const dislikeCount = dislikes.length;
            return { _id, likeCount, dislikeCount, ...rest };
        });

        res.status(200).json({ message: 'All publish ads retrieved successfully', data: adsWithCounts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', data: error.message });
    }
};

exports.getPublishAdById = async (req, res) => {
    try {
        const publishAdId = req.params.id;
        const publishAd = await PublishAd.findById(publishAdId).populate('species breed postBy').populate({
            path: 'comments.user',
            model: 'User',
            select: 'firstName lastName image mobileNumber email',
        });

        if (!publishAd) {
            return res.status(404).json({ status: 404, message: 'Publish ad not found' });
        }

        const { _id, likes, dislikes, ...rest } = publishAd._doc;
        const likeCount = likes.length;
        const dislikeCount = dislikes.length;

        const publishAdWithCounts = { _id, likeCount, dislikeCount, ...rest };

        res.status(200).json({ message: 'Publish ad retrieved successfully', data: publishAdWithCounts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', data: error.message });
    }
};

exports.updatePublishAdById = async (req, res) => {
    try {
        const publishAdId = req.params.id;
        const updateFields = req.body;

        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        if (updateFields.species) {
            const findCategory = await Category.findById(updateFields.species);
            if (!findCategory) {
                return res.status(409).json({ message: "Category Not found.", status: 404, data: {} });
            }
        }

        if (updateFields.breed) {
            const findSubCategory = await SubCategory.findById(updateFields.breed);
            if (!findSubCategory) {
                return res.status(409).json({ message: "SubCategory Not Found.", status: 404, data: {} });
            }
        }


        if (updateFields.location) {
            const { type, coordinates } = updateFields.location;
            updateFields.location = {
                type,
                coordinates: coordinates.map(coord => parseFloat(coord)),
            };
        }

        if (updateFields.address) {
            updateFields.address = {
                houseNo: updateFields.address.houseNo,
                street: updateFields.address.street,
                state: updateFields.address.state,
                city: updateFields.address.city,
                pincode: updateFields.address.pincode,
            };
        }

        if (req.files) {
            if (req.files.images) {
                updateFields.images = req.files.images.map(image => ({ img: image.path }));
            }

            if (req.files.videos) {
                updateFields.videos = req.files.videos.map(video => ({ vid: video.path }));
            }
        }

        const updatedPublishAd = await PublishAd.findByIdAndUpdate(
            { _id: publishAdId, postBy: userId },
            updateFields,
            { new: true }
        );

        if (!updatedPublishAd) {
            return res.status(404).json({ status: 404, message: 'Publish ad not found' });
        }

        res.status(200).json({ status: 200, message: 'Publish ad updated successfully', data: updatedPublishAd });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.deletePublishAdById = async (req, res) => {
    try {
        const publishAdId = req.params.id;

        const deletedPublishAd = await PublishAd.findByIdAndDelete(publishAdId);

        if (!deletedPublishAd) {
            return res.status(404).json({ status: 404, message: 'Publish ad not found' });
        }

        res.status(200).json({ message: 'Publish ad deleted successfully', data: deletedPublishAd });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', data: error.message });
    }
};

exports.likePublishAd = async (req, res) => {
    try {
        const publishAdId = req.params.id;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(publishAdId)) {
            return res.status(400).json({ status: 400, message: 'Invalid Animal Mela ID' });
        }

        const publishAd = await PublishAd.findById(publishAdId);
        if (!publishAd) {
            return res.status(404).json({ status: 404, message: 'Animal Mela not found' });
        }

        const userLikedIndex = publishAd.likes.findIndex(like => like.user.equals(userId));
        const userDislikedIndex = publishAd.dislikes.findIndex(dislike => dislike.user.equals(userId));

        if (userLikedIndex !== -1) {
            publishAd.likes.splice(userLikedIndex, 1);
        } else {
            publishAd.likes.push({ user: userId });

            if (userDislikedIndex !== -1) {
                publishAd.dislikes.splice(userDislikedIndex, 1);
            }
        }

        await publishAd.save();

        return res.status(200).json({ status: 200, message: 'Animal Mela liked successfully', data: publishAd });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.dislikePublishAd = async (req, res) => {
    try {
        const publishAdId = req.params.id;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(publishAdId)) {
            return res.status(400).json({ status: 400, message: 'Invalid Animal Mela ID' });
        }

        const publishAd = await PublishAd.findById(publishAdId);
        if (!publishAd) {
            return res.status(404).json({ status: 404, message: 'Animal Mela not found' });
        }

        const userLikedIndex = publishAd.likes.findIndex(like => like.user.equals(userId));
        const userDislikedIndex = publishAd.dislikes.findIndex(dislike => dislike.user.equals(userId));

        if (userDislikedIndex !== -1) {
            publishAd.dislikes.splice(userDislikedIndex, 1);
        } else {
            publishAd.dislikes.push({ user: userId });

            if (userLikedIndex !== -1) {
                publishAd.likes.splice(userLikedIndex, 1);
            }
        }

        await publishAd.save();

        return res.status(200).json({ status: 200, message: 'Animal Mela disliked successfully', data: publishAd });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.commentOnPublishAd = async (req, res) => {
    try {
        const publishAdId = req.params.id;
        const userId = req.user._id;
        const { text } = req.body;

        if (!mongoose.Types.ObjectId.isValid(publishAdId)) {
            return res.status(400).json({ status: 400, message: 'Invalid Animal Mela ID' });
        }

        const publishAd = await PublishAd.findById(publishAdId);
        if (!publishAd) {
            return res.status(404).json({ status: 404, message: 'Animal Mela not found' });
        }

        publishAd.comments.push({ user: userId, text });
        await publishAd.save();

        return res.status(200).json({ status: 200, message: 'Comment added successfully', data: publishAd });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getAllSubscriptionPlans = async (req, res) => {
    try {
        const allSubscriptionPlans = await SubscriptionPlan.find();

        return res.status(200).json({ status: 200, message: 'All subscription plans retrieved successfully', data: allSubscriptionPlans });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', data: error.message });
    }
};

exports.getSubscriptionPlanById = async (req, res) => {
    try {
        const subscriptionPlanId = req.params.id;
        const subscriptionPlan = await SubscriptionPlan.findById(subscriptionPlanId);

        if (!subscriptionPlan) {
            return res.status(404).json({ status: 404, message: 'Subscription plan not found' });
        }

        return res.status(200).json({ status: 200, message: 'Subscription plan retrieved successfully', data: subscriptionPlan });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', data: error.message });
    }
};

function calculateEndDate(startDate, duration) {
    const [value, unit] = duration.split(' ');

    const unitMapping = {
        month: 'Month',
    };

    const endDate = new Date(startDate);
    endDate[`set${unitMapping[unit]}`](endDate[`get${unitMapping[unit]}`]() + parseInt(value));

    return endDate;
}

exports.createUserSubscription = async (req, res) => {
    try {
        const { subscriptionPlanId } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const planExists = await SubscriptionPlan.findById(subscriptionPlanId);

        if (!planExists) {
            return res.status(404).json({ status: 404, message: 'Subscription plan not found' });
        }

        console.log("planExists.duration", planExists.duration);
        const activeSubscription = await UserSubscription.findOne({
            user: userId,
            isActive: true,
        });

        if (activeSubscription) {
            return res.status(400).json({ status: 400, message: 'User already has an active subscription' });
        }

        const newUserSubscription = new UserSubscription({
            user: user._id,
            subscriptionPlan: subscriptionPlanId,
            startDate: new Date(),
            endDate: calculateEndDate(new Date(), planExists.duration),
            isActive: true,
        });

        await newUserSubscription.save();

        return res.status(201).json({ status: 201, message: 'User subscription created successfully', data: newUserSubscription });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getAllUserSubscriptions = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const allUserSubscriptions = await UserSubscription.find({ user: userId }).populate('user subscriptionPlan');
        return res.status(200).json({ status: 200, message: 'All user subscriptions retrieved successfully', data: allUserSubscriptions });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getUserSubscriptionById = async (req, res) => {
    try {
        const userSubscriptionId = req.params.id;
        const userSubscription = await UserSubscription.findById(userSubscriptionId).populate('user subscriptionPlan');

        if (!userSubscription) {
            return res.status(404).json({ status: 404, message: 'User subscription not found' });
        }

        return res.status(200).json({ status: 200, message: 'User subscription retrieved successfully', data: userSubscription });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.updateUserSubscriptionById = async (req, res) => {
    try {
        const userSubscriptionId = req.params.id;
        const updateFields = req.body;

        const updatedUserSubscription = await UserSubscription.findByIdAndUpdate(
            userSubscriptionId,
            updateFields,
            { new: true }
        );

        if (!updatedUserSubscription) {
            return res.status(404).json({ status: 404, message: 'User subscription not found' });
        }

        return res.status(200).json({ status: 200, message: 'User subscription updated successfully', data: updatedUserSubscription });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

//0 0,12 * * *
cron.schedule('* * * * *', async () => {
    console.log('Running subscription update task...');

    try {
        const expiredSubscriptions = await UserSubscription.find({
            endDate: { $lte: new Date() },
            isActive: true,
            status: "Subscriber",
            paymentStatus: "Paid",
        });

        await Promise.all(
            expiredSubscriptions.map(async (subscription) => {
                subscription.isActive = false;
                subscription.status = "UnSubscriber";
                await subscription.save();
            })
        );

        console.log('Subscription update task completed.');
    } catch (error) {
        console.error('Error in subscription update task:', error);
    }
});
console.log('Subscription updater scheduled.');


exports.initiateVoiceCall = async (req, res) => {
    try {
        const { receiverId } = req.body;
        const callerId = req.user._id;

        const caller = await User.findById(callerId);
        const receiver = await User.findById(receiverId);

        if (!caller || !receiver) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        if (caller.isBusy === true) {
            return res.status(404).json({ status: 404, message: 'Caller User is Busy' });
        }

        if (receiver.isBusy === true) {
            return res.status(404).json({ status: 404, message: 'Receiver User is Busy' });
        }

        // Check for an ongoing voice call involving the same users
        const existingVoiceCall = await VoiceCall.findOne({
            $or: [
                { $and: [{ caller: callerId }, { receiver: receiverId }, { status: 'Ongoing' }] },
                { $and: [{ caller: receiverId }, { receiver: callerId }, { status: 'Ongoing' }] }
            ]
        });

        if (existingVoiceCall) {
            return res.status(400).json({ status: 400, message: 'Voice call is already ongoing' });
        }

        const newVoiceCall = new VoiceCall({
            caller: callerId,
            receiver: receiverId,
            startTime: new Date(),
        });

        await newVoiceCall.save();

        return res.status(201).json({ status: 201, message: 'Voice call initiated successfully', data: newVoiceCall });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.acceptVoiceCall = async (req, res) => {
    try {
        const voiceCallId = req.params.id;
        const receiverId = req.user._id;

        const voiceCall = await VoiceCall.findById(voiceCallId);
        if (!voiceCall) {
            return res.status(404).json({ status: 404, message: 'Voice call not found' });
        }

        const user = await User.findById({ _id: receiverId });
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const user1 = await User.findOneAndUpdate(
            { _id: voiceCall.receiver },
            { $set: { isBusy: true } },
            { new: true }
        );

        if (!user1) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const checkVoiceCallUser = await VoiceCall.findOne({ $and: [{ $or: [{ receiver: receiverId.toString() }, { caller: voiceCall.caller.toString() }] }, { $or: [{ receiver: voiceCall.caller.toString() }, { caller: receiverId.toString() }] }] });

        if (!checkVoiceCallUser) {
            return res.status(404).json({ status: 404, message: 'Voice call user not found' });
        }

        user.isBusy = true;
        await user.save();

        voiceCall.status = 'Ongoing';
        await voiceCall.save();

        return res.status(200).json({ status: 200, message: 'Voice call accepted successfully', data: voiceCall });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.endVoiceCall = async (req, res) => {
    try {
        const voiceCallId = req.params.id;
        const userId = req.user._id;

        const voiceCall = await VoiceCall.findById(voiceCallId);
        if (!voiceCall) {
            return res.status(404).json({ status: 404, message: 'Voice call not found' });
        }

        const user = await User.findById({ _id: userId });
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const user1 = await User.findOneAndUpdate(
            { _id: voiceCall.receiver },
            { $set: { isBusy: false } },
            { new: true }
        );

        if (!user1) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const checkVoiceCallUser = await VoiceCall.findOne({ $and: [{ $or: [{ receiver: userId.toString() }, { caller: voiceCall.caller.toString() }] }, { $or: [{ receiver: voiceCall.caller.toString() }, { caller: userId.toString() }] }] });

        if (!checkVoiceCallUser) {
            return res.status(404).json({ status: 404, message: 'Voice call user not found' });
        }


        const durationInSeconds = Math.floor((new Date() - voiceCall.startTime) / 1000);

        voiceCall.duration = durationInSeconds;

        const hours = Math.floor(durationInSeconds / 3600);
        const minutes = Math.floor((durationInSeconds % 3600) / 60);
        const seconds = durationInSeconds % 60;


        voiceCall.status = 'Completed';
        voiceCall.endTime = new Date();

        await voiceCall.save();


        user.isBusy = false;
        await user.save();

        return res.status(200).json({
            status: 200, message: 'Voice call ended successfully', data: {
                voiceCall,
                formattedDuration: `${hours > 0 ? hours + ' hours, ' : ''}${minutes > 0 ? minutes + ' minutes, ' : ''}${seconds} seconds`,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.missedVoiceCall = async (req, res) => {
    try {
        const voiceCallId = req.params.id;
        const userId = req.user._id;

        const voiceCall = await VoiceCall.findOne({
            _id: voiceCallId,
            $or: [{ caller: userId }, { receiver: userId }],
            status: { $ne: 'Ongoing' },
        });

        if (!voiceCall) {
            return res.status(404).json({ status: 404, message: 'Missed call not found' });
        }

        voiceCall.status = 'Missed';
        await voiceCall.save();


        return res.status(200).json({ status: 200, message: 'Missed call marked successfully', data: voiceCall });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { animalId, animalFeedId, quantity } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        if (typeof quantity !== 'number' || quantity <= 0) {
            return res.status(400).json({ status: 400, message: 'Invalid quantity' });
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            const newCart = new Cart({ user: userId, items: [] });
            await newCart.save();
            cart = newCart;
        }

        if (!cart || !cart.items) {
            return res.status(404).json({ status: 404, message: 'Cart or items not found' });
        }

        let existingItem;

        if (animalId) {
            existingItem = cart.items.find(item => item.animal && item.animal.toString() === animalId);
        } else if (animalFeedId) {
            existingItem = cart.items.find(item => item.animalFeed && item.animalFeed.toString() === animalFeedId);
        }

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            const newItem = {
                quantity,
                addedAt: new Date(),
            };

            if (animalId) {
                newItem.animal = animalId;
                newItem.type = 'animal';
                const animal = await Animal.findById(animalId);
                newItem.price = animal ? animal.price : 0;
            } else if (animalFeedId) {
                newItem.animalFeed = animalFeedId;
                newItem.type = 'animalFeed';
                const animalFeed = await AnimalFeed.findById(animalFeedId);
                newItem.price = animalFeed ? animalFeed.originalPrice : 0;
            }

            cart.items.push(newItem);
        }

        cart.subTotal = await calculateSubTotal(cart.items);

        const totalCartAmount = cart.subTotal;
        const minShippingAmount1 = 40000;
        const minShippingAmount2 = 80000;
        const minShippingAmount3 = 100000;
        const minShippingAmount4 = 200000;
        const shippingPrice1 = 4000;
        const shippingPrice2 = 1000;
        const shippingPrice3 = 3000;
        const shippingPrice4 = 2000;

        if (totalCartAmount >= minShippingAmount4) {
            cart.shipping = shippingPrice2;
        } else if (totalCartAmount >= minShippingAmount3) {
            cart.shipping = shippingPrice4;
        } else if (totalCartAmount >= minShippingAmount2) {
            cart.shipping = shippingPrice3;
        } else if (totalCartAmount >= minShippingAmount1) {
            cart.shipping = shippingPrice1;
        } else {
            cart.shipping = shippingPrice2;
        }



        cart.total = calculateTotal(cart.subTotal, cart.shipping);

        await cart.save();

        return res.status(200).json({ status: 200, message: 'Item added to the cart', data: cart });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getCart = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const cart = await Cart.findOne({ user: userId }).populate('items.animal items.animalFeed').populate('coupon address');

        if (!cart) {
            return res.status(404).json({ status: 404, message: 'Cart not found' });
        }

        return res.status(200).json({ status: 200, data: cart });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

const updateShipping = (totalCartAmount) => {
    const shippingTiers = [
        { minAmount: 200000, price: 1000 },
        { minAmount: 100000, price: 2000 },
        { minAmount: 80000, price: 3000 },
        { minAmount: 40000, price: 4000 },
    ];

    for (const tier of shippingTiers) {
        if (totalCartAmount >= tier.minAmount) {
            return tier.price;
        }
    }
    return shippingTiers[shippingTiers.length - 1].price;
};

exports.updateCartItem = async (req, res) => {
    try {
        const { itemId, quantity } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ status: 404, message: 'Cart not found' });
        }

        if (typeof quantity !== 'number' || quantity <= 0) {
            return res.status(400).json({ status: 400, message: 'Invalid quantity' });
        }

        const cartItem = cart.items.find(item => item._id.toString() === itemId);

        if (!cartItem) {
            return res.status(404).json({ status: 404, message: 'Item not found in the cart' });
        }

        cartItem.quantity = quantity;

        cart.subTotal = await calculateSubTotal(cart.items);

        cart.shipping = updateShipping(cart.subTotal);

        cart.total = calculateTotal(cart.subTotal, cart.shipping);

        await cart.save();

        return res.status(200).json({ status: 200, message: 'Cart item updated successfully', data: cart });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.deleteCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ status: 404, message: 'Cart not found' });
        }

        const cartItemIndex = cart.items.findIndex(item => item._id.toString() === itemId);

        if (cartItemIndex === -1) {
            return res.status(404).json({ status: 404, message: 'Item not found in the cart' });
        }

        cart.items.splice(cartItemIndex, 1);

        cart.subTotal = await calculateSubTotal(cart.items);

        cart.shipping = updateShipping(cart.subTotal);

        cart.total = await calculateTotal(cart.subTotal, cart.shipping);

        if (cart.items.length === 0) {
            await Cart.deleteOne({ _id: cart._id });
            return res.status(200).json({ status: 200, message: 'Cart deleted successfully', data: null });
        }

        await cart.save();

        return res.status(200).json({ status: 200, message: 'Cart item deleted successfully', data: cart });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.applyCoupon = async (req, res, next) => {
    try {
        const { couponCode } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const coupon = await Coupon.findOne({ code: couponCode });

        if (!coupon) {
            return res.status(400).json({ status: 400, message: 'Invalid coupon code' });
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ status: 404, message: 'Cart not found' });
        }

        if (cart.items.some(item => item.coupon && item.coupon.toString() === coupon._id.toString())) {
            return res.status(400).json({ status: 400, message: 'Coupon is already applied' });
        }

        cart.coupon = coupon._id;
        cart.couponCode = coupon.code;
        cart.discount = coupon.discount;
        cart.isCouponApply = true;

        cart.total = calculateTotalWithCoupon(cart.subTotal, cart.discount) + cart.shipping;

        await cart.save();

        res.status(200).json({ status: 200, success: true, data: cart });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.removeCoupon = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ status: 404, message: 'Cart not found' });
        }

        cart.coupon = null;
        cart.couponCode = null;
        cart.discount = 0;
        cart.isCouponApply = false;

        cart.total = calculateTotalWithoutCoupon(cart.subTotal) + cart.shipping;

        await cart.save();

        res.status(200).json({ status: 200, success: true, data: cart });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

const calculateTotalWithCoupon = (subTotal, discountPercentage) => {
    const discount = (subTotal * discountPercentage) / 100;
    return subTotal - discount;
};

const calculateTotalWithoutCoupon = subTotal => subTotal;

const calculateSubTotal1 = async (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        return 0;
    }

    const animalIds = [...new Set(items.map(item => item.animal))];

    const animals = await Animal.find({ _id: { $in: animalIds } });

    const animalPrices = new Map(animals.map(animal => [animal._id.toString(), animal.price]));

    return items.reduce((total, item) => {
        const itemPrice = animalPrices.get(item.animal.toString()) || 0;
        return total + itemPrice * item.quantity;
    }, 0);
};

const calculateSubTotal = async (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        return 0;
    }

    const animalIds = items.filter(item => item.type === 'animal').map(item => item.animal);
    const animalFeedIds = items.filter(item => item.type === 'animalFeed').map(item => item.animalFeed);

    const animals = await Animal.find({ _id: { $in: animalIds } });
    const animalPrices = new Map(animals.map(animal => [animal._id.toString(), animal.price]));

    const animalFeeds = await AnimalFeed.find({ _id: { $in: animalFeedIds } });
    const animalFeedPrices = new Map(animalFeeds.map(feed => [feed._id.toString(), feed.originalPrice]));

    return items.reduce((total, item) => {
        if (item.type === 'animal') {
            const itemPrice = animalPrices.get(item.animal.toString()) || 0;
            return total + itemPrice * item.quantity;
        } else if (item.type === 'animalFeed') {
            const itemPrice = animalFeedPrices.get(item.animalFeed.toString()) || 0;
            return total + itemPrice * item.quantity;
        }
        return total;
    }, 0);
};

const calculateTotal = (subTotal, shipping) => {
    return subTotal + shipping;
};

exports.addAddressToCart = async (req, res) => {
    try {
        const { addressId } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        if (!addressId) {
            return res.status(400).json({ status: 400, message: 'AddressId is required' });
        }

        const cart = await Cart.findOne({ user: userId });
        const address = await Address.findOne({ _id: addressId, user: userId });

        if (!cart) {
            return res.status(404).json({ status: 404, message: 'Cart not found' });
        }

        if (!address) {
            return res.status(404).json({ status: 404, message: 'Address not found' });
        }

        cart.address = addressId;
        await cart.save();

        return res.status(200).json({ status: 200, message: 'Address added to the cart successfully', data: cart });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.updateAddressInCart = async (req, res) => {
    try {
        const { addressId } = req.body;

        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        if (!addressId) {
            return res.status(400).json({ status: 400, message: 'AddressId is required' });
        }

        const cart = await Cart.findOne({ user: userId });
        const address = await Address.findOne({ _id: addressId, user: userId });

        if (!cart) {
            return res.status(404).json({ status: 404, message: 'Cart not found' });
        }

        if (!address) {
            return res.status(404).json({ status: 404, message: 'Address not found' });
        }

        cart.address = addressId;
        await cart.save();

        return res.status(200).json({ status: 200, message: 'Address in the cart updated successfully', data: cart });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.deleteAddressFromCart = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ status: 404, message: 'Cart not found' });
        }

        cart.address = null;
        await cart.save();

        return res.status(200).json({ status: 200, message: 'Address removed from the cart successfully', data: cart });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getAddressForCart = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const cart = await Cart.findOne({ user: userId }).populate('address');

        if (!cart) {
            return res.status(404).json({ status: 404, message: 'Cart not found' });
        }

        return res.status(200).json({ status: 200, message: 'Address for the cart retrieved successfully', data: cart.address });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.checkout = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const cart = await Cart.findOne({ user: userId });

        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(400).json({ status: 400, message: 'Cart is empty' });
        }

        const subTotal = cart.subTotal;
        const shipping = cart.shipping;
        const total = subTotal + shipping;

        let orderId = await reffralCode();

        const order = new Order({
            orderId: orderId,
            address: cart.address,
            user: user._id,
            items: cart.items,
            subTotal: subTotal,
            shipping: shipping,
            total: total,
            orderStatus: "Unconfirmed",
            status: "Pending",
            paymentStatus: "Pending",
        });

        await order.save();

        return res.status(200).json({ status: 200, message: 'Checkout successful', data: order });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.placeOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const userId = req.user._id;
        const { paymentType, paymentStatus, isCardSaved, cardDetails } = req.body;


        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        let findUserOrder = await Order.findOne({ orderId: orderId, user: userId, paymentStatus: "Pending" });

        if (!findUserOrder) {
            return res.status(404).json({ status: 404, message: 'Order not found' });
        }

        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ status: 404, message: 'Cart not found' });
        }

        findUserOrder.items = cart.items.map(item => ({
            type: item.type,
            animal: item.animal,
            animalFeed: item.animalFeed,
            quantity: item.quantity,
            price: item.price,
        }));

        findUserOrder.subTotal = cart.subTotal;
        findUserOrder.shipping = cart.shipping;
        findUserOrder.total = cart.total;
        findUserOrder.paymentStatus = paymentStatus;
        findUserOrder.paymentType = paymentType;

        if (paymentType === "User Wallet") {
            if (user.wallet < findUserOrder.total) {
                return res.status(400).json({ status: 400, message: 'Insufficient wallet balance for payment' });
            }

            user.wallet -= findUserOrder.total;
            await user.save();
        }

        if (isCardSaved && cardDetails) {
            const existingCard = await CardDetail.findOne({
                user: userId,
                cardNumber: cardDetails.cardNumber,
                cardHolderName: cardDetails.cardHolderName,
                expiryDate: cardDetails.expiryDate,
                cvv: cardDetails.cvv,
            });

            if (existingCard) {
                findUserOrder.paymentDetails = existingCard;
            } else {
                const newCard = new CardDetail({
                    user: userId,
                    ...cardDetails,
                    isDefault: cardDetails.isDefault || false,
                    isCarSaved: isCardSaved || false,
                });

                await newCard.save();
                findUserOrder.paymentDetails = newCard;
            }
        }

        await findUserOrder.save();

        if (paymentStatus === "Paid") {
            await Cart.findOneAndDelete({ user: userId });
        }

        return res.status(200).json({ status: 200, message: 'Order details updated successfully', data: findUserOrder });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getOrder = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const orders = await Order.find({ user: userId }).populate('items.animal items.animalFeed').populate('address');
        return res.status(200).json({ status: 200, data: orders });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const userId = req.user._id;
        const orderId = req.params.orderId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) {
            return res.status(404).json({ status: 404, message: 'Order not found' });
        }

        return res.status(200).json({ status: 200, data: order });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const orderId = req.params.orderId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) {
            return res.status(404).json({ status: 404, message: 'Order not found' });
        }

        await Order.findByIdAndDelete(order._id);

        return res.status(200).json({ status: 200, message: 'Order deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getCardDetails = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const cards = await CardDetail.find({ user: userId });
        return res.status(200).json({ status: 200, data: cards });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.deleteSavedCard = async (req, res) => {
    try {
        const userId = req.user._id;
        const cardId = req.params.cardId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const card = await CardDetail.findOne({ _id: cardId, user: userId });
        if (!card) {
            return res.status(404).json({ status: 404, message: 'Card not found' });
        }

        await CardDetail.findByIdAndDelete(cardId);

        return res.status(200).json({ status: 200, message: 'Card deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getOrderRecive = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const orders = await Order.find();

        const orderDetails = [];

        for (const order of orders) {
            const validOrderItems = [];
            for (const orderItem of order.items) {
                const animal = await Animal.findById(orderItem.animal);
                if (!animal) {
                    return res.status(404).json({ status: 404, message: 'Animal not found' });
                }

                if (orderItem.animal.equals(animal._id)) {
                    validOrderItems.push({
                        animalDetails: animal,
                        quantity: orderItem.quantity,
                        price: orderItem.price,
                    });
                }
            }

            if (validOrderItems.length > 0) {
                const orderWithAnimalDetails = {
                    orderId: order.orderId,
                    items: validOrderItems,
                    subTotal: order.subTotal,
                    shipping: order.shipping,
                    total: order.total,
                    orderStatus: order.orderStatus,
                    status: order.status,
                    paymentStatus: order.paymentStatus,
                    paymentType: order.paymentType,
                    createdAt: order.createdAt,
                    updatedAt: order.updatedAt,
                };

                orderDetails.push(orderWithAnimalDetails);
            }
        }

        return res.status(200).json({ status: 200, data: orderDetails });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const orderId = req.params.orderId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }
        const { orderStatus, status } = req.body;

        const findUserOrder = await Order.findOne({ _id: orderId, user: userId });
        if (!findUserOrder) {
            return res.status(404).json({ status: 404, message: 'Order not found' });
        }

        if (orderStatus !== undefined) {
            findUserOrder.orderStatus = orderStatus;
        }

        if (status !== undefined) {
            findUserOrder.status = status;
        }

        await findUserOrder.save();

        return res.status(200).json({ status: 200, message: 'Order status updated successfully', data: findUserOrder });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.createAnimalMela = async (req, res) => {
    try {
        const { firstName, lastName, email, dateAndTimings, contact, isPublished } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        let images = [];
        if (req.files) {
            for (let j = 0; j < req.files.length; j++) {
                let obj = {
                    img: req.files[j].path,
                };
                images.push(obj);
            }
        }

        const animalMelaData = {
            postedBy: user._id,
            firstName,
            lastName,
            email,
            dateAndTimings,
            contact,
            images: images,
            isPublished,
        };

        const newAnimalMela = await AnimalMela.create(animalMelaData);

        if (!newAnimalMela) {
            return res.status(400).json({ status: 400, message: 'Failed to create Animal Mela' });
        }

        return res.status(201).json({ status: 201, message: 'Animal Mela created successfully', data: newAnimalMela });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getAnimalMela = async (req, res) => {
    try {
        const animalMelas = await AnimalMela.find().populate('postedBy').populate({
            path: 'comments.user',
            model: 'User',
            select: 'firstName lastName image mobileNumber email',
        });

        const animalMelasWithCounts = animalMelas.map(animalMela => {
            const likeCount = animalMela.likes.length;
            const dislikeCount = animalMela.dislikes.length;

            return {
                ...animalMela._doc,
                likeCount,
                dislikeCount,
            };
        });

        return res.status(200).json({ status: 200, data: animalMelasWithCounts });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getAnimalMelaByUser = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const animalMelas = await AnimalMela.find({ postedBy: userId }).populate('postedBy').populate({
            path: 'comments.user',
            model: 'User',
            select: 'firstName lastName image mobileNumber email',
        });

        const animalMelasWithCounts = animalMelas.map(animalMela => {
            const likeCount = animalMela.likes.length;
            const dislikeCount = animalMela.dislikes.length;

            return {
                ...animalMela._doc,
                likeCount,
                dislikeCount,
            };
        });

        return res.status(200).json({ status: 200, data: animalMelasWithCounts });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getAnimalMelaById = async (req, res) => {
    try {
        const animalMelaId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(animalMelaId)) {
            return res.status(400).json({ status: 400, message: 'Invalid Animal Mela ID' });
        }

        const animalMela = await AnimalMela.findById(animalMelaId).populate('postedBy').populate({
            path: 'comments.user',
            model: 'User',
            select: 'firstName lastName image mobileNumber email',
        });
        if (!animalMela) {
            return res.status(404).json({ status: 404, message: 'Animal Mela not found' });
        }

        const likeCount = animalMela.likes.length;
        const dislikeCount = animalMela.dislikes.length;

        const animalMelaWithCounts = {
            ...animalMela._doc,
            likeCount,
            dislikeCount,
        };

        return res.status(200).json({ status: 200, data: animalMelaWithCounts });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.updateAnimalMela = async (req, res) => {
    try {
        const animalMelaId = req.params.id;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(animalMelaId)) {
            return res.status(400).json({ status: 400, message: 'Invalid Animal Mela ID' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const existingAnimalMela = await AnimalMela.findById(animalMelaId);
        if (!existingAnimalMela) {
            return res.status(404).json({ status: 404, message: 'Animal Mela not found' });
        }

        const updateData = {};

        const fieldsToUpdate = ['firstName', 'lastName', 'email', 'dateAndTimings', 'contact', 'isPublished'];

        fieldsToUpdate.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => ({ img: file.path }));
            updateData.images = newImages;
        }

        const updatedAnimalMela = await AnimalMela.findByIdAndUpdate(animalMelaId, updateData, { new: true });
        if (!updatedAnimalMela) {
            return res.status(404).json({ status: 404, message: 'Animal Mela not found' });
        }

        return res.status(200).json({ status: 200, message: 'Animal Mela updated successfully', data: updatedAnimalMela });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.deleteAnimalMelaById = async (req, res) => {
    try {
        const animalMelaId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(animalMelaId)) {
            return res.status(400).json({ status: 400, message: 'Invalid Animal Mela ID' });
        }

        const deletedAnimalMela = await AnimalMela.findByIdAndDelete(animalMelaId);
        if (!deletedAnimalMela) {
            return res.status(404).json({ status: 404, message: 'Animal Mela not found' });
        }

        return res.status(200).json({ status: 200, message: 'Animal Mela deleted successfully', data: deletedAnimalMela });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.likeAnimalMela = async (req, res) => {
    try {
        const animalMelaId = req.params.id;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(animalMelaId)) {
            return res.status(400).json({ status: 400, message: 'Invalid Animal Mela ID' });
        }

        const animalMela = await AnimalMela.findById(animalMelaId);
        if (!animalMela) {
            return res.status(404).json({ status: 404, message: 'Animal Mela not found' });
        }

        const userLikedIndex = animalMela.likes.findIndex(like => like.user.equals(userId));
        const userDislikedIndex = animalMela.dislikes.findIndex(dislike => dislike.user.equals(userId));

        if (userLikedIndex !== -1) {
            animalMela.likes.splice(userLikedIndex, 1);
        } else {
            animalMela.likes.push({ user: userId });

            if (userDislikedIndex !== -1) {
                animalMela.dislikes.splice(userDislikedIndex, 1);
            }
        }

        await animalMela.save();

        return res.status(200).json({ status: 200, message: 'Animal Mela liked successfully', data: animalMela });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.dislikeAnimalMela = async (req, res) => {
    try {
        const animalMelaId = req.params.id;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(animalMelaId)) {
            return res.status(400).json({ status: 400, message: 'Invalid Animal Mela ID' });
        }

        const animalMela = await AnimalMela.findById(animalMelaId);
        if (!animalMela) {
            return res.status(404).json({ status: 404, message: 'Animal Mela not found' });
        }

        const userLikedIndex = animalMela.likes.findIndex(like => like.user.equals(userId));
        const userDislikedIndex = animalMela.dislikes.findIndex(dislike => dislike.user.equals(userId));

        if (userDislikedIndex !== -1) {
            animalMela.dislikes.splice(userDislikedIndex, 1);
        } else {
            animalMela.dislikes.push({ user: userId });

            if (userLikedIndex !== -1) {
                animalMela.likes.splice(userLikedIndex, 1);
            }
        }

        await animalMela.save();

        return res.status(200).json({ status: 200, message: 'Animal Mela disliked successfully', data: animalMela });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.commentOnAnimalMela = async (req, res) => {
    try {
        const animalMelaId = req.params.id;
        const userId = req.user._id;
        const { text } = req.body;

        if (!mongoose.Types.ObjectId.isValid(animalMelaId)) {
            return res.status(400).json({ status: 400, message: 'Invalid Animal Mela ID' });
        }

        const animalMela = await AnimalMela.findById(animalMelaId);
        if (!animalMela) {
            return res.status(404).json({ status: 404, message: 'Animal Mela not found' });
        }

        animalMela.comments.push({ user: userId, text });
        await animalMela.save();

        return res.status(200).json({ status: 200, message: 'Comment added successfully', data: animalMela });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.createAnimalFeed = async (req, res) => {
    try {
        const { category, owner, name, description, originalPrice, discountActive, discountPrice, location, isAvailable } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }
        const categoryId = await Category.findById(category);
        if (!categoryId) {
            return res.status(404).json({ status: 404, message: 'Category not found' });
        }

        let discount = 0;
        if (discountActive && originalPrice && discountPrice) {
            discount = (((originalPrice - discountPrice) / originalPrice) * 100).toFixed(2);
        }

        let images = [];
        if (req.files) {
            for (let j = 0; j < req.files.length; j++) {
                let obj = {
                    img: req.files[j].path,
                };
                images.push(obj);
            }
        }


        const newAnimalFeed = new AnimalFeed({
            category,
            owner,
            name,
            description,
            originalPrice,
            discountActive,
            discountPrice,
            discount,
            images: images,
            location,
            isAvailable
        });

        await newAnimalFeed.save();

        return res.status(201).json({
            status: 201,
            message: 'AnimalFeed created successfully',
            data: newAnimalFeed,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getAllAnimalFeeds = async (req, res) => {
    try {
        const animalFeeds = await AnimalFeed.find().populate('category').populate('owner');
        return res.status(200).json({ status: 200, data: animalFeeds });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getAnimalFeedById = async (req, res) => {
    try {
        const animalFeedId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(animalFeedId)) {
            return res.status(400).json({ status: 400, message: 'Invalid AnimalFeed ID' });
        }

        const animalFeed = await AnimalFeed.findById(animalFeedId).populate('category').populate('owner');

        if (!animalFeed) {
            return res.status(404).json({ status: 404, message: 'AnimalFeed not found' });
        }

        return res.status(200).json({ status: 200, data: animalFeed });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.updateAnimalFeedById = async (req, res) => {
    try {
        const animalFeedId = req.params.id;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        if (req.body.category) {
            const categoryId = await Category.findById(req.body.category);
            if (!categoryId) {
                return res.status(404).json({ status: 404, message: 'Category not found' });
            }
        }

        if (!mongoose.Types.ObjectId.isValid(animalFeedId)) {
            return res.status(400).json({ status: 400, message: 'Invalid AnimalFeed ID' });
        }

        const updatedAnimalFeed = await AnimalFeed.findOneAndUpdate({ _id: animalFeedId, owner: userId }, req.body, { new: true });

        if (!updatedAnimalFeed) {
            return res.status(404).json({ status: 404, message: 'AnimalFeed not found' });
        }

        if (req.body.discountActive !== undefined || req.body.originalPrice !== undefined || req.body.discountPrice !== undefined) {
            const { originalPrice, discountActive, discountPrice } = updatedAnimalFeed;

            if (discountActive && originalPrice && discountPrice) {
                updatedAnimalFeed.discount = (((originalPrice - discountPrice) / originalPrice) * 100).toFixed(2);
            } else {
                updatedAnimalFeed.discount = 0;
            }
        }

        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => ({ img: file.path }));
            updatedAnimalFeed.images = newImages;
        }

        await updatedAnimalFeed.save();

        return res.status(200).json({ status: 200, message: 'AnimalFeed updated successfully', data: updatedAnimalFeed });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.deleteAnimalFeedById = async (req, res) => {
    try {
        const animalFeedId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(animalFeedId)) {
            return res.status(400).json({ status: 400, message: 'Invalid AnimalFeed ID' });
        }

        const deletedAnimalFeed = await AnimalFeed.findByIdAndDelete(animalFeedId);

        if (!deletedAnimalFeed) {
            return res.status(404).json({ status: 404, message: 'AnimalFeed not found' });
        }

        return res.status(200).json({ status: 200, message: 'AnimalFeed deleted successfully', data: deletedAnimalFeed });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.addReviewAndRating = async (req, res) => {
    try {
        const userId = req.user._id;
        const animalFeedId = req.params.id;
        const { rating, review } = req.body;

        const user = await User.findById(userId);
        const animalFeed = await AnimalFeed.findById(animalFeedId);

        if (!user || !animalFeed) {
            return res.status(404).json({ status: 404, message: 'User or AnimalFeed not found' });
        }

        if (rating < 0 || rating > 5) {
            return res.status(400).json({ message: 'Invalid rating. Rating should be between 0 and 5.', data: {} });
        }

        const existingReview = animalFeed.reviews.find((rev) => rev.user.equals(userId));
        if (existingReview) {
            return res.status(400).json({ status: 400, message: 'User has already reviewed this AnimalFeed' });
        }

        animalFeed.reviews.push({
            user: userId,
            name: user.firstName + " " + user.lastName,
            comment: review,
            createdAt: new Date(),
            rating: rating,
        });

        animalFeed.averageRating = parseFloat(((animalFeed.averageRating * animalFeed.numOfUserReviews + rating) / (animalFeed.numOfUserReviews + 1)).toFixed(2));

        animalFeed.numOfUserReviews += 1; await animalFeed.save();

        return res.status(201).json({
            status: 201,
            message: 'Review and rating added successfully',
            data: animalFeed,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getAllReviewsForAnimalFeed = async (req, res) => {
    try {
        const animalFeedId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(animalFeedId)) {
            return res.status(400).json({ status: 400, message: 'Invalid AnimalFeed ID' });
        }

        const animalFeed = await AnimalFeed.findById(animalFeedId).populate({
            path: 'reviews.user',
            select: 'firstName lastName image mobileNumber email',
        });;

        if (!animalFeed) {
            return res.status(404).json({ status: 404, message: 'AnimalFeed not found' });
        }

        return res.status(200).json({ status: 200, data: animalFeed.reviews });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getReviewsByToken = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const animalFeeds = await AnimalFeed.find({ "reviews.user": userId }).populate({
            path: 'reviews.user',
            select: 'firstName lastName image mobileNumber email',
        });

        if (!animalFeeds) {
            return res.status(404).json({ status: 404, message: 'AnimalFeeds not found' });
        }

        const userReviews = [];

        for (const animalFeed of animalFeeds) {
            for (const review of animalFeed.reviews) {
                if (review.user && review.user.equals(userId)) {
                    userReviews.push({
                        animalFeedId: animalFeed._id,
                        review: review,
                    });
                }
            }
        }

        return res.status(200).json({ status: 200, data: userReviews });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getReviewsByTokenAndAnimalFeedId = async (req, res) => {
    try {
        const userId = req.user._id;
        const animalFeedId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(animalFeedId)) {
            return res.status(400).json({ status: 400, message: 'Invalid AnimalFeed ID' });
        }

        const animalFeed = await AnimalFeed.findById(animalFeedId).populate('reviews').populate({
            path: 'reviews.user',
            select: 'firstName lastName image mobileNumber email',
        });

        if (!animalFeed) {
            return res.status(404).json({ status: 404, message: 'AnimalFeed not found' });
        }

        const userReviews = animalFeed.reviews.filter(review => review.user && review.user.equals(userId));

        return res.status(200).json({ status: 200, data: userReviews });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.addFavoriteAnimalFeeds = async (req, res) => {
    try {
        const userId = req.user._id;
        const animalFeedId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const animal = await AnimalFeed.findById(animalFeedId);
        if (!animal) {
            return res.status(404).json({ status: 404, message: 'AnimalFeeds not found' });
        }

        if (user.favouriteAnimalFeed.includes(animalFeedId)) {
            return res.status(400).json({ status: 400, message: 'AnimalFeed is already in favorites' });
        }

        user.favouriteAnimalFeed.push(animalFeedId);
        await user.save();

        return res.status(200).json({ status: 200, message: 'Favorite AnimalFeeds added successfully', data: user.favouriteAnimalFeed });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getFavoriteAnimalfeeds = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).populate('favouriteAnimalFeed');

        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const favouriteAnimalFeed = user.favouriteAnimalFeed;
        return res.status(200).json({ status: 200, message: 'Favorite AnimalFeed retrieved successfully', data: favouriteAnimalFeed });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.removeFavoriteAnimalfeeds = async (req, res) => {
    try {
        const userId = req.user._id;
        const animalFeedId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const animal = await AnimalFeed.findById(animalFeedId);
        if (!animal) {
            return res.status(404).json({ status: 404, message: 'AnimalFeed not found' });
        }

        if (!user.favouriteAnimalFeed.includes(animalFeedId)) {
            return res.status(400).json({ status: 400, message: 'AnimalFeed is not in favorites' });
        }

        user.favouriteAnimalFeed = user.favouriteAnimalFeed.filter(id => id.toString() !== animalFeedId);
        await user.save();

        return res.status(200).json({ status: 200, message: 'Favorite AnimalFeed removed successfully', data: user.favouriteAnimalFeed });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getUserWalletBalance = async (req, res) => {
    try {
        const userId = req.user._id;
        console.log("hii");
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const walletBalance = user.wallet;

        return res.status(200).json({ status: 200, message: 'Wallet balance retrieved successfully', data: { walletBalance } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.createReferral = async (req, res) => {
    try {
        const { referredUserId, referralCode } = req.body;

        const referrerdUser = await User.findOne({ _id: referredUserId });

        if (!referrerdUser) {
            return res.status(400).json({ status: 400, message: 'user not found' });
        }

        const referrerUser = await User.findOne({ refferalCode: referralCode });

        if (!referrerUser) {
            return res.status(400).json({ status: 400, message: 'Invalid referral code' });
        }

        const referral = new Referral({
            referrer: referrerUser._id,
            referredUser: referredUserId,
            referralCode,
        });

        await referral.save();

        return res.status(201).json({ status: 201, message: 'Referral created successfully', data: referral });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Error creating referral', error: error.message });
    }
};

exports.getAllReferrals = async (req, res) => {
    try {
        const referrals = await Referral.find();
        res.status(200).json({ status: 200, data: referrals });
    } catch (error) {
        res.status(500).json({ status: 500, message: 'Server error', error: error.message });
    }
};

exports.getReferralById = async (req, res) => {
    try {
        const referral = await Referral.findById(req.params.referralId);
        if (!referral) {
            return res.status(404).json({ status: 404, message: 'Referral not found' });
        }
        res.status(200).json({ status: 200, data: referral });
    } catch (error) {
        res.status(500).json({ status: 500, message: 'Server error', error: error.message });
    }
};

