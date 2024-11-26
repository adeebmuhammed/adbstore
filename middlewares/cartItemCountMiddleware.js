const Cart = require("../models/cartSchema")

const cartItemCountMiddleware = async (req, res, next) => {
    if (req.session.user) { 
        try {
            const cart = await Cart.findOne({ userId: req.session.user }); 
            const cartItemCount = cart?.items?.length || 0;
            res.locals.cartItemCount = cartItemCount;
        } catch (error) {
            console.error('Error fetching cart item count:', error);
            res.locals.cartItemCount = 0;
        }
    } else {
        res.locals.cartItemCount = 0;
    }
    next();
};

module.exports = {
    cartItemCountMiddleware
}