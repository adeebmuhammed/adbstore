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
            const [products, categories, brands] = await Promise.all([
                Product.find().sort({ saleCount: -1 }).limit(10).lean(),
                Category.find().sort({ saleCount: -1 }).limit(10).lean(),
                Brand.find().sort({ saleCount: -1 }).limit(10).lean()
            ]);

            return res.render("dashboard", {
                products,
                categories,
                brands
            });
        }
    } catch (error) {
        res.redirect("/admin/pageerror");
    }
};

const salesData = async (req, res) => {
    const filter = req.query.filter;
    let salesData = [];

    try {
        if (filter === 'yearly') {
            salesData = await getSalesCountByYear();
        } else if (filter === 'monthly') {
            salesData = await getSalesCountByMonth();
        } else if (filter === 'weekly') {
            salesData = await getSalesCountByWeek();
        }

        res.json({ success: true, data: salesData });
    } catch (error) {
        console.error("Error fetching sales data:", error);
        res.status(500).json({ success: false, message: 'Error fetching sales data' });
    }
};

// Function to get sales count for the current year
const getSalesCountByYear = async () => {
    const currentYear = new Date().getFullYear();
    return await Order.aggregate([
        { 
            $match: {
                status: { $in: ['Delivered', 'Placed'] },
                createdOn: {
                    $gte: new Date(currentYear, 0, 1),
                    $lt: new Date(currentYear + 1, 0, 1)
                }
            }
        },
        { $unwind: "$orderedItems" },
        {
            $group: {
                _id: "$orderedItems.product",
                salesCount: { $sum: "$orderedItems.quantity" }
            }
        },
        { $sort: { salesCount: -1 } }, // Sort by salesCount
        { $limit: 10 } // Limit to top 10 products
    ]);
};

// Function to get sales count for the current month
const getSalesCountByMonth = async () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return await Order.aggregate([
        { 
            $match: {
                status: { $in: ['Delivered', 'Placed'] },
                createdOn: {
                    $gte: new Date(currentYear, currentMonth, 1),
                    $lt: new Date(currentYear, currentMonth + 1, 1)
                }
            }
        },
        { $unwind: "$orderedItems" },
        {
            $group: {
                _id: "$orderedItems.product",
                salesCount: { $sum: "$orderedItems.quantity" }
            }
        },
        { $sort: { salesCount: -1 } },
        { $limit: 10 }
    ]);
};

// Function to get sales count for the current week
const getSalesCountByWeek = async () => {
    const currentDate = new Date();
    const startOfWeek = currentDate.setDate(currentDate.getDate() - currentDate.getDay()); // Sunday
    const endOfWeek = startOfWeek + 7 * 24 * 60 * 60 * 1000; // Next Saturday

    return await Order.aggregate([
        { 
            $match: {
                status: { $in: ['Delivered', 'Placed'] },
                createdOn: { $gte: new Date(startOfWeek), $lt: new Date(endOfWeek) }
            }
        },
        { $unwind: "$orderedItems" },
        {
            $group: {
                _id: "$orderedItems.product",
                salesCount: { $sum: "$orderedItems.quantity" }
            }
        },
        { $sort: { salesCount: -1 } },
        { $limit: 10 }
    ]);
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