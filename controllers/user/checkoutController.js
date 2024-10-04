const Address = require("../../models/addressSchema")
const Cart = require("../../models/cartSchema")
const User = require("../../models/userSchema")
const Order = require("../../models/orderSchema")
const Product = require("../../models/productSchema")

const getCheckoutPage = async (req, res) => {
    try {
        const userData = await User.findById(req.session.user)

        const userId = req.user._id;  // Assuming you have the user ID from the session or JWT

        // Fetch addresses from the database
        const addresses = await Address.findOne({ userId: userId });

        // Fetch cart items from the database
        const cart = await Cart.findOne({ userId: userId }).populate('items.productId');  // populate 'productId' to get product details
        
        // Prepare the items and total price to pass to the view
        const cartItems = cart ? cart.items : [];
        
        // Calculate total price from the cart items
        const totalPrice = cartItems.reduce((total, item) => total + item.totalPrice, 0);

        // Render the checkout page and pass addresses and cart details
        res.render("checkout", { addresses, cartItems, totalPrice,user:userData });
    } catch (error) {
        console.error(error);
        res.redirect("/pageNotFound");
    }
};

const placeOrder = async (req, res) => {
    console.log("req received");

    try {
        const { selectedAddress, paymentMethod } = req.body;
        const userId = req.user._id; // assuming you are storing userId in req.user

        // Fetch the cart for the user and populate the product details
        const cart = await Cart.findOne({ userId: userId }).populate('items.productId');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Your cart is empty' });
        }

        // Calculate total price from cart items
        let totalPrice = 0;
        for (const item of cart.items) {
            totalPrice += item.productId.salePrice * item.quantity;

            // Update product quantity after the order is placed
            const product = await Product.findById(item.productId._id);
            if (product.quantity < item.quantity) {
                return res.status(400).json({ success: false, message: 'Insufficient stock for product: ' + product.productName });
            }
            product.quantity -= item.quantity; // Decrease the product quantity
            await product.save(); // Save the updated product
        }

        const discount = 0; // Assuming no discount logic is applied yet, or you can calculate it here

        // Create a new order
        const newOrder = new Order({
            orderedItems: cart.items.map(item => ({
                product: item.productId._id,
                quantity: item.quantity,
                price: item.productId.salePrice * item.quantity
            })),
            user:userId,
            totalprice: totalPrice,
            finalAmount: totalPrice - discount, // Calculate final amount after discount
            address: selectedAddress,
            invoiceDate: new Date(),
            status: 'Pending', // Initial status
            couponApplied: discount > 0 // Check if a coupon was applied
        });

        // Save the order
        await newOrder.save();
        console.log("order saved successfully");

        // Clear the cart after placing the order
        cart.items = [];
        await cart.save();

        return res.redirect(`/order-confirmation/${newOrder.orderId}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to place order' });
    }
};

const orderConfirmation = async (req,res) => {
    console.log("req recieved");
    
    try {
        const userId = req.session.user

        const orderId = req.params.orderId;
        const order = await Order.findOne({ orderId }).populate('orderedItems.product'); // Ensure you're also populating product details
        console.log(order);
        

        if (!order) {
            return res.redirect('/pageNotFound');
        }

        const addressDoc = await Address.findOne({userId:userId});
        console.log(addressDoc);
        

        if (!addressDoc) {
            return res.redirect('/pageNotFound');
        }

        // Now find the specific address in the address array using the ObjectId
        const addressIdToCheck = order.address; // This is the ObjectId you're using to reference the Address document
        const specificAddress = addressDoc.address.find(addr => addr._id.equals(addressIdToCheck));
        
        res.render('order-confirmation', {
            order,
            totalPrice: order.totalprice,
            specificAddress
        });
    } catch (error) {
        console.error('Error fetching order or rendering:', error);
        res.redirect('/pageNotFound');
    }
};

module.exports = {
    getCheckoutPage,
    placeOrder,
    orderConfirmation
}