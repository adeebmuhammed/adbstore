const Coupon = require("../../models/couponSchema")

const getCouponPage = async (req,res) => {
    try {
        const coupons = await Coupon.find({isListed:true})

        res.render("coupon",{coupons})
    } catch (error) {
        console.error(error)
        res.redirect("/pageNotFound")
    }
}

module.exports = {
    getCouponPage
}