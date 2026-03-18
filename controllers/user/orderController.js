const mongoose = require("mongoose");
const Order = require("../../models/orderSchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Address = require("../../models/addressSchema");
const Wallet = require("../../models/walletSchema");
const Cart = require("../../models/cartSchema");

const getMyOrders = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId);

    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalOrders / limit); // <-- define it here

    let orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get user's address doc once
    const userAddressData = await Address.findOne({ userId }).lean();
    const addressMap = userAddressData
      ? userAddressData.address.reduce((map, addr) => {
          map[addr._id.toString()] = addr;
          return map;
        }, {})
      : {};

    // Enrich orders with full address object
    const enrichedOrders = orders.map(order => {
      if (order.address && typeof order.address === "object" && order.address.name) {
        order.addressDetails = order.address;
      } else if (order.address) {
        order.addressDetails = addressMap[order.address?.toString()] || null;
      } else {
        order.addressDetails = null;
      }
      return order;
    });

    // Cart info
    const cart = await Cart.findOne({ userId }).lean();
    const cartItemCount = cart
      ? cart.items.reduce((total, item) => total + item.quantity, 0)
      : 0;

    res.render("my-orders", {
      orders: enrichedOrders,
      user,
      cartItemCount,
      currentPage: page,
      totalPages, // <-- use it here
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error fetching orders");
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { cancelReason } = req.body;

    const order = await Order.findById(orderId).populate(
      "orderedItems.product",
    );
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.status === "Pending" || order.status === "Placed") {
      for (const item of order.orderedItems) {
        const product = await Product.findById(item.product._id);

        if (product) {
          const sizeInfo = product.sizes.find((s) => s.size === item.size);

          if (sizeInfo) {
            sizeInfo.quantity += item.quantity;
            await product.save();
          }
        }
      }

      if (order.paymentMethod !== "Cash on Delivery") {
        const userId = order.user;
        const refundAmount = order.finalAmount;

        let wallet = await Wallet.findOne({ user_id: userId });

        if (!wallet) {
          wallet = new Wallet({
            user_id: userId,
            balance: 0,
            transactions: [],
          });
        }

        wallet.balance += refundAmount;

        wallet.transactions.push({
          amount: refundAmount,
          type: "credit",
          date: new Date(),
          description: "Refund for canceled order",
        });

        await wallet.save();
      } else {
        return res.json({
          success: false,
          message:
            "Order cancellation does not require refund to wallet as it was Cash on Delivery",
        });
      }

      order.status = "Canceled";
      order.cancelReason = cancelReason;
      await order.save();
      return res.json({
        success: true,
        message: "Order canceled successfully",
      });
    } else {
      return res.json({ success: false, message: "Order cannot be canceled" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) return res.redirect("/pageNotFound");

    const userId = req.session.user;
    const user = await User.findById(userId);

    let specificAddress = null;

    // New orders: address is embedded object
    if (order.address && typeof order.address === "object" && order.address.name) {
      specificAddress = order.address;
    } 
    // Old orders: address is ObjectId, fetch from Address collection
    else if (order.address) {
      const addressDoc = await Address.findOne({ userId });
      if (addressDoc) {
        const addr = addressDoc.address.find(a => a._id.equals(order.address));
        if (addr) specificAddress = addr;
      }
    }

    res.render("order-details", {
      order,
      orderedItems: order.orderedItems || [],
      totalPrice: order.totalprice,
      specificAddress,
      user,
    });

  } catch (error) {
    console.error(error);
    res.redirect("/pageNotFound");
  }
};

const returnOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res
        .status(400)
        .json({ success: false, message: "Order Not Found" });
    }

    order.status = "Return Request";
    order.save();

    return res
      .status(200)
      .json({ success: true, message: "Return Requested Successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getMyOrders,
  cancelOrder,
  getOrderDetails,
  returnOrder,
};
