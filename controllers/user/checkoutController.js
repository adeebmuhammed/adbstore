const Address = require("../../models/addressSchema")
const Cart = require("../../models/cartSchema")
const User = require("../../models/userSchema")
const Order = require("../../models/orderSchema")
const Product = require("../../models/productSchema")
const env = require('dotenv').config()
const Razorpay = require("razorpay")
const crypto = require('crypto')

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

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

    // Find the product and check stock for the specific size
    const product = await Product.findById(item.productId._id);
    const sizeInfo = product.sizes.find(s => s.size === item.size); // Find the matching size

    if (!sizeInfo) {
        return res.status(400).json({ success: false, message: `Size ${item.size} not found for product: ${product.productName}` });
    }

    // Check if there is enough stock for the selected size
    if (sizeInfo.quantity < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for size ${item.size} of product: ${product.productName}` });
    }

    // Reduce the quantity for the selected size
    sizeInfo.quantity -= item.quantity;

    // Save the updated product with the new size quantity
    await product.save();
}


        const discount = 0; // Assuming no discount logic is applied yet, or you can calculate it here

        // Create a new order
        const newOrder = new Order({
            orderedItems: cart.items.map(item => ({
                product: item.productId._id,
                size: item.size,
                quantity: item.quantity,
                price: item.productId.salePrice * item.quantity
            })),
            user:userId,
            totalprice: totalPrice,
            finalAmount: totalPrice - discount, // Calculate final amount after discount
            address: selectedAddress,
            invoiceDate: new Date(),
            status: 'Pending', // Initial status
            couponApplied: discount > 0, // Check if a coupon was applied
            paymentMethod:paymentMethod
        });

        // Save the order
        await newOrder.save();
        console.log("order saved successfully");

        // Clear the cart after placing the order
        cart.items = [];
        await cart.save();

        if (paymentMethod === 'Online Payment') {
            const options = {
                amount: totalPrice * 100,
                currency: "INR",
                receipt: `${newOrder.orderId}`,
                payment_capture: 1
            };
            
            const razorpayOrder = await razorpayInstance.orders.create(options);
            
            return res.json({
                success: true,
                orderId: razorpayOrder.id, // Razorpay order ID
                finalAmount: newOrder.finalAmount,
                razorpayKey: process.env.RAZORPAY_KEY_ID, // Send Razorpay API key to frontend
                message: newOrder.orderId
            });
        } else {
            // Handle Cash on Delivery or other payment methods
            return res.status(200).json({
                success: true,
                message: `${newOrder.orderId}` // Return the orderId for COD or Wallet
            });
        }                
            
        return res.status(200).json({success:true, message:`${newOrder.orderId}`})
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to place order' });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        // Step 1: Create the signature string using the razorpay_order_id and razorpay_payment_id
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        // Step 2: Compare the signatures to verify the payment
        if (generatedSignature === razorpay_signature) {
            // Payment is verified

            // Update order status to 'Paid' or 'Completed' in your database
            const order = await Order.findOneAndUpdate(
                { orderId: razorpay_order_id },
                { status: 'Paid' }, // Update status as per your needs
                { new: true }
            );

            if (!order) {
                return res.status(404).json({ success: false, message: "Order not found" });
            }

            return res.status(200).json({
                success: true,
                message: "Payment verified and order updated successfully",
                orderId: order.orderId
            });
        } else {
            // Invalid signature
            return res.status(400).json({ success: false, message: "Invalid payment signature" });
        }

    } catch (error) {
        console.error('Error verifying payment:', error);
        return res.status(500).json({ success: false, message: "Payment verification failed", error });
    }
};

const orderConfirmation = async (req,res) => {
    console.log("req recieved");
    
    try {
        const userId = req.session.user

        const orderId = String(req.params.orderId);
        console.log(orderId);
        
        const order = await Order.findOne({ orderId:orderId })
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
            orderedItems: order.orderedItems || [],
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
    verifyPayment,
    orderConfirmation
}