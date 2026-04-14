const User = require("../models/userSchema")

const userAuth = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Please login first"
            });
        }

        const user = await User.findById(req.session.user);

        if (user && !user.isBlocked) {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: "User blocked or not found"
            });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

const adminAuth = (req,res,next)=>{
    User.findOne({isAdmin:true})
    .then(data=>{
        if(data && req.session.admin){
            next()
        }else{
            res.redirect("/admin/login")
        }
    }).catch(error=>{
        res.status(500).send("Internal server error")
    })
}

module.exports = {
    userAuth,
    adminAuth,
}