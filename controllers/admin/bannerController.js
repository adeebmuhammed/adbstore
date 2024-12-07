const Banner = require("../../models/bannerSchema")

const getBannerManagement = async (req,res) => {
    try {
        const banners = await Banner.find()

        res.render("banner", { data:banners })
    } catch (error) {
        res.redirect("/admin/pageerror")
    }
}

const getAddBannerPage = async (req,res) => {
    try {
        res.render("addBanner")
    } catch (error) {
        res.redirect("/admin/pageerror")
    }
}

const addBanner = async (req,res) => {
    try {
        const data = req.body
        const image = req.file
        const newBanner = new Banner ({
            image:image.filename,
            title:data.title,
            description:data.description,
            startDate:new Date(data.startDate),
            endtDate:new Date(data.endDate),
            link:data.link
        })

        await newBanner.save()
        res.redirect("/admin/banner")
    } catch (error) {
        res.redirect("/admin/pageerror")
    }
}

const deleteBanner = async (req,res) => {
    try {
        const id = req.query.id

        await Banner.deleteOne({_id:id})

        res.redirect("/admin/banner")
    } catch (error) {
        res.redirect("/admin/pageerror")
    }
}

module.exports = {
    getBannerManagement,
    getAddBannerPage,
    addBanner,
    deleteBanner
}