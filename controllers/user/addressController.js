const User = require("../../models/userSchema")
const Address = require("../../models/addressSchema")

const getManageAddresses = async (req, res) => {
    try {
        const userId = req.session.user;
        const addressDoc = await Address.findOne({ userId }); 
        const userData = await User.findById(userId);

        if (!addressDoc || addressDoc.address.length === 0) {
            return res.render("manage-addresses", {
                message: "No addresses added. Add a new address to get started!",
                addresses: [],
                user: userData,
            });
        }

        res.render("manage-addresses", {
            addresses: addressDoc.address, 
            user: userData,
            message: null,
        });
    } catch (error) {
        res.redirect("/pageNotFound");
        console.error(error);
    }
};


const getAddAddress = async (req,res) => {
    try {
        const userData = await User.findById(req.session.user)
        res.render("add-address",{
            user:userData
        })
    } catch (error) {
        console.error(error)
        res.redirect("/pageNotFound")
    }
}

const addAddress = async (req, res) => {  
    try {
        const userId = req.session.user

        const {
            name,
            houseName,
            street,
            city,
            state,
            pincode,
            mobile, 
            altPhone, 
            addressType
        } = req.body;

        if (!name || !houseName || !street || !city || !state || !pincode || !mobile) {
            return res.status(400).json({ message: 'All required fields must be provided.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const newAddress = {
            name,
            houseName,
            street,
            city,
            state,
            pincode,
            phone: mobile,
            altPhone: altPhone || '',
            addressType: addressType || 'home'
        };

        const addressDoc = await Address.findOne({ userId });

        if (addressDoc) {
            await Address.updateOne(
                { userId },
                { $push: { address: newAddress } }
            );
        } else {
            await Address.create({
                userId: user._id,
                address: [newAddress]
            });
        }

        res.redirect("/manage-addresses")
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server error' });
    }
};

const getEditAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const userId = req.session.user;

        const userAddressData = await Address.findOne({ userId: userId });

        if (!userAddressData) {
            return res.status(404).json({ message: 'User addresses not found' });
        }

        const address = userAddressData.address.id(addressId); 

        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        res.render('edit-address', { address });
    } catch (error) {
        console.error('Error editing address:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const editAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const { name, houseName, street, city, state, pincode, phone, altPhone } = req.body;
        const userId = req.user._id; // Assuming you have the user's ID from authentication middleware

        // Find the user address document
        const userAddressData = await Address.findOne({ userId: userId });

        if (!userAddressData) {
            return res.status(404).json({ message: 'User addresses not found' });
        }

        // Find the specific address in the address array
        const address = userAddressData.address.id(addressId);

        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // Update the address fields with the new values from the form
        address.name = name;
        address.houseName = houseName;
        address.street = street;
        address.city = city;
        address.state = state;
        address.pincode = pincode;
        address.phone = phone;
        address.altPhone = altPhone;

        // Save the updated document
        await userAddressData.save();

        res.redirect('/manage-addresses'); // Redirect to the manage addresses page after editing
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const userId = req.session.user._id;  // Assuming you store the user ID in the session
        const { addressId } = req.params;     // Get the addressId from the route parameters

        // Find the address document by user ID
        const addressDoc = await Address.findOne({ userId });

        if (!addressDoc) {
            return res.status(404).json({ message: 'Address document not found for the user.' });
        }

        // Filter out the address with the matching ID
        const updatedAddresses = addressDoc.address.filter(addr => addr._id.toString() !== addressId);

        // If the address was not found, return an error
        if (updatedAddresses.length === addressDoc.address.length) {
            return res.status(404).json({ message: 'Address not found.' });
        }

        // Update the document with the remaining addresses
        addressDoc.address = updatedAddresses;

        // Save the updated document
        await addressDoc.save();

        res.status(200).json({ message: 'Address deleted successfully.' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    getManageAddresses,
    getAddAddress,
    addAddress,
    getEditAddress,
    editAddress,
    deleteAddress
}