const Product = require("../../models/productSchema")
const Category = require("../../models/categorySchema")
const Brand = require("../../models/brandSchema")
const User = require("../../models/userSchema")
const fs = require("fs")
const path = require("path")
const sharp = require("sharp")
const { error } = require("console")

const getProductAddPage = async (req,res) => {
    try {
        const category = await Category.find({isListed:true})
        const brand = await Brand.find({isBlocked:false})
        res.render("product-add",{
            cat:category,
            brand:brand,
        })
    } catch (error) {
        res.redirect("/pageerror")
    }
}

const addProducts = async (req,res) => {
    try {
        const products = req.body
        const productExists = await Product.findOne({
            productName: { $regex: new RegExp(`^${products.productName}$`, 'i') }
        });        

        if(!productExists){
            const images = []

            if(req.files && req.files.length>0){
                for(let i=0;i<req.files.length;i++){
                    const originalImagePath = req.files[i].path

                    const resizedImagePath = path.join('public','uploads','product-images',req.files[i].filename)
                    await sharp(originalImagePath).resize({width:440,height:440}).toFile(resizedImagePath)
                    images.push(req.files[i].filename)
                }
            }

            const categoryId = await Category.findById(products.category)

            if(!categoryId){
                return res.status(400).json({error:"Invalid Category Name"})
            }

            let sizes = [];
            if (products.sizes && Array.isArray(products.sizes)) {
                sizes = products.sizes.map((size, index) => ({
                    size: size, // Size value from form (e.g., '6', '7', etc.)
                    quantity: products[`quantity${size}`] || 0 // Quantity corresponding to that size
                }));
            }

            // Create a new product
            const newProduct = new Product({
                productName: products.productName,
                description: products.description,
                brand: products.brand,
                category: categoryId._id,
                regularPrice: products.regularPrice,
                salePrice: products.salePrice,
                createdOn: new Date(),
                sizes: sizes, // Add sizes with quantity
                color: products.color,
                productImage: images,
                status: 'Available'
            });

            await newProduct.save()
            return res.redirect("/admin/addProducts")
        }else{
            return res.status(400).json({error:"Product already exists, please try with another name"})
        }

    } catch (error) {
        console.error("Error adding product",error)
        res.redirect("/pageerror")
    }
}

const getAllProducts = async (req,res) => {
    try {
        const search = req.query.search || ""
        const page = req.query.page || 1
        const limit = 4

        const productData = await Product.find({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
                { brand: { $regex: new RegExp(".*" + search + ".*", "i") } }
            ]
        })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('category')  // Populate category
        .exec();        

        const count = await Product.find({
            $or:[
                {productName:{$regex: new RegExp(".*"+search+".*","i")}},
                {brand:{$regex: new RegExp(".*"+search+".*","i")}}
            ]
        }).countDocuments()

        const category = await Category.find({isListed:true})
        const brand = await Brand.find({isBlocked:false})

        if (category && brand) {
            res.render("products",{
                data:productData,
                currentPage:page,
                totalPages:Math.ceil(count/limit),
                cat:category,
                brand:brand
            })
        }else{
            res.render("pageerror")
        }
    } catch (error) {
        res.redirect("/admin/pageerror")
        console.error("Error getting all products")
    }
}

const addProductOffer = async (req,res) => {
    try {
        const {productId,percentage} = req.body
        const findProduct = await Product.findOne({_id:productId})
        const findCategory = await Category.findOne({_id:findProduct.category})

        if(findCategory.categoryOffer > percentage){
            return res.json({status:false,message:"This products category already has a category offer"})
        }

        findProduct.salePrice = findProduct.salePrice - Math.floor(findProduct.regularPrice*(percentage/100))
        findProduct.productOffer = parseInt(percentage)
        await findProduct.save()
        findCategory.categoryOffer = 0
        await findCategory.save()

        res.json({status:true})
    } catch (error) {
        res.redirect("/admin/pageerror")
        res.status(500).json({status:false,message:"Internal server error"})
    }
}

const removeProductOffer = async (req,res) => {
    try {
        const {productId} = req.body
        const findProduct = await Product.findOne({_id:productId})
        const percentage = findProduct.productOffer
        findProduct.salePrice = findProduct.salePrice + Math.floor(findProduct.regularPrice*(percentage/100))
        findProduct.productOffer = 0
        await findProduct.save()

        res.json({status:true})
    } catch (error) {
        res.redirect("/admin/pageerror")
    }
}

const blockProduct = async (req,res) => {
    try {
        const id = req.query.id
        await Product.updateOne({_id:id},{$set:{isBlocked:true}})
        res.redirect("/admin/products")
    } catch (error) {
        res.redirect("/admin/pageerror")
    }
}

const unblockProduct = async (req,res) => {
    try {
        const id = req.query.id
        await Product.updateOne({_id:id},{$set:{isBlocked:false}})
        res.redirect("/admin/products")
    } catch (error) {
        res.redirect("/admin/pageerror")
    }
}

const getEditProduct = async (req,res) => {
    try {
        const id = req.query.id
        const product = await Product.findOne({_id:id})
        const category = await Category.find({})
        const brand = await Brand.find({})

        res.render("edit-product",{
            product:product,
            cat:category,
            brand:brand
        })
    } catch (error) {
        res.redirect("/admin/pageerror")
    }
}

const editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;

        // Check if the product name already exists except the current product
        const existingProduct = await Product.findOne({
            productName: data.productName,
            _id: { $ne: id }
        });

        if (existingProduct) {
            return res.status(400).json({ error: "Product with this name already exists, please try with another name" });
        }

        const images = [];

        // Check if new images are uploaded
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                images.push(req.files[i].filename);
            }
        }

        // Process sizes and corresponding quantities
        let sizes = [];
        if (data.sizes && Array.isArray(data.sizes)) {
            sizes = data.sizes.map((size) => ({
                size: size, // Get the size value
                quantity: data[`quantity${size}`] || 0 // Get the corresponding quantity from the form
            }));
        }

        // Prepare the fields to update
        const updateFields = {
            productName: data.productName,
            description: data.description,
            brand: data.brand,
            category: data.category, // Assuming category is also in form submission
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            sizes: sizes, // Updated sizes array with quantity
            color: data.color
        };

        // Only add new images if they exist
        if (images.length > 0) {
            updateFields.productImage = [...product.productImage, ...images]; // Merge old images with new ones
        }

        // Update the product
        const updatedProduct = await Product.findByIdAndUpdate(id, updateFields, { new: true });

        if (updatedProduct) {
            console.log("Product updated successfully");
            return res.redirect("/admin/products");
        } else {
            return res.status(404).json({ error: "Product not found" });
        }
    } catch (error) {
        console.error("Error updating product", error);
        res.redirect("/admin/pageerror");
    }
};

const deleteSingleImage= async(req,res)=>{
    try {
        const {imageNameToServer,productIdToServer}=req.body;
        const product = await Product.findByIdAndUpdate(productIdToServer,{$pull:{productImage:imageNameToServer}});
        const imagePath=path.join("public","uploads","re-image",imageNameToServer);
        if(fs.existsSync(imagePath)){
            await fs.unlinkSync(imagePath);
            console.log(`Image ${imageNameToServer} deleted successfully`);
        }else{
            console.log(`Image ${imageNameToServer} not found`);
        }
        res.send({status:true});
    } catch (error) {
        res.redirect("pageerror");
    }
}

module.exports = {
    getProductAddPage,
    addProducts,
    getAllProducts,
    addProductOffer,
    removeProductOffer,
    blockProduct,
    unblockProduct,
    getEditProduct,
    editProduct,
    deleteSingleImage,
}