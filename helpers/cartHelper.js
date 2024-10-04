const Product = require("../models/productSchema");

const getProductPrice = async (productId) => {
    const product = await Product.findById(productId);
    
    if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
    }

    return product.salePrice ? product.salePrice : product.regularPrice;
};

const getAvailableStock = async (productId) => {
    try {
        // Find the product by its ID
        const product = await Product.findById(productId);
        
        // Check if product exists
        if (!product) {
            throw new Error("Product not found");
        }

        // Return the quantity of the product
        return product.quantity;
    } catch (error) {
        console.error("Error fetching available stock:", error.message);
        throw error; // Rethrow the error to be handled by the calling function
    }
};

module.exports = {
    getProductPrice,
    getAvailableStock
};
