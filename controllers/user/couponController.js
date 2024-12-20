const Coupon = require("../../models/couponSchema")
const User = require("../../models/userSchema")
const Cart = require("../../models/cartSchema")

const getCouponPage = async (req,res) => {
    try {
        const userId = req.session.user
        const user = await User.findOne({_id:userId})
        const coupons = await Coupon.find({isListed:true})

        res.render("coupon",{coupons,user})
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const addCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;

        const coupon = await Coupon.findOne({ code: couponCode, isListed: true });
        if (!coupon) {
            return res.status(400).json({ message: 'Invalid coupon code.' });
        }

        const currentDate = new Date();
        if (currentDate > coupon.expireOn) {
            return res.status(400).json({ message: 'Coupon has expired.' });
        }

        const cart = await Cart.findOne({ userId: req.session.user });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty.' });
        }

        const totalPrice = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
        let discount = 0;
        if (totalPrice >= coupon.minimumPrice) {
            discount = (totalPrice * coupon.offerPrice) / 100;
            discount = Math.min(discount, totalPrice); 
        }else{
            return res.status(400).json({ message: `Total price should be greater than ${coupon.minimumPrice}` });
        }

        cart.discount = discount;
        cart.couponApplied = coupon._id;
        await cart.save();

        res.status(200).json({ success: true, message: 'Coupon applied successfully!', discount });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred while applying the coupon.', error });
    }
};

const removeCoupon = async (req,res) => {
    try {
        const userId = req.session.user
        const cart = await Cart.findOne({userId})

        if (!cart) {
            return res.json({success:false, message:"Cart Not Found"})
        }

        cart.discount = 0
        cart.couponApplied = null
        await cart.save()

        return res.json({success:true, message:"Coupon Removed successfully"})
    } catch (error) {
        return res.status(500).json({success: false, error:"Error in removing coupon"})
    }
}

module.exports = {
    getCouponPage,
    addCoupon,
    removeCoupon
}