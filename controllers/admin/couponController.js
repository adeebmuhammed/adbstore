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
        console.error(error)
    }
}

const addCoupon = async (req, res) => {
    try {
        // Destructure the form data directly from req.body
        const { name, expireOn, offerPrice, minimumPrice, code } = req.body;

        const existingCoupon = await Coupon.findOne({name})

        if (existingCoupon) {
            return res.status(400).json({success:false, error:"Coupon with this name alreday exists"})
        }

        const existingCouponCode = await Coupon.findOne({code})

        if (existingCouponCode) {
            return res.status(400).json({success:false, error:"Coupon with this code alreday exists"})
        }
        
        // Create a new coupon object
        const newCoupon = new Coupon({
            name,
            expireOn,
            offerPrice,
            minimumPrice,
            code,
            isListed: true,
            createdOn: Date.now()
        });

        // If an image was uploaded, add its path to the coupon object
        if (req.file) {
            newCoupon.image = req.file.filename; // Store the image path in the coupon object
        }

        // Save the coupon to the database
        await newCoupon.save();
        res.status(201).json({ message: 'Coupon added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const deleteCoupon = async (req,res) => {
    try {
        const {id} = req.body

        await Coupon.findByIdAndDelete(id)

        return res.status(201).json({success:true, message:"coupon deleted successfully"})
    } catch (error) {
        console.error(error);
        return res.status(500).json({error:"Internal Server Error"})
    }
}

module.exports = {
    getCouponPage,
    addCoupon,
    deleteCoupon
}