const User = require("../../models/userSchema")

const getProfilePage = async (req,res) => {
    try {
        const userData = await User.findById(req.session.user)
        if(userData){
            res.render("profile",{
                user:userData
            })
        }else{
            res.redirect("/pageNotFound")
        }
    } catch (error) {
        console.error(error)
        res.redirect("/pageNotFound")
    }
}

const updateProfile = async (req,res) => {
    try {
        const {userId,name,phone} = req.body
        const user = await User.findOne({name:name})
        
        if (user) {
            return res.status(400).json({error:"User with this name already exists, please choose another name"})
        }

        const updateUser = await User.findByIdAndUpdate(userId,{
            name:name,
            phone:phone
        },{new:true})

        if (updateUser) {
            return res.json({message:"Profile Edited Successfully"})
        }else{
            return res.status(400).json({error:"Error In Editing Profile"})
        }
    } catch (error) {
        console.error(error)
        res.redirect("/pageNotFound")
    }
}

module.exports = {
    getProfilePage,
    updateProfile
}