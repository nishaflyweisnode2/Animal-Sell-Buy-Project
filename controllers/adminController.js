const User = require('../models/userModel');
const authConfig = require("../configs/auth.config");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const newOTP = require("otp-generators");
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
const Order = require('../models/orderModel');
const Referral = require('../models/refferModel');
const CardDetail = require('../models/cardDetailsModel');
const AnimalMela = require('../models/animalMelaModel');
const AnimalFeed = require('../models/animalFeedModel');
const mongoose = require('mongoose');





exports.registration = async (req, res) => {
    const { phone, email } = req.body;
    try {
        req.body.email = email.split(" ").join("").toLowerCase();
        let user = await User.findOne({ $and: [{ $or: [{ email: req.body.email }, { phone: phone }] }], userType: "ADMIN" });
        if (!user) {
            req.body.password = bcrypt.hashSync(req.body.password, 8);
            req.body.userType = "ADMIN";
            req.body.accountVerification = true;
            const userCreate = await User.create(req.body);
            return res.status(200).send({ message: "registered successfully ", data: userCreate, });
        } else {
            return res.status(409).send({ message: "Already Exist", data: [] });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.signin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email, userType: "ADMIN" });
        if (!user) {
            return res
                .status(404)
                .send({ message: "user not found ! not registered" });
        }
        const isValidPassword = bcrypt.compareSync(password, user.password);
        if (!isValidPassword) {
            return res.status(401).send({ message: "Wrong password" });
        }
        const accessToken = jwt.sign({ id: user._id }, authConfig.secret, {
            expiresIn: authConfig.accessTokenTime,
        });

        let obj = {
            firstName: user.firstName,
            lastName: user.lastName,
            mobileNumber: user.mobileNumber,
            email: user.email,
            userType: user.userType,
        }

        user.isVerified = true;
        await user.save();

        return res.status(201).send({ data: obj, accessToken: accessToken });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: "Server error" + error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { firstName, lastName, email, mobileNumber, password } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).send({ message: "not found" });
        }
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.email = email || user.email;
        user.mobileNumber = mobileNumber || user.mobileNumber;
        user.accountVerification = true;
        user.completeProfile = true;
        if (req.body.password) {
            user.password = bcrypt.hashSync(password, 8) || user.password;
        }
        const updated = await user.save();
        return res.status(200).send({ message: "updated", data: updated });
    } catch (err) {
        console.log(err);
        return res.status(500).send({
            message: "internal server error " + err.message,
        });
    }
};

exports.getAllUser = async (req, res) => {
    try {
        const users = await User.find();
        if (!users || users.length === 0) {
            return res.status(404).json({ status: 404, message: 'Users not found' });
        }

        const formattedUsers = users.map(user => ({
            _id: user._id,
            user: user,
            memberSince: user.createdAt.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
            }),
        }));

        return res.status(200).json({
            status: 200,
            data: formattedUsers,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.getUserById = async (req, res) => {
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

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        await User.findByIdAndDelete(userId);

        return res.status(200).json({ status: 200, message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.getPendingVerificationUsers = async (req, res) => {
    try {
        const pendingVerificationUsers = await User.find({ isVerified: false });

        return res.status(200).json({
            status: 200,
            data: pendingVerificationUsers,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.updateVerificationStatus = async (req, res) => {
    try {
        const userId = req.params.id;
        const { isVerified } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        user.isVerified = isVerified;
        await user.save();

        return res.status(200).json({
            status: 200,
            message: 'Verification status updated successfully',
            data: user,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.getVerifiedUsers = async (req, res) => {
    try {
        const verifiedUsers = await User.find({ isVerified: true });

        if (!verifiedUsers || verifiedUsers.length === 0) {
            return res.status(404).json({ status: 404, message: 'No verified users found' });
        }

        return res.status(200).json({ status: 200, data: verifiedUsers });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Failed to retrieve verified users', error: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        let findCategory = await Category.findOne({ name: req.body.name });
        if (findCategory) {
            return res.status(409).json({ message: "Category already exit.", status: 404, data: {} });
        } else {
            let fileUrl;
            if (req.file) {
                fileUrl = req.file ? req.file.path : "";
            }
            const data = { name: req.body.name, image: fileUrl, status: req.body.status, notice: req.body.notice, };
            const category = await Category.create(data);
            return res.status(200).json({ status: 200, message: "Category add successfully.", data: category });
        }
    } catch (error) {
        return res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find({});
        return res.status(201).json({ message: "Category Found", status: 200, data: categories, });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: "Internal server error", data: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category Not Found", status: 404, data: {} });
        }
        let fileUrl;
        if (req.file) {
            fileUrl = req.file ? req.file.path : "";
        }
        category.image = fileUrl || category.image;
        category.name = req.body.name || category.name;
        category.status = req.body.status || category.status;
        category.notice = req.body.notice || category.notice;
        let update = await category.save();
        return res.status(200).json({ status: 200, message: "Updated Successfully", data: update });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: "Internal server error", data: error.message });
    }
};

exports.removeCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category Not Found", status: 404, data: {} });
        }
        await Category.findByIdAndDelete(category._id);
        return res.status(200).json({ status: 200, message: "Category Deleted Successfully !" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: "Internal server error", data: error.message });
    }
};

exports.createSubCategory = async (req, res) => {
    try {
        let findCategory = await Category.findOne({ _id: req.body.Category });
        if (!findCategory) {
            return res.status(409).json({ message: "Category Not Found.", status: 404, data: {} });
        }
        let findSubCategory = await SubCategory.findOne({ name: req.body.name });
        if (findSubCategory) {
            return res.status(409).json({ message: "SubCategory Name Already exist.", status: 404, data: {} });
        } else {
            // let fileUrl;
            // if (req.file) {
            //     fileUrl = req.file ? req.file.path : "";
            // }
            const data = { Category: req.body.Category, name: req.body.name, /*image: fileUrl,*/ status: req.body.status, notice: req.body.notice, };
            const subCategory = await SubCategory.create(data);
            return res.status(200).json({ status: 200, message: "Category add successfully.", data: subCategory });
        }
    } catch (error) {
        return res.status(500).json({ status: 500, message: "internal server error ", data: error.message, });
    }
};

exports.getSubCategories = async (req, res) => {
    try {
        const SubCategories = await SubCategory.find({}).populate('Category');
        return res.status(201).json({ message: "SubCategories Found", status: 200, data: SubCategories, });
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

        return res.status(200).json({ status: 200, message: "SubCategories Found", data: SubCategories });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: "Internal server error", data: error.message });
    }
};

exports.updateSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const SubCategories = await SubCategory.findById(id).populate('Category');

        if (!SubCategories) {
            return res.status(404).json({ message: "Subcategory Not Found", status: 404, data: {} });
        }
        if (req.body.Category) {
            const findCategory = await Category.findOne({ _id: req.body.Category });

            if (!findCategory) {
                return res.status(404).json({ message: "Category Not Found", status: 404, data: {} });
            }
        }

        // let fileUrl;
        // if (req.file) {
        //     fileUrl = req.file.path || "";
        // }
        // subCategory.image = fileUrl || subCategory.image;

        SubCategories.Category = req.body.Category || SubCategories.Category;
        SubCategories.name = req.body.name || SubCategories.name;
        if (req.body.status != (null || undefined)) {
            SubCategories.status = req.body.status;
        } else {
            SubCategories.status = SubCategories.status;
        }
        SubCategories.notice = req.body.notice || SubCategories.notice;

        const updatedSubCategories = await SubCategories.save();
        console.log('Updated SubCategories:', SubCategories);

        return res.status(200).json({ status: 200, message: "Updated Successfully", data: updatedSubCategories });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: "Internal server error", data: error.message });
    }
};

exports.removeSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const SubCategories = await SubCategory.findById(id);
        if (!SubCategories) {
            return res.status(404).json({ message: "SubCategories Not Found", status: 404, data: {} });
        }
        await SubCategories.findByIdAndDelete(SubCategories._id);
        return res.status(200).json({ status: 200, message: "SubCategories Deleted Successfully !" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: "Internal server error", data: error.message });
    }
};

exports.createAnimal = async (req, res) => {
    try {
        const { category, subCategory, name, description, price, location, age, height, length, weight, milkProduction, isAvailable } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }
        const categoryId = await Category.findById(category);
        if (!categoryId) {
            return res.status(404).json({ status: 404, message: 'Category not found' });
        }
        const subCategoryId = await SubCategory.findById(subCategory);
        if (!subCategoryId) {
            return res.status(404).json({ status: 404, message: 'SubCategory not found' });
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

        const newAnimal = new Animal({
            category,
            subCategory,
            owner: user._id,
            name,
            description,
            price,
            images,
            breed: subCategoryId.name,
            location,
            age,
            height,
            length,
            weight,
            milkProduction,
            isAvailable,
        });

        await newAnimal.save();
        return res.status(201).json({ message: 'Animal created successfully', data: newAnimal });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', data: error.message });
    }
};

exports.getAllAnimals = async (req, res) => {
    try {
        const animals = await Animal.find().populate('reviews.user category subCategory owner');
        return res.status(200).json({ status: 200, message: 'Animals retrieved successfully', data: animals });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', data: error.message });
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
        return res.status(500).json({ message: 'Internal server error', data: error.message });
    }
};

exports.getAnimalById = async (req, res) => {
    try {
        const animal = await Animal.findById(req.params.id).populate('reviews.user category subCategory owner');
        if (!animal) {
            return res.status(404).json({ message: 'Animal not found', data: {} });
        }
        return res.status(200).json({ status: 200, message: 'Animal retrieved successfully', data: animal });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', data: error.message });
    }
};

exports.updateAnimal = async (req, res) => {
    try {
        const { category, subCategory, name, description, price, location, age, height, length, weight, milkProduction, isAvailable } = req.body;
        const animalId = req.params.id;

        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const animal = await Animal.findById(animalId).populate('subCategory');
        if (!animal) {
            return res.status(404).json({ status: 404, message: 'Animal not found' });
        }

        if (category) {
            const categoryId = await Category.findById(category);
            if (!categoryId) {
                return res.status(404).json({ status: 404, message: 'Category not found' });
            }
            animal.Category = category;
        }

        if (subCategory) {
            const subCategoryId = await SubCategory.findById(subCategory);
            if (!subCategoryId) {
                return res.status(404).json({ status: 404, message: 'SubCategory not found' });
            }
            animal.SubCategory = subCategory;
            animal.breed = subCategoryId.name;
        }

        if (name) animal.name = name;
        if (description) animal.description = description;
        if (price) animal.price = price;
        if (location) animal.location = location;
        if (age) animal.age = age;
        if (height) animal.height = height;
        if (length) animal.length = length;
        if (weight) animal.weight = weight;
        if (milkProduction) animal.milkProduction = milkProduction;
        if (isAvailable !== undefined) animal.isAvailable = isAvailable;

        if (req.files) {
            let newImages = [];
            for (let j = 0; j < req.files.length; j++) {
                newImages.push({ img: req.files[j].path });
            }
            animal.images = animal.images.concat(newImages);
        }

        await animal.save();
        return res.status(200).json({ status: 200, message: 'Animal updated successfully', data: animal });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', data: error.message });
    }
};

exports.deleteAnimalById = async (req, res) => {
    try {
        const animal = await Animal.findByIdAndDelete(req.params.id);
        if (!animal) {
            return res.status(404).json({ message: 'Animal not found', data: {} });
        }
        return res.status(200).json({ status: 200, message: 'Animal deleted successfully', data: animal });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', data: error.message });
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
            return res.status(404).json({ message: 'Animal not found', data: {} });
        }

        if (rating < 0 || rating > 5) {
            return res.status(400).json({ message: 'Invalid rating. Rating should be between 0 and 5.', data: {} });
        }

        const existingReview = animal.reviews.find((rev) => rev.user.equals(userId));
        if (existingReview) {
            return res.status(400).json({ status: 400, message: 'User has already reviewed this Animal' });
        }

        const newReview = { user: user._id, name: user.firstName + " " + user.lastName, rating, comment };
        animal.reviews.push(newReview);

        animal.rating = parseFloat(((animal.rating * animal.numOfUserReviews + rating) / (animal.numOfUserReviews + 1)).toFixed(2));

        animal.numOfUserReviews += 1;
        await animal.save();

        return res.status(201).json({ message: 'Review added successfully', data: newReview });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', data: error.message });
    }
};

exports.getAllReviews = async (req, res) => {
    try {
        const animalId = req.params.id;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const animal = await Animal.findById(animalId).populate({
            path: 'reviews.user',
            select: 'firstName lastName image mobileNumber email',
        });
        if (!animal) {
            return res.status(404).json({ message: 'Animal not found', data: {} });
        }

        const reviews = animal.reviews;

        return res.status(200).json({ status: 200, message: 'Reviews retrieved successfully', data: reviews });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', data: error.message });
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

        return res.status(201).json({ message: 'Seller details created successfully', data: newSellerDetails });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', data: error.message });
    }
};

exports.getAllSellerDetails = async (req, res) => {
    try {
        const allSellerDetails = await SellerDetails.find().populate('sellerDetails animal');
        return res.status(200).json({ status: 200, message: 'All seller details retrieved successfully', data: allSellerDetails });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', data: error.message });
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
        return res.status(500).json({ message: 'Internal server error', data: error.message });
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
        return res.status(500).json({ message: 'Internal server error', data: error.message });
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
        return res.status(500).json({ message: 'Internal server error', data: error.message });
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
        return res.status(500).json({ message: 'Internal server error', data: error.message });
    }
};

exports.deleteSellerDetailsById = async (req, res) => {
    try {
        const deletedSellerDetails = await SellerDetails.findByIdAndDelete(req.params.id);
        if (!deletedSellerDetails) {
            return res.status(404).json({ message: 'Seller details not found', data: {} });
        }
        return res.status(200).json({ status: 200, message: 'Seller details deleted successfully', data: deletedSellerDetails });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', data: error.message });
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

exports.createCoupon = async (req, res) => {
    try {
        const { title, desc, code, discount, isPercent, expirationDate, isActive } = req.body;

        if (!req.file) {
            return res.status(400).json({ status: 400, error: "Image file is required" });
        }

        const existingCoupon = await Coupon.findOne({ code });
        if (existingCoupon) {
            return res.status(400).json({ status: 400, error: "Coupon code already exists" });
        }

        const newCoupon = await Coupon.create({
            title,
            desc,
            code,
            image: req.file.path,
            discount,
            isPercent,
            expirationDate,
            isActive,
        });

        return res.status(201).json({ status: 201, message: 'Coupon created successfully', data: newCoupon });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find();
        return res.status(200).json({ status: 200, data: coupons });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.getCouponById = async (req, res) => {
    try {
        const couponId = req.params.id;
        const coupon = await Coupon.findById(couponId);

        if (!coupon) {
            return res.status(404).json({ status: 404, message: 'Coupon not found' });
        }

        return res.status(200).json({ status: 200, data: coupon });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.updateCouponById = async (req, res) => {
    try {
        const couponId = req.params.id;
        const updateFields = req.body;

        if (req.file) {
            updateFields.image = req.file.path;
        }

        if (updateFields.code) {
            const existingCoupon = await Coupon.findOne({ code: updateFields.code });
            if (existingCoupon && existingCoupon._id.toString() !== couponId) {
                return res.status(400).json({ status: 400, error: "Coupon code already exists" });
            }
        }

        const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, updateFields, { new: true });

        if (!updatedCoupon) {
            return res.status(404).json({ status: 404, message: 'Coupon not found' });
        }

        return res.status(200).json({ status: 200, message: 'Coupon updated successfully', data: updatedCoupon });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.deleteCouponById = async (req, res) => {
    try {
        const couponId = req.params.id;
        const deletedCoupon = await Coupon.findByIdAndDelete(couponId);

        if (!deletedCoupon) {
            return res.status(404).json({ status: 404, message: 'Coupon not found' });
        }

        return res.status(200).json({ status: 200, message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.createBanner = async (req, res) => {
    try {
        const { title, description, link, isActive } = req.body;

        if (!req.file) {
            return res.status(400).json({ status: 400, error: "Image file is required" });
        }

        const newBanner = await Banner.create({
            title,
            description,
            image: req.file.path,
            link,
            isActive,
        });

        return res.status(201).json({ status: 201, message: 'Banner created successfully', data: newBanner });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.getAllBanners = async (req, res) => {
    try {
        const banners = await Banner.find();
        return res.status(200).json({ status: 200, message: 'Banners retrieved successfully', data: banners });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.getBannerById = async (req, res) => {
    try {
        const bannerId = req.params.id;
        const banner = await Banner.findById(bannerId);

        if (!banner) {
            return res.status(404).json({ status: 404, message: 'Banner not found' });
        }

        return res.status(200).json({ status: 200, message: 'Banner retrieved successfully', data: banner });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.updateBannerById = async (req, res) => {
    try {
        const bannerId = req.params.id;
        const updateFields = req.body;

        if (req.file) {
            updateFields.image = req.file.path;
        }

        const updatedBanner = await Banner.findByIdAndUpdate(bannerId, updateFields, { new: true });

        if (!updatedBanner) {
            return res.status(404).json({ status: 404, message: 'Banner not found' });
        }

        return res.status(200).json({ status: 200, message: 'Banner updated successfully', data: updatedBanner });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.deleteBannerById = async (req, res) => {
    try {
        const bannerId = req.params.id;

        const deletedBanner = await Banner.findByIdAndDelete(bannerId);

        if (!deletedBanner) {
            return res.status(404).json({ status: 404, message: 'Banner not found' });
        }

        return res.status(200).json({ status: 200, message: 'Banner deleted successfully', data: deletedBanner });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.createSubscriptionPlan = async (req, res) => {
    try {
        const { name, duration, price, features } = req.body;

        const existingPlan = await SubscriptionPlan.findOne({ name });
        if (existingPlan) {
            return res.status(400).json({ status: 400, message: 'Subscription plan with this name already exists', data: existingPlan });
        }

        const newSubscriptionPlan = new SubscriptionPlan({
            name,
            duration,
            price,
            features,
        });

        await newSubscriptionPlan.save();

        return res.status(201).json({ message: 'Subscription plan created successfully', data: newSubscriptionPlan });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', data: error.message });
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

exports.updateSubscriptionPlanById = async (req, res) => {
    try {
        const subscriptionPlanId = req.params.id;
        const updateFields = req.body;

        if (updateFields.name) {
            const existingPlan = await SubscriptionPlan.findOne({ name: updateFields.name });

            if (existingPlan) {
                return res.status(400).json({ status: 400, message: 'Subscription plan with this name already exists', data: existingPlan });
            }
        }
        const updatedSubscriptionPlan = await SubscriptionPlan.findByIdAndUpdate(
            subscriptionPlanId,
            updateFields,
            { new: true }
        );

        if (!updatedSubscriptionPlan) {
            return res.status(404).json({ status: 404, message: 'Subscription plan not found' });
        }

        return res.status(200).json({ status: 200, message: 'Subscription plan updated successfully', data: updatedSubscriptionPlan });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', data: error.message });
    }
};

exports.deleteSubscriptionPlanById = async (req, res) => {
    try {
        const subscriptionPlanId = req.params.id;
        const deletedSubscriptionPlan = await SubscriptionPlan.findByIdAndDelete(subscriptionPlanId);

        if (!deletedSubscriptionPlan) {
            return res.status(404).json({ status: 404, message: 'Subscription plan not found' });
        }

        return res.status(200).json({ status: 200, message: 'Subscription plan deleted successfully', data: deletedSubscriptionPlan });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', data: error.message });
    }
};

exports.getAllUserSubscriptions = async (req, res) => {
    try {
        const allUserSubscriptions = await UserSubscription.find().populate('user subscriptionPlan');
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

exports.deleteUserSubscriptionById = async (req, res) => {
    try {
        const userSubscriptionId = req.params.id;

        const deletedUserSubscription = await UserSubscription.findByIdAndDelete(userSubscriptionId);

        if (!deletedUserSubscription) {
            return res.status(404).json({ status: 404, message: 'User subscription not found' });
        }

        return res.status(200).json({ status: 200, message: 'User subscription deleted successfully', data: deletedUserSubscription });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
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

exports.getAllorder = async (req, res) => {
    try {
        const orders = await Order.find();
        return res.status(200).json({ status: 200, data: orders });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.getAllPaidOrder = async (req, res) => {
    try {
        const orders = await Order.find({ paymentStatus: "Paid" });
        return res.status(200).json({ status: 200, data: orders });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error', data: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const { orderStatus, status } = req.body;

        const findUserOrder = await Order.findOne({ _id: orderId });
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

exports.getUserWalletBalance = async (req, res) => {
    try {
        const userId = req.params.userId;

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
}

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

exports.updateReferralStatus = async (req, res) => {
    try {
        const { referralId } = req.params;
        const { status, reward } = req.body;

        const referral = await Referral.findById(referralId);
        if (!referral) {
            return res.status(404).json({ message: 'Referral not found' });
        }

        if (status === 'Approved') {
            const referrerUser = await User.findById(referral.referrer);

            if (referrerUser) {
                try {
                    referrerUser.wallet += reward || 0;
                    await referrerUser.save();
                } catch (walletError) {
                    console.error(walletError);
                    return res.status(500).json({ message: 'Error updating referrer wallet balance', error: walletError.message });
                }
            }
        }

        referral.status = status;
        referral.reward = reward || 0;
        await referral.save();

        res.status(200).json({ message: 'Referral updated successfully', data: referral });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
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

exports.deleteReferral = async (req, res) => {
    try {
        const referral = await Referral.findByIdAndDelete(req.params.referralId);
        if (!referral) {
            return res.status(404).json({ status: 404, message: 'Referral not found' });
        }
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ status: 500, message: 'Server error', error: error.message });
    }
};
