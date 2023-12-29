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
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const allPublishAds = await PublishAd.find({ postBy: userId }).populate('species breed');
        res.status(200).json({ message: 'All publish ads retrieved successfully', data: allPublishAds });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', data: error.message });
    }
};

exports.getPublishAdById = async (req, res) => {
    try {
        const publishAdId = req.params.id;
        const publishAd = await PublishAd.findById(publishAdId).populate('species breed');

        if (!publishAd) {
            return res.status(404).json({ status: 404, message: 'Publish ad not found' });
        }

        res.status(200).json({ message: 'Publish ad retrieved successfully', data: publishAd });
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
        const { receiverId, duration } = req.body;
        const callerId = req.user._id;

        let caller = await User.findById(callerId);
        let receiver = await User.findById(receiverId);

        if (!caller) {
            caller = await User.findById(receiverId);
        }

        if (!receiver) {
            receiver = await User.findById(callerId);
        }

        if (!caller || !receiver) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + duration * 1000);

        const voiceCall = new VoiceCall({
            caller: callerId,
            receiver: receiverId,
            duration,
            startTime,
            endTime,
        });

        await voiceCall.save();

        // You might want to send a notification or trigger the call in your signaling mechanism

        return res.status(201).json({ status: 201, message: 'Voice call initiated successfully', data: voiceCall });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.acceptVoiceCall = async (req, res) => {
    try {
        const voiceCallId = req.params.id;
        const receiverId = req.user._id;

        const user = await User.findById(receiverId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const voiceCall = await VoiceCall.findOne({
            _id: voiceCallId,
            $or: [{ receiver: receiverId }, { caller: receiverId }],
        });

        if (!voiceCall) {
            return res.status(404).json({ status: 404, message: 'Voice call not found' });
        }

        user.IsBusy = true;
        await user.save();

        voiceCall.status = 'Ongoing';
        await voiceCall.save();

        // You might want to send a notification or trigger the acceptance in your signaling mechanism

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

        const voiceCall = await VoiceCall.findOne({
            _id: voiceCallId,
            $or: [{ caller: userId }, { receiver: userId }],
        });

        if (!voiceCall) {
            return res.status(404).json({ status: 404, message: 'Voice call not found' });
        }

        voiceCall.status = 'Completed';
        await voiceCall.save();

        const user = await User.findById(userId);
        if (user) {
            user.IsBusy = false;
            await user.save();
        }

        // You might want to send a notification or trigger the end in your signaling mechanism

        return res.status(200).json({ status: 200, message: 'Voice call ended successfully', data: voiceCall });
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

        // You might want to send a notification or handle missed call logic here

        return res.status(200).json({ status: 200, message: 'Missed call marked successfully', data: voiceCall });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};




