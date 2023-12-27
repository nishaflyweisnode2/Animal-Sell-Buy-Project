const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
    Category: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category'
    },
    name: {
        type: String
    },
    status: {
        type: Boolean,
        default: true
    },

}, { timestamps: true });

const SubCategory = mongoose.model('SubCategory', subCategorySchema);

module.exports = SubCategory;
