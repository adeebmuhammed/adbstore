const Coupon = require("../../models/couponSchema")

const getCouponPage = async (req,res) => {
    try {
        const page = req.query.page || 1
        const limit = 4

        const coupons = await Coupon.find()
        .limit(limit * 1)
        .skip((page - 1) * limit)

        const count = coupons.length

        res.render("coupons", {
            coupons,
            currentPage:page,
            totalPages:Math.ceil(count/limit)
        })
    } catch (error) {
        res.redirect("/admin/pageerror")
    }
}

const addCoupon = async (req, res) => {
    try {
        const { name, expireOn, offerPrice, minimumPrice, code } = req.body;

        const existingCoupon = await Coupon.findOne({name})

        if (existingCoupon) {
            return res.status(400).json({success:false, error:"Coupon with this name alreday exists"})
        }

        const existingCouponCode = await Coupon.findOne({code})

        if (existingCouponCode) {
            return res.status(400).json({success:false, error:"Coupon with this code alreday exists"})
        }
        
        const newCoupon = new Coupon({
            name,
            expireOn,
            offerPrice,
            minimumPrice,
            code,
            isListed: true,
            createdOn: Date.now()
        });

        if (req.file) {
            newCoupon.image = req.file.filename; 
        }

        await newCoupon.save();
        res.status(201).json({ message: 'Coupon added successfully' });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const deleteCoupon = async (req,res) => {
    try {
        const {id} = req.body

        await Coupon.findByIdAndDelete(id)

        return res.status(201).json({success:true, message:"coupon deleted successfully"})
    } catch (error) {
        return res.status(500).json({error:"Internal Server Error"})
    }
}

module.exports = {
    getCouponPage,
    addCoupon,
    deleteCoupon
}