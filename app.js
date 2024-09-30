const express = require('express');
const app = express();
const path = require('path')
const nocache = require('nocache');
const session = require('express-session')
const env = require("dotenv").config();
const passport = require("./config/passport")

const userRouter = require('./routes/userRouter')
const adminRouter = require('./routes/adminRouter')

const db = require("./config/db");
db()

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(nocache())

app.set("view engine","ejs")
app.set("views",[path.join(__dirname,'views/user'),path.join(__dirname,'views/admin')])
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure:false,
        httpOnly:true,
        maxAge:72*60*60*1000
    }
}))
app.use(express.static(path.join(__dirname,"public")))

app.use(passport.initialize())
app.use(passport.session())

app.use((req,res,next)=>{
    res.set('cache-control','no-store')
    next()
})

app.use("/",userRouter)
app.use("/admin",adminRouter)

app.listen(process.env.PORT,()=>{
    console.log("Server Running");
})

module.exports = app;