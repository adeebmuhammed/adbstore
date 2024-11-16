const User = require("../../models/userSchema")
const Product = require("../../models/productSchema")
const Brand = require("../../models/brandSchema")
const Category = require("../../models/categorySchema")
const Order = require("../../models/orderSchema")
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const pageerror = async (req,res) => {
    res.render("admin-error")
}

const loadLogin = (req,res)=>{
    if(req.session.admin){
        return res.redirect("/admin/dashboard")
    }
    res.render("admin-login",{message:null})
}

const login = async (req,res) => {
    try {
        const {email,password} = req.body
        const admin = await User.findOne({email,isAdmin:true})
        
        if(admin){
            const passwordMatch = await bcrypt.compare(password,admin.password)
            if(passwordMatch){
                req.session.admin = true
                return res.redirect("/admin")
            }else{
                return res.redirect("/admin/login")
            }
        }else{
            return res.redirect("/admin/login")
        }
    } catch (error) {
        console.log("login error",error);
        return res.redirect("/admin/pageerror")
    }
}

const loadDashboard = async (req, res) => {
    try {
        if (req.session.admin) {
            const orders = await Order.find({ status: { $ne: "Canceled" } })
                .populate({
                    path: "orderedItems.product",
                    populate: [
                        { path: "category", select: "_id name" } 
                    ]
                });

            const productSales = {};
            const categorySales = {};
            const brandSales = {};

            orders.forEach((order) => {
                order.orderedItems.forEach((item) => {
                    if (item.product) {
                        productSales[item.product._id] = (productSales[item.product._id] || 0) + item.quantity;

                        if (item.product.category) {
                            const categoryId = item.product.category._id.toString();
                            categorySales[categoryId] = (categorySales[categoryId] || 0) + item.quantity;
                        }

                        if (item.product.brand) {
                            const brandName = item.product.brand; 
                            brandSales[brandName] = (brandSales[brandName] || 0) + item.quantity;
                        }
                    }
                });
            });

            const products = await Product.find({});
            const categories = await Category.find({});
            const brands = await Brand.find({});

            return res.render("dashboard", {
                products,
                categories,
                brands,
                productSales,
                categorySales,
                brandSales
            });
        }
    } catch (error) {
        res.redirect("/admin/pageerror");
        console.error(error);
    }
};

const salesData = async (req, res) => {
    try {
        const { filter } = req.query;

        const currentDate = new Date();
        let startDate, endDate, groupFormat;

        // Define date ranges and grouping format based on filter
        if (filter === 'yearly') {
            startDate = new Date(currentDate.getFullYear() - 3, 0, 1); // Start of 3 years ago
            endDate = new Date(currentDate.getFullYear() + 1, 0, 1); // Start of next year
            groupFormat = { $year: "$createdOn" }; // Group by year
        } else if (filter === 'monthly') {
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1); // Start of 6 months ago
            endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1); // Start of next month
            groupFormat = { $month: "$createdOn" }; // Group by month
        } else if (filter === 'weekly') {
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 27); // 4 weeks ago
            endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1); // Tomorrow
            groupFormat = { $week: "$createdOn" }; 
        }

        const data = await Order.aggregate([
            {
                $match: {
                    createdOn: { $gte: startDate, $lt: endDate },
                    status: { $ne: "Canceled" } 
                }
            },
            {
                $group: {
                    _id: groupFormat, 
                    totalSales: { $sum: "$finalAmount" } 
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const labels = data.map(item => item._id.toString());
        const salesData = data.map(item => item.totalSales);

        res.json({ labels, salesData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch sales data' });
    }
};

const logout = async (req,res) => {
    try {
        req.session.destroy(err=>{
            if(err){
                console.log("Error destroying session",err);
                return res.redirect("/admin/pageerror")
            }
            res.redirect("/admin/login")
        })
    } catch (error) {
        console.log("Unexpected error during logout",error);
        res.redirect("/admin/pageerror")
    }
}

module.exports = {
    pageerror,
    loadLogin,
    login,
    loadDashboard,
    logout,
    salesData
}