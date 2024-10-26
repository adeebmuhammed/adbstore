const express = require("express")
const router = express.Router()

const userController = require("../controllers/user/userController")
const shopController = require("../controllers/user/shopController")
const profileController = require("../controllers/user/profileController")
const addressController = require("../controllers/user/addressController")
const cartController = require("../controllers/user/cartController")
const checkoutController = require("../controllers/user/checkoutController")
const orderController = require("../controllers/user/orderController")
const couponController = require("../controllers/user/couponController")

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
router.get("/products",userAuth,shopController.sortProducts)
//Profile Management
router.get("/profile",userAuth,profileController.getProfilePage)
router.post("/update-profile",userAuth,profileController.updateProfile)
router.get("/forgot-password",profileController.getForgotPassword)
router.post("/forgot-email-valid", profileController.forgotEmailValid);
router.post("/verify-forgotPassword-otp",profileController.verifyForgotPasswordOtp)
router.get("/reset-password",profileController.getResetPasswordPage)
router.post("/resend-forgot-otp",profileController.resendOtp)
router.post("/reset-password",profileController.resetPassword)
//Address Management
router.get("/manage-addresses",userAuth,addressController.getManageAddresses)
router.get("/manage-addresses/add-address",userAuth,addressController.getAddAddress)
router.post("/manage-addresses/add-address",userAuth,addressController.addAddress)
router.get("/manage-addresses/edit-address/:addressId",userAuth,addressController.getEditAddress)
router.post("/manage-addresses/edit-address/:addressId",userAuth,addressController.editAddress)
router.delete('/manage-addresses/delete-address/:addressId',userAuth, addressController.deleteAddress);
//Cart Management
router.get("/cart",userAuth,cartController.getCartPage)
router.post("/addToCart",userAuth,cartController.addToCart)
router.post("/removeFromCart",userAuth,cartController.removeFromCart)
router.post("/update-cart",userAuth,cartController.updateCart)
//Checkout Management
router.get("/checkout",userAuth,checkoutController.getCheckoutPage)
router.post("/place-order",userAuth,checkoutController.placeOrder)
router.post('/verify-payment',userAuth, checkoutController.verifyPayment);
router.get("/order-confirmation/:orderId",userAuth,checkoutController.orderConfirmation)
//Order Management
router.get("/orders",userAuth,orderController.getMyOrders)
router.post("/cancel-order/:orderId",userAuth,orderController.cancelOrder)
//Coupon Management
router.get("/coupons",userAuth,couponController.getCouponPage)

module.exports = router;