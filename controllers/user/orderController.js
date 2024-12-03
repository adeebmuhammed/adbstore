const mongoose = require("mongoose")
const Order = require("../../models/orderSchema")
const User = require("../../models/userSchema")
const Product = require("../../models/productSchema")
const Address = require("../../models/addressSchema")
const Wallet = require("../../models/walletSchema")
const Cart = require("../../models/cartSchema")

const getMyOrders = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findOne({ _id: userId });

        const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).lean();

        if (orders.length < 1) {
            return res.render('my-orders', { orders: [], user, cartItemCount: 0 });
        }

        const userAddressData = await Address.findOne({ userId }).lean();

        const addressMap = userAddressData
            ? userAddressData.address.reduce((map, addr) => {
                  map[addr._id.toString()] = addr;
                  return map;
              }, {})
            : {};

        const enrichedOrders = await Promise.all(
            orders.map(async (order) => {
                order.addressDetails = addressMap[order.address?.toString()] || null;

                const enrichedItems = await Promise.all(
                    order.orderedItems.map(async (item) => {
                        const product = await Product.findById(item.productId).lean();
                        return { ...item, productDetails: product || null };
                    })
                );

                order.orderedItems = enrichedItems;
                return order;
            })
        );

        // Fetch cart item count
        const cart = await Cart.findOne({userId }).lean();
        const cartItemCount = cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;

        res.render('my-orders', { orders: enrichedOrders, user, cartItemCount });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send("An error occurred while fetching orders. Please try again later.");
    }
};


const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId).populate('orderedItems.product');  
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

const getOrderDetails = async (req,res) => {
    try {
        const {orderId} = req.params
        const order = await Order.findById(orderId)

        const userId = req.session.user;
        const user = await User.findOne({_id:userId})

        if (!order) {
            return res.redirect('/pageNotFound');
        }

        const addressDoc = await Address.findOne({userId:userId});
        console.log(addressDoc);
        

        if (!addressDoc) {
            return res.redirect('/pageNotFound');
        }

        const addressIdToCheck = order.address;
        const specificAddress = addressDoc.address.find(addr => addr._id.equals(addressIdToCheck));
        
        res.render('order-details', {
            order,
            orderedItems: order.orderedItems || [],
            totalPrice: order.totalprice,
            specificAddress,
            user
        });
    } catch (error) {
        console.error(error)
        res.redirect('/pageNotFound')
    }
}

const returnOrder = async (req,res) => {
    try {
        const {orderId} = req.params

        const order = await Order.findOne({orderId})
        if (!order) {
            return res.status(400).json({success:false,message:"Order Not Found"})
        }

        order.status = "Return Request"
        order.save()

        return res.status(200).json({success:true,message:"Return Requested Successfully"})
    } catch (error) {
        console.error("Error requesting return order:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = {
    getMyOrders,
    cancelOrder,
    getOrderDetails,
    returnOrder
}