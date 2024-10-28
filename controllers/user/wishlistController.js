const Wishlist = require("../../models/wishlistSchema");
const User = require("../../models/userSchema")
const Product = require("../../models/productSchema")

const addToWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const {productId} = req.body;

        let wishlist = await Wishlist.findOne({ userId });

        if (wishlist) {
            const productExists = wishlist.product.some(item => item.productId.toString() === productId);

            if (!productExists) {
                wishlist.product.push({ productId });
                await wishlist.save();
                return res.status(200).json({success:true, message: "Product added to wishlist" });
            } else {
                return res.status(400).json({success:false, message: "Product is already in wishlist" });
            }
        } else {
            wishlist = new Wishlist({
                userId,
                product: [{ productId }]
            });
            await wishlist.save();
            return res.status(201).json({success:true, message: "Wishlist created and product added" });
        }
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        res.status(500).json({success:false, message: "Server error" });
    }
};

const getWishlistPage = async (req, res) => {
    try {
        const userId = req.session.user;

        const wishlist = await Wishlist.findOne({ userId }).populate('product.productId');

        const wishlistItems = wishlist ? wishlist.product.map(item => ({
            productId: item.productId._id,
            productName: item.productId.productName,
            description: item.productId.description,
            brand: item.productId.brand,
            salePrice: item.productId.salePrice,
            productImage: item.productId.productImage[0],
            addedOn: item.addedOn,
        })) : [];

        res.render('wishlist', { wishlistItems });
    } catch (error) {
        console.error('Error retrieving wishlist:', error);
        res.status(500).send("An error occurred while loading the wishlist");
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        const productId = req.params.productId;

        const wishlist = await Wishlist.findOneAndUpdate(
            { userId },
            { $pull: { product: { productId } } },
            { new: true }
        );

        if (wishlist) {
            return res.status(200).json({ success: true, message: "Product removed from wishlist" });
        } else {
            return res.status(404).json({ success: false, message: "Wishlist not found" });
        }
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    addToWishlist,
    getWishlistPage,
    removeFromWishlist
}