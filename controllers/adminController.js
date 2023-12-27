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
            return res.status(200).json({ message: "Category add successfully.", status: 200, data: category });
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
        return res.status(200).json({ message: "Updated Successfully", data: update });
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
        return res.status(200).json({ message: "Category Deleted Successfully !" });
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
            return res.status(200).json({ message: "Category add successfully.", status: 200, data: subCategory });
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

        return res.status(200).json({ message: "SubCategories Found", status: 200, data: SubCategories });
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

        return res.status(200).json({ message: "Updated Successfully", data: updatedSubCategories });
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
        return res.status(200).json({ message: "SubCategories Deleted Successfully !" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: "Internal server error", data: error.message });
    }
};

exports.createAnimal = async (req, res) => {
    try {
        const { category, subCategory, name, description, price, location, age, height, length, weight, milkProduction, sellerDetails, isAvailable } = req.body;
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
            sellerDetails,
            isAvailable,
        });

        await newAnimal.save();
        res.status(201).json({ message: 'Animal created successfully', data: newAnimal });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', data: error.message });
    }
};

exports.getAllAnimals = async (req, res) => {
    try {
        const animals = await Animal.find().populate('sellerDetails reviews.user category subCategory owner');
        res.status(200).json({ message: 'Animals retrieved successfully', data: animals });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', data: error.message });
    }
};

exports.getAnimalById = async (req, res) => {
    try {
        const animal = await Animal.findById(req.params.id).populate('sellerDetails reviews.user category subCategory owner');
        if (!animal) {
            return res.status(404).json({ message: 'Animal not found', data: {} });
        }
        res.status(200).json({ message: 'Animal retrieved successfully', data: animal });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', data: error.message });
    }
};

exports.updateAnimal = async (req, res) => {
    try {
        const { category, subCategory, name, description, price, location, age, height, length, weight, milkProduction, sellerDetails, isAvailable } = req.body;
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
        if (sellerDetails) animal.sellerDetails = sellerDetails;
        if (isAvailable !== undefined) animal.isAvailable = isAvailable;

        if (req.files) {
            let newImages = [];
            for (let j = 0; j < req.files.length; j++) {
                newImages.push({ img: req.files[j].path });
            }
            animal.images = animal.images.concat(newImages);
        }

        await animal.save();
        res.status(200).json({ message: 'Animal updated successfully', data: animal });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', data: error.message });
    }
};

exports.deleteAnimalById = async (req, res) => {
    try {
        const animal = await Animal.findByIdAndDelete(req.params.id);
        if (!animal) {
            return res.status(404).json({ message: 'Animal not found', data: {} });
        }
        res.status(200).json({ message: 'Animal deleted successfully', data: animal });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', data: error.message });
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

        const newReview = { user: user._id, name: user.firstName + " " + user.lastName, rating, comment };
        animal.reviews.push(newReview);

        animal.rating = parseFloat(((animal.rating * animal.numOfUserReviews + rating) / (animal.numOfUserReviews + 1)).toFixed(2));

        animal.numOfUserReviews += 1;
        await animal.save();

        res.status(201).json({ message: 'Review added successfully', data: newReview });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', data: error.message });
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

        res.status(200).json({ message: 'Reviews retrieved successfully', data: reviews });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', data: error.message });
    }
};
