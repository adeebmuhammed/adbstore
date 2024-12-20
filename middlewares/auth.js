const User = require("../models/userSchema")

const userAuth = (req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then(data=>{
            if(data && !data.isBlocked){
                next()
            }else{
                res.redirect("/login")
            }
        }).catch(error=>{
            res.status(500).send("Internal server error")
        })
    }else{
        res.redirect("/login")
    }
}

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