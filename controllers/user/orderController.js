const Order = require("../../models/orderSchema")
const Product = require("../../models/productSchema")
const Address = require("../../models/addressSchema")

const getMyOrders = async (req, res) => {
    try {
        const userId = req.user._id; // Assuming user authentication

        // Fetch orders for the user
        const orders = await Order.find({ user: userId }).lean(); // .lean() for plain objects

        // Loop through each order and fetch product and address data
        for (const order of orders) {
            // Fetch address manually
            const userAddressData = await Address.findOne({ userId: userId }).lean();

            // Find the specific address in the address array using the ObjectId
            const specificAddress = userAddressData.address.find(addr => addr._id.equals(order.address));
            order.addressDetails = specificAddress; // Assign the found address to order

            // Fetch product details for each ordered item
            for (const item of order.orderedItems) {
                const product = await Product.findById(item.product).lean();
                item.productDetails = product; // Add product details to each item
            }
        }

        // Pass orders with additional details to the template
        res.render('my-orders', { orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send("Error fetching orders");
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        // Find the order
        const order = await Order.findById(orderId).populate('orderedItems.product'); // Populate product details
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Only cancel if the order is still pending
        if (order.status === 'Pending') {
            // Update the product quantities for each ordered item
            for (const item of order.orderedItems) {
                const product = await Product.findById(item.product._id); // Find the product

                if (product) {
                    // Assuming sizes is an array of objects with size and quantity properties
                    const sizeInfo = product.sizes.find(s => s.size === item.size); // Adjust based on your schema

                    if (sizeInfo) {
                        sizeInfo.quantity += item.quantity; // Increase the quantity back
                        await product.save(); // Save the updated product
                    }
                }
            }

            // Update the order status to 'Canceled'
            order.status = 'Canceled';
            await order.save();
            return res.json({ success: true, message: 'Order canceled successfully' });
        } else {
            return res.json({ success: false, message: 'Order cannot be canceled' });
        }
    } catch (error) {
        console.error("Error canceling order:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getMyOrders,
    cancelOrder
}