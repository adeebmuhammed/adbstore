const User = require("../../models/userSchema")
const Product = require("../../models/productSchema")
const Category = require("../../models/categorySchema")
const Brand = require("../../models/brandSchema")
const Cart = require("../../models/cartSchema")
const env = require('dotenv').config()
const path = require('path')

const getShopPage = async (req,res) => {
    try {
        const page = req.query.page || 1
        const limit = 10

        const category = await Category.find()

        const product = await Product.find()
        .limit(limit * 1)
        .skip((page - 1) * limit)
        const count = product.length

        const brand = await Brand.find()
        const user = req.session.user;
        const sort = req.query.sort || 'priceAsc';
        let userData = null
        

        if (user) {
            userData = await User.findOne({ _id: user});
        }


        res.render("shop",{
            cat:category,
            product:product,
            brand:brand,
            user:userData,
            selectedSort: sort,
            currentPage:page,
            totalPages:Math.ceil(count/limit),
            categories:[]
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
            category: product.category,
            _id: { $ne: id }, 
        }).limit(4);
        

        if (user) {
            userData = await User.findOne({ _id: user});
        }else

        
        res.render("product-details",{
            product:product,
            cat:category,
            user:userData,
            availableSizes:availableSizes,
            relatedProducts:relatedProducts,
        })
    } catch (error) {
        console.error(error)
        res.redirect("/pageNotFound")
    }
}

const sortProducts = async (req,res) => {
    try {
        const page = req.query.page || 1
        const limit = 10

        const category = await Category.find()
        const brand = await Brand.find()
        const user = req.session.user;
        let userData = null
        const sort = req.query.sort || 'priceAsc';
        let sortCriteria;
        
        

        if (user) {
            userData = await User.findOne({ _id: user});
        }else

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

    const product = await Product.find().sort(sortCriteria).limit(limit * 1).skip((page - 1) * limit)
    const count = product.length

    res.render("shop",{
        cat:category,
        product,
        brand:brand,
        user:userData,
        selectedSort: sort,
        currentPage:page,
        totalPages:Math.ceil(count/limit),
        categories:[]
    })
    } catch (error) {
        res.status(500).json({message:"Internal server error"})
        console.error(error);
    }
}

const categoryFilter = async (req, res) => {
    try {
        const page = req.query.page || 1
        const limit = 10

        const { categories } = req.query; 
        const category = await Category.find();
        const brand = await Brand.find();
        const user = req.session.user;
        const sort = req.query.sort || 'priceAsc';

        if (!categories || categories.length === 0) {
            const allProducts = await Product.find().limit(limit * 1).skip((page - 1) * limit)
            const count = product.length

            return res.render("shop", {
                cat: category,
                product: allProducts,
                brand: brand,
                user,
                selectedSort: sort,
                currentPage:page,
                totalPages:Math.ceil(count/limit)
            });
        }
        

        const filterCriteria = { category: { $in: categories } };
        const product = await Product.find(filterCriteria).limit(limit * 1).skip((page - 1) * limit)
        const count = product.length

        res.render("shop", {
            cat: category,
            product,
            brand,
            user,
            selectedSort: sort,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            categories: Array.isArray(req.query.categories) ? req.query.categories : [req.query.categories].filter(Boolean)
        });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const searchProducts = async (req,res) => {
    try {
        const page = req.query.page || 1
        const limit = 10

        const {search} = req.query
        const category = await Category.find()
        const brand = await Brand.find()
        const user = req.session.user;
        const sort = req.query.sort || 'priceAsc';

        const product = await Product.find({
            productName: { $regex: search, $options: 'i' }
        }).limit(limit * 1).skip((page - 1) * limit)
        const count = product.length



        res.render("shop",{
            cat:category,
            product,
            brand:brand,
            user,
            selectedSort: sort,
            currentPage:page,
            totalPages:Math.ceil(count/limit),
            categories:[]
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