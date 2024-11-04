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
        const sort = req.query.sort || 'priceAsc';
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
            user:userData,
            selectedSort: sort
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

const sortProducts = async (req,res) => {
    try {

        const category = await Category.find()
        const brand = await Brand.find()
        const user = req.session.user;
        let userData = null
        const sort = req.query.sort || 'priceAsc';
        let sortCriteria;
        
        

        if (user) {
            userData = await User.findOne({ _id: user});
        }else {
            return res.redirect("/login");
        }

    switch (sort) {
        case 'priceAsc':
            sortCriteria = { salePrice: 1 }; 
            break;
        case 'priceDesc':
            sortCriteria = { salePrice: -1 };
            break;
        case 'newest':
            sortCriteria = { createdAt: -1 }; 
            break;
        case 'oldest':
            sortCriteria = { createdAt: 1 }; 
            break;
        case 'alphaAsc':
            sortCriteria = { productName: 1 }; 
            break;
        case 'alphaDesc':
            sortCriteria = { productName: -1 };
            break;
        default:
            sortCriteria = {}; 
    }

    const product = await Product.find().sort(sortCriteria);

    res.render("shop",{
        cat:category,
        product,
        brand:brand,
        user:userData,
        selectedSort: sort
    })
    } catch (error) {
        res.status(500).json({message:"Internal server error"})
        console.error(error);
    }
}

const categoryFilter = async (req,res) => {
    try {
        const {categoryId} = req.query
        const category = await Category.find()
        const brand = await Brand.find()
        const user = req.session.user;
        const sort = req.query.sort || 'priceAsc';

        if(!categoryId){
            return res.json({success:false,message:"Invalid category"})
        }

        const product = await Product.find({category:categoryId})

        res.render("shop",{
            cat:category,
            product,
            brand:brand,
            user,
            selectedSort: sort
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({success:false,message:"Internal server error"})
    }
}

const searchProducts = async (req,res) => {
    try {
        const {search} = req.query
        const category = await Category.find()
        const brand = await Brand.find()
        const user = req.session.user;
        const sort = req.query.sort || 'priceAsc';

        const product = await Product.find({
            productName: { $regex: search, $options: 'i' }
        });


        res.render("shop",{
            cat:category,
            product,
            brand:brand,
            user,
            selectedSort: sort
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({success:false,message:"Internal server error"})
    }
}

module.exports = {
    getShopPage,
    getProductDetails,
    sortProducts,
    categoryFilter,
    searchProducts
}