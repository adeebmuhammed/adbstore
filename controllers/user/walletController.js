const Wallet = require("../../models/walletSchema")
const User = require("../../models/userSchema");
const Cart = require("../../models/cartSchema");

const getWalletPage = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findOne({ _id: userId });
        const wallet = await Wallet.findOne({ user_id: userId });

       
        if (!wallet) {
            const newWallet = await Wallet.create({
                user_id: userId,
                balance: 0, 
                transactions: [],
            });

            return res.render("wallet", {
                user: userData,
                wallet: newWallet,
            });
        }

        res.render("wallet", {
            user: userData,
            wallet,
        });
    } catch (error) {
        console.error(error);
        res.redirect("/pageNotFound");
    }
};

module.exports = {
    getWalletPage
}