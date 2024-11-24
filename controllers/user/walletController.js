const Wallet = require("../../models/walletSchema")
const User = require("../../models/userSchema");
const Cart = require("../../models/cartSchema");

const getWalletPage = async (req,res) => {
    try {
        const userId = req.session.user
        const userData = await User.findOne({ _id: userId});
        const cart = await Cart.findOne({userId:userId})
        const wallet = await Wallet.findOne({user_id:userId})

        if (!wallet) {
            return res.json({success:false,error:"Wallet Not Found"})
        }

        const itemsCount = cart?.items?.length || 0;

        res.render("wallet",{
            user:userData,
            wallet,
            items:itemsCount
        })
    } catch (error) {
        res.redirect("/pageNotFound")
    }    
}

module.exports = {
    getWalletPage
}