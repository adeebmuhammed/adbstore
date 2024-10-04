const User = require("../../models/userSchema")
const nodemailer = require("nodemailer")
const bcrypt = require("bcrypt")
const env = require("dotenv").config()
const session = require("express-session")

const {generateOtp} = require("../../helpers/generateOtp")
const {sendVerificationEmail} = require("../../helpers/sendVerificationMail")
const {securePassword} = require("../../helpers/securePassword")

const getProfilePage = async (req,res) => {
    try {
        const userData = await User.findById(req.session.user)
        if(userData){
            res.render("profile",{
                user:userData
            })
        }else{
            res.redirect("/pageNotFound")
        }
    } catch (error) {
        console.error(error)
        res.redirect("/pageNotFound")
    }
}

const updateProfile = async (req,res) => {
    try {
        const {userId,name,phone} = req.body
        const user = await User.findOne({name:name})
        
        if (user) {
            return res.status(400).json({error:"User with this name already exists, please choose another name"})
        }

        const updateUser = await User.findByIdAndUpdate(userId,{
            name:name,
            phone:phone
        },{new:true})

        if (updateUser) {
            return res.json({message:"Profile Edited Successfully"})
        }else{
            return res.status(400).json({error:"Error In Editing Profile"})
        }
    } catch (error) {
        console.error(error)
        res.redirect("/pageNotFound")
    }
}

const getForgotPassword = async (req,res) => {
    try {
        res.render("forgot-password")
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const forgotEmailValid = async (req,res) => {
    try {
        const {email} = req.body
        const findUser = await User.findOne({email:email})
        if(findUser){
            const otp = generateOtp()
            const emailSent = await sendVerificationEmail(email,otp)

            if(emailSent){
                req.session.userOtp = otp
                req.session.email = email
                res.render("forgotPassword-otp")
                console.log("OTP : ",otp);
                
            }else{
                res.json({success:false,message:"Failed to send otp, please try again"})
            }
        }else{
            res.render("forgot-password",{
                message:"User with this email doesn't exist"
            })
        }
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const verifyForgotPasswordOtp = async (req,res) => {
    try {
        const enteredOtp = req.body.otp

        if(enteredOtp === req.session.userOtp){
            res.json({success:true,redirectUrl:"/reset-password"})
        }else{
            res.json({success:false,message:"OTP not matching"})
        }
    } catch (error) {
        res.status(500).json({success:false,message:"An error occured ,please try again"})
    }
}

const getResetPasswordPage = async (req,res) => {
    try {
        res.render("reset-password")
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const resendOtp = async (req,res) => {
    try {
        const otp = generateOtp()
        req.session.userOtp = otp
        const email = req.session.email
        const emailSent = await sendVerificationEmail(email,otp)

        if(emailSent){
            console.log("Resend OTP : ",otp);
            res.status(200).json({success:true,message:"Resend OTP Successfully"})
        }
    } catch (error) {
        console.error("Error in resend OTP",error)
        res.status(500).json({success:false,message:"Internal Server Error"})
    }
}

const resetPassword = async (req,res) => {
    try {
        const {newPass1,newPass2} = req.body
        const email = req.session.email

        if(newPass1 === newPass2){
            const passwordHash = await securePassword(newPass1)
            await User.updateOne(
                {email:email},
                {$set:{password:passwordHash}}
            )

            res.redirect("/login")
        }else{
            res.render("reset-password",{message:"Password do not match"})
        }
    } catch (error) {
        console.error(error)
        res.redirect("/pageNotFound")
    }
}

module.exports = {
    getProfilePage,
    updateProfile,
    getForgotPassword,
    forgotEmailValid,
    verifyForgotPasswordOtp,
    getResetPasswordPage,
    resendOtp,
    resetPassword
}