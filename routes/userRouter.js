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
const walletController = require("../controllers/user/walletController")
const wishlistController = require("../controllers/user/wishlistController")

const passport = require("passport")
const {userAuth,adminAuth} = require("../middlewares/auth")
const {cartItemCountMiddleware} = require("../middlewares/cartItemCountMiddleware")

//Error Management
router.get('/pageNotFound',userController.pageNotFound)
//User Management
router.get("/",cartItemCountMiddleware,userController.loadHomepage)
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
router.get("/shop",cartItemCountMiddleware,shopController.getShopPage)
router.get("/productDetails",cartItemCountMiddleware,shopController.getProductDetails)
router.get("/products",cartItemCountMiddleware,shopController.sortProducts)
router.get("/categoryFilter",cartItemCountMiddleware,shopController.categoryFilter)
router.get("/search",cartItemCountMiddleware,shopController.searchProducts)
//Profile Management
router.get("/profile",userAuth,cartItemCountMiddleware,profileController.getProfilePage)
router.post("/update-profile",userAuth,cartItemCountMiddleware,profileController.updateProfile)
router.get("/forgot-password",profileController.getForgotPassword)
router.post("/forgot-email-valid", profileController.forgotEmailValid);
router.post("/verify-forgotPassword-otp",profileController.verifyForgotPasswordOtp)
router.get("/reset-password",profileController.getResetPasswordPage)
router.post("/resend-forgot-otp",profileController.resendOtp)
router.post("/reset-password",profileController.resetPassword)
//Address Management
router.get("/manage-addresses",userAuth,cartItemCountMiddleware,addressController.getManageAddresses)
router.get("/manage-addresses/add-address",userAuth,cartItemCountMiddleware,addressController.getAddAddress)
router.post("/manage-addresses/add-address",userAuth,cartItemCountMiddleware,addressController.addAddress)
router.get("/manage-addresses/edit-address/:addressId",userAuth,cartItemCountMiddleware,addressController.getEditAddress)
router.post("/manage-addresses/edit-address/:addressId",userAuth,cartItemCountMiddleware,addressController.editAddress)
router.delete('/manage-addresses/delete-address/:addressId',userAuth,cartItemCountMiddleware, addressController.deleteAddress);
//Cart Management
router.get("/cart",userAuth,cartItemCountMiddleware,cartController.getCartPage)
router.post("/addToCart",userAuth,cartItemCountMiddleware,cartController.addToCart)
router.post("/removeFromCart",userAuth,cartItemCountMiddleware,cartController.removeFromCart)
router.post("/update-cart",userAuth,cartItemCountMiddleware,cartController.updateCart)
//Checkout Management
router.get("/checkout",userAuth,cartItemCountMiddleware,checkoutController.getCheckoutPage)
router.post("/place-order",userAuth,cartItemCountMiddleware,checkoutController.placeOrder)
router.post('/verify-payment',userAuth,cartItemCountMiddleware, checkoutController.verifyPayment);
router.get("/order-confirmation/:orderId",userAuth,cartItemCountMiddleware,checkoutController.orderConfirmation)
router.get("/payment-failed/:orderId",userAuth,cartItemCountMiddleware,checkoutController.paymentFailed)
router.post("/retry-payment/:orderId", userAuth,cartItemCountMiddleware, checkoutController.retryPayment)
router.post('/verify-retry-payment',userAuth,cartItemCountMiddleware, checkoutController.verifyRetryPayment);
//Order Management
router.get("/orders",userAuth,cartItemCountMiddleware,orderController.getMyOrders)
router.post("/cancel-order/:orderId",userAuth,cartItemCountMiddleware,orderController.cancelOrder)
router.post("/return-order/:orderId",userAuth,cartItemCountMiddleware,orderController.returnOrder)
router.get("/orderDetails/:orderId",userAuth,cartItemCountMiddleware,orderController.getOrderDetails)
//Coupon Management
router.get("/coupons",userAuth,cartItemCountMiddleware,couponController.getCouponPage)
router.post("/addCoupon",userAuth,cartItemCountMiddleware,couponController.addCoupon)
router.post("/removeCoupon",userAuth,cartItemCountMiddleware,couponController.removeCoupon)
//Wallet Management
router.get("/wallet",userAuth,cartItemCountMiddleware,walletController.getWalletPage)
//Wishlist Management
router.get("/wishlist",userAuth,cartItemCountMiddleware,wishlistController.getWishlistPage)
router.post("/addToWishlist",userAuth,cartItemCountMiddleware,wishlistController.addToWishlist)
router.post("/removeFromWishlist/:productId", userAuth,cartItemCountMiddleware, wishlistController.removeFromWishlist);

module.exports = router;