const User = require("../../models/userSchema")
const Product = require("../../models/productSchema")
const Category = require("../../models/categorySchema")
const Brand = require("../../models/brandSchema")
const env = require('dotenv').config()
const path = require('path')

const getShopPage = async (req,res) => {
    try {
        const category = await Category.find()
        const product = await Product.find()
        const brand = await Brand.find()
        const user = req.session.user;
        let userData = null
        

        if (user) {
            userData = await User.findOne({ _id: user});
        }else {
            return res.redirect("/login");
        }
        res.render("shop",{
            cat:category,
            product:product,
            brand:brand,
            user:userData
        })
    } catch (error) {
        console.error(error)
        res.redirect("/pageNotFound")
    }
}

const getProductDetails = async (req,res) => {
    try {
        const id = req.query.id
        const product = await Product.findById(id)
        const availableSizes = product.sizes;
        const category = await Category.findById(product.category)
        const user = req.session.user;
        let userData = null
        const relatedProducts = await Product.find({
            category: product.category, // Find products in the same category
            _id: { $ne: id }, // Exclude the current product
        }).limit(4);
        

        if (user) {
            userData = await User.findOne({ _id: user});
        }else {
            return res.redirect("/login");
        }
        
        res.render("product-details",{
            product:product,
            cat:category,
            user:userData,
            availableSizes:availableSizes,
            relatedProducts:relatedProducts
        })
    } catch (error) {
        console.error(error)
        res.redirect("/pageNotFound")
    }
}

module.exports = {
    getShopPage,
    getProductDetails,
}