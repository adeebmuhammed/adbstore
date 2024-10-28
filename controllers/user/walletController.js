const Wallet = require("../../models/walletSchema")
const User = require("../../models/userSchema")

const getWalletPage = async (req,res) => {
    try {
        const userId = req.session.user
        const userData = await User.findOne({ _id: userId});
        const wallet = await Wallet.findOne({user_id:userId})

        if (!wallet) {
            return res.json({success:false,error:"Wallet Not Found"})
        }

        res.render("wallet",{user:userData,wallet})
    } catch (error) {
        res.redirect("/pageNotFound")
    }    
}

module.exports = {
    getWalletPage
}