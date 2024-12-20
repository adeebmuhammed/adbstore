const User = require("../../models/userSchema")
const Cart = require("../../models/cartSchema")
const Product = require("../../models/productSchema")
const Banner = require("../../models/bannerSchema")
const env = require('dotenv').config()
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')

const loadHomepage = async (req, res) => {
    try {
        const today = new Date().toISOString()
        const user = req.session.user;
        const product = await Product.find().sort({createdAt:-1}).limit(3)
        const banner = await Banner.find({
            startDate:{$lt:new Date(today)},
            endtDate:{$gt:new Date(today)}
        })

        if (user) {
            const userData = await User.findOne({ _id: user });

            return res.render("home", { user: userData,product, banner });
        } else {
            return res.render("home", { user: null,product, banner});
        }
    } catch (error) {
        res.status(500).send("Server error");
    }
};

const loadSignup = async (req,res)=> {
    try {
        return res.render('signup')
    } catch (error) {
        res.status(500).send("server error")
    }
}

function generateOtp(){
    return Math.floor(100000 + Math.random()*900000).toString()
}

async function sendVerificationEmail(email,otp){
    try {
        const transporter = nodemailer.createTransport({
            service:'gmail',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD
            }
        })

        const info = await transporter.sendMail({
            from:process.env.NODEMAILER_EMAIL,
            to:email,
            subject:"Verify Your Account",
            text:`Your OTP is ${otp}`,
            html:`<b>Your OTP: ${otp}</b>`,
        })

        return info.accepted.length > 0
    } catch (error) {
        return false
    }
}

const signup = async(req,res)=>{
    try {
        const {name,phone,email,password,cPassword}= req.body

        if(password !== cPassword){
            return res.render("signup",{message:"passwords do not match"})
        }

        const findUser = await User.findOne({email})
        if(findUser){
            return res.render("signup",{message:"User with this email already exists"})
        }

        const otp = generateOtp()

        const emailSent = await sendVerificationEmail(email,otp)

        if(!emailSent){
            return res.json("email-error")
        }

        req.session.userOtp = otp
        req.session.userData = {name,phone,email,password}

        res.render("verify-otp")
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const securePassword = async(password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10)

        return passwordHash
    } catch (error) {
        
    }
}

const verifyOtp = async(req,res)=>{
    try {
        const {otp} = req.body

        if(otp===req.session.userOtp){
            const user = req.session.userData
            const passwordHash = await securePassword(user.password)

            const saveUserData = new User({
                name:user.name,
                email:user.email,
                phone:user.phone,
                password:passwordHash
            })

            await saveUserData.save()
            req.session.user = saveUserData._id;
            req.session.items = 0
            res.json({success:true,redirectUrl:"/"})
        }else{
            res.status(400).json({success:false,message:"Invalid OTP, Please try again"})
        }
    } catch (error) {
        res.status(500).json({success:false,message:"An error Occured"})
    }
}

const resendOtp = async(req,res)=>{
    try {
        const {email}= req.session.userData
        if(!email){
            return res.status(400).json({success:false,message:"Email not found in session"})
        }

        const otp = generateOtp()
        req.session.userOtp = otp

        const emailSent = await sendVerificationEmail(email,otp)

        if(emailSent){
            res.status(200).json({success:true,message:"OTP resend successfully"})
        }else{
            res.status(500).json({success:false,message:"Failed to resend OTP. Please try again"})
        }
    } catch (error) {
        res.status(500).json({success:false,message:"Internal Server error, Please try again"})
    }
}

const loadLogin = async(req,res)=>{
    try {
        if(!req.session.user){
            return res.render("login")
        }else{
            res.redirect('/')
        }
    } catch (error) {
        res.redirect("pageNotFound")
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!password) {
            return res.render("login", { message: "Password is required" });
        }

        const findUser = await User.findOne({ isAdmin: 0, email: email });
        if (!findUser) {
            return res.render("login", { message: "User not found" });
        }
        if (findUser.isBlocked) {
            return res.render("login", { message: "User is blocked by admin" });
        }

        const passwordMatch = await bcrypt.compare(password, findUser.password);
        if (!passwordMatch) {
            return res.render("login", { message: "Incorrect Password" });
        }

        req.session.user = findUser._id;
        res.redirect("/");
    } catch (error) {
        res.render("login", { message: "Login failed, please try again later" });
    }
};

const logout = async (req,res)=>{
    try {
        req.session.destroy((err)=>{
            if(err){
                console.log("Session destruction error",err.message);
                res.redirect("/pageNotFound")
            }
            return res.redirect("/login")
        })
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const pageNotFound = async (req,res)=> {
    try {
        res.render('page-404')
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

module.exports = {
    loadHomepage,
    loadSignup,
    signup,
    verifyOtp,
    resendOtp,
    loadLogin,
    login,
    logout,
    pageNotFound
}