const Order = require("../../models/orderSchema")
const Product = require("../../models/productSchema")
const Address = require("../../models/addressSchema")

const getOrderList = async (req,res) => {
    try {
        const orders = await Order.find().lean();

        for (const order of orders) {
            const userAddressData = await Address.findOne({ userId: order.user }).lean();

            const specificAddress = userAddressData.address.find(addr => addr._id.equals(order.address));
            order.addressDetails = specificAddress;

            for (const item of order.orderedItems) {
                const product = await Product.findById(item.product).lean();
                item.productDetails = product; 
            }
        }

        res.render('admin-orders', { orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send("Error fetching orders");
    }
}

const changeOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const newStatus = req.body.status;

        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status: newStatus }, { new: true });

        if (updatedOrder) {
            return res.json({ success: true, message: 'Order Status Changed successfully' });
        } else {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).send("Error updating order status");
    }
};

module.exports = {
    getOrderList,
    changeOrderStatus
}