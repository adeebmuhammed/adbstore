const express = require("express")
const router = express.Router()
const userController = require("../controllers/user/userController")
const shopController = require("../controllers/user/shopController")
const profileController = require("../controllers/user/profileController")
const addressController = require("../controllers/user/addressController")
const passport = require("passport")
const {userAuth,adminAuth} = require("../middlewares/auth")

//Error Management
router.get('/pageNotFound',userController.pageNotFound)
//User Management
router.get("/",userController.loadHomepage)
router.get('/signup',userController.loadSignup)
router.post("/signup",userController.signup)
router.post("/verify-otp",userController.verifyOtp)
router.post("/resend-otp",userController.resendOtp)
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    req.session.user = req.user
    res.redirect('/')
})
router.get("/login",userController.loadLogin)
router.post("/login",userController.login)
router.get("/logout",userController.logout)
//Shop Management
router.get("/shop",userAuth,shopController.getShopPage)
router.get("/productDetails",userAuth,shopController.getProductDetails)
//Profile Management
router.get("/profile",userAuth,profileController.getProfilePage)
router.post("/update-profile",userAuth,profileController.updateProfile)
//Address Management
router.get("/manage-addresses",userAuth,addressController.getManageAddresses)
router.get("/manage-addresses/add-address",userAuth,addressController.getAddAddress)
router.post("/manage-addresses/add-address",userAuth,addressController.addAddress)
router.get("/manage-addresses/edit-address/:addressId",userAuth,addressController.getEditAddress)
router.post("/manage-addresses/edit-address/:addressId",userAuth,addressController.editAddress)
router.delete('/manage-addresses/delete-address/:addressId', addressController.deleteAddress);

module.exports = router;