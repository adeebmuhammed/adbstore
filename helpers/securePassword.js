const bcrypt = require("bcrypt")

const securePassword = async(password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10)

        return passwordHash
    } catch (error) {
        
    }
}

module.exports = {
    securePassword
};