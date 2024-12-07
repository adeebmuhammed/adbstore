const User = require("../../models/userSchema")
const Product = require("../../models/productSchema")
const Cart = require("../../models/cartSchema")

const getCartPage = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        let cartItemCount = 0;

        if (cart && cart.items.length > 0) {
            cartItemCount = cart.items.length;
            cart.items.forEach(item => {
                item.totalPrice = item.quantity * item.salePrice;
            });
        }

        res.render("cart", {
            cart: cart || null,
            user: userData,
            cartItemCount,
        });
    } catch (error) {
        res.redirect("/pageNotFound");
    }
};


const addToCart = async (req, res) => {
    try {
        const MAX_QUANTITY_PER_PRODUCT = 5; 
        const { productId, quantity, size } = req.body; 
        const userId = req.session.user; 


        if (!quantity || quantity < 1) {
            return res.status(400).json({ success: false, message: "Please provide a valid quantity." });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        const sizeInfo = product.sizes.find(s => s.size === size);
        if (!sizeInfo) {
            return res.status(400).json({ success: false, message: "Invalid size selected." });
        }

        const availableStock = sizeInfo.quantity; 
        if (quantity > availableStock) {
            return res.status(400).json({ success: false, message: `Only ${availableStock} units available for size ${size}.` });
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({
                userId,
                items: [{
                    productId,
                    quantity,
                    size,
                    price: product.salePrice || 0,
                    totalPrice: (product.salePrice || 0) * quantity,
                }]
            });
        } else {
            const productIndex = cart.items.findIndex(item => item.productId.toString() === productId && item.size === size);

            if (productIndex > -1) {
                let productItem = cart.items[productIndex];
                const newQuantity = productItem.quantity + quantity;

                if (newQuantity <= MAX_QUANTITY_PER_PRODUCT) {
                    if (newQuantity <= availableStock) {
                        productItem.quantity = newQuantity;
                        productItem.totalPrice = newQuantity * (product.salePrice || 0);
                    } else {
                        return res.status(400).json({ success: false, message: `Only ${availableStock} units available for size ${size}.` });
                    }
                } else {
                    return res.status(400).json({ success: false, message: `You can only add a maximum of ${MAX_QUANTITY_PER_PRODUCT} units of this product per size.` });
                }
            } else {
                cart.items.push({
                    productId,
                    quantity,
                    size,
                    price: product.salePrice || 0,
                    totalPrice: (product.salePrice || 0) * quantity,
                });
            }
        }

        await cart.save();
        res.status(200).json({ success: true, message: "Product added to cart successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, error: "Internal server error." });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user; 


        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found." });
        }

        const productIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (productIndex === -1) {
            return res.status(404).json({ success: false, message: "Product not found in cart." });
        }

        cart.items.splice(productIndex, 1);

        await cart.save();
        res.status(200).json({ success: true, message: "Product removed from cart successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, error: "Internal server error." });
    }
};

const updateCart = async (req, res) => {
    const { itemId, quantity, size } = req.body; 

    try {
        if (!size) {
            return res.status(400).json({ success: false, message: 'Size is required.' });
        }

        const product = await Product.findById(itemId);

        const normalizedSize = size.trim().toLowerCase();
        const sizeInfo = product.sizes.find(s => s.size.trim().toLowerCase() === normalizedSize);

        if (!sizeInfo) { 
            return res.status(400).json({ success: false, message: 'Invalid size selected.' });
        }

        const availableStock = sizeInfo.quantity; 
        if (quantity > availableStock) {
            return res.status(400).json({ success: false, message: `Only ${availableStock} units available for size ${size}.` });
        }

        await Cart.updateOne(
            { 'items.productId': itemId, 'items.size': size }, 
            { $set: { 'items.$.quantity': quantity, 'items.$.totalPrice': quantity * (product.salePrice || 0) } } 
        );

        res.json({ success: true, message: 'Quantity updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating quantity' });
    }
};

module.exports = {
    getCartPage,
    addToCart,
    removeFromCart,
    updateCart
}