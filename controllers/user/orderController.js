const mongoose = require("mongoose")
const Order = require("../../models/orderSchema")
const Product = require("../../models/productSchema")
const Address = require("../../models/addressSchema")
const Wallet = require("../../models/walletSchema")

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

        const order = await Order.findById(orderId).populate('orderedItems.product'); // Populate product details
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status === 'Pending' || order.status === 'Placed') {
            for (const item of order.orderedItems) {
                const product = await Product.findById(item.product._id);

                if (product) {
                    const sizeInfo = product.sizes.find(s => s.size === item.size);

                    if (sizeInfo) {
                        sizeInfo.quantity += item.quantity;
                        await product.save();
                    }
                }
            }

  if (order.paymentMethod !== 'Cash on Delivery') {
      const userId = order.user;
      const refundAmount = order.finalAmount;

      let wallet = await Wallet.findOne({ user_id: userId });

      if (!wallet) {
        wallet = new Wallet({
          user_id: userId,
          balance: 0,
          transactions: []
        });
      }

      wallet.balance += refundAmount;

      wallet.transactions.push({
        amount: refundAmount,
        type: 'credit',
        date: new Date(),
        description: 'Refund for canceled order'
      });

      await wallet.save();

      console.log('Order cancellation processed successfully and wallet updated');
  } else {
    console.log('Order cancellation does not require refund to wallet as it was Cash on Delivery');
  }

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