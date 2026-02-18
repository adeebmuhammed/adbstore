const Wallet = require("../../models/walletSchema")
const User = require("../../models/userSchema");
const Cart = require("../../models/cartSchema");

const getWalletPage = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await User.findById(userId);

    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    let wallet = await Wallet.findOne({ user_id: userId });

    if (!wallet) {
      wallet = await Wallet.create({
        user_id: userId,
        balance: 0,
        transactions: [],
      });
    }

    const totalTransactions = wallet.transactions.length;

    // Slice transactions for current page
    const paginatedTransactions = wallet.transactions
      .slice()
      .reverse() // latest first
      .slice(skip, skip + limit);

    const totalPages = Math.ceil(totalTransactions / limit);

    res.render("wallet", {
      user: userData,
      wallet,
      transactions: paginatedTransactions,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/pageNotFound");
  }
};


module.exports = {
    getWalletPage
}