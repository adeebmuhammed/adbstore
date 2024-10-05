const User = require("../../models/userSchema")
const Product = require("../../models/productSchema")
const Cart = require("../../models/cartSchema")

const getCartPage = async (req, res) => {
    try {
        const userId = req.session.user
        const userData = await User.findById(userId)

        // Assuming req.user contains the logged-in user's information
        const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');

        if (!cart || cart.items.length === 0) {
            // If cart is empty, pass a message to the template
            return res.render("cart", { cart: null, message: "Your cart is empty. Add something to the cart!" });
        }

        // Calculate the total price for each item (in case you need this calculation dynamically)
        cart.items.forEach(item => {
            item.totalPrice = item.quantity * item.salePrice;
        });

        // Pass cart details to the template
        res.render("cart", { cart,user:userData});
    } catch (error) {
        console.error(error);
        res.redirect("/pageNotFound");
    }
};

const addToCart = async (req, res) => {
    try {
        const MAX_QUANTITY_PER_PRODUCT = 5; 
        const { productId, quantity ,size } = req.body; 
        const userId = req.user._id; 

        console.log("Received request to add to cart:", { productId, quantity, size, userId });

        // Validate quantity
        if (!quantity || quantity < 1) {
            console.log("Invalid quantity:", quantity);
            return res.status(400).json({ success: false, message: "Please provide a valid quantity." });
        }

        // Find the product
        const product = await Product.findById(productId);
        if (!product) {
            console.log("Product not found for ID:", productId);
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        const availableStock = product.quantity;
        if (quantity > availableStock) {
            console.log(`Requested quantity ${quantity} exceeds available stock ${availableStock}`);
            return res.status(400).json({ success: false, message: `Only ${availableStock} units available.` });
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
            const productIndex = cart.items.findIndex(item => item.productId.toString() === productId);
            if (productIndex > -1) {
                let productItem = cart.items[productIndex];
                if (productItem.quantity + quantity <= MAX_QUANTITY_PER_PRODUCT) {
                    productItem.quantity += quantity;
                    productItem.totalPrice = productItem.quantity * (product.salePrice || 0);
                } else {
                    return res.status(400).json({ success: false, message: `You can only add a maximum of ${MAX_QUANTITY_PER_PRODUCT} units of this product.` });
                }
                if(!productItem.quantity + quantity <= availableStock){
                    return res.status(400).json({ success: false, message: `Product is only ${availableStock} units available` });   
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
        console.log("Cart saved successfully");
        res.status(200).json({ success: true, message: "Product added to cart successfully!" });
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ success: false, error: "Internal server error." });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.body; // Get productId from request body
        const userId = req.user._id; // Assuming user is authenticated and userId is available

        console.log("Received request to remove from cart:", { productId, userId });

        // Find the user's cart
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found." });
        }

        // Find the index of the item to remove
        const productIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (productIndex === -1) {
            return res.status(404).json({ success: false, message: "Product not found in cart." });
        }

        // Remove the item from the cart
        cart.items.splice(productIndex, 1);

        // Save the updated cart
        await cart.save();
        console.log("Product removed from cart successfully.");
        res.status(200).json({ success: true, message: "Product removed from cart successfully!" });
    } catch (error) {
        console.error("Error removing from cart:", error);
        res.status(500).json({ success: false, error: "Internal server error." });
    }
};

const updateCart = async (req, res) => {
    const { itemId, quantity } = req.body;

    try {
        // Find the product by its ID to check stock availability
        const product = await Product.findById(itemId);

        const availableStock = product.quantity;
        if (quantity > availableStock) {
            return res.status(400).json({ success: false, message: `Only ${availableStock} units available.` });
        }

        // Find the cart and update the quantity for the matching productId
        await Cart.updateOne(
            { 'items.productId': itemId }, // Match the item by its productId
            { $set: { 'items.$.quantity': quantity } } // Dynamically update the quantity
        );

        res.json({ success: true, message: 'Quantity updated successfully' });
    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).json({ success: false, message: 'Error updating quantity' });
    }
};

module.exports = {
    getCartPage,
    addToCart,
    removeFromCart,
    updateCart
}