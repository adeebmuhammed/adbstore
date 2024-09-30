const User = require("../../models/userSchema")
const Address = require("../../models/addressSchema")

const getManageAddresses = async (req, res) => {
    try {
        const user = req.session.user;
        const addressDoc = await Address.findOne({ userId: user._id }); // Find the address document for the user
        const userData = await User.findById(req.session.user);

        // If no addresses exist
        if (!addressDoc || addressDoc.address.length === 0) {
            return res.render("manage-addresses", {
                message: "No addresses added. Add a new address to get started!",
                addresses: [], // Empty array
                user: userData,
            });
        }

        // Render the addresses
        res.render("manage-addresses", {
            addresses: addressDoc.address, // Send the addresses array from the document
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
        // Destructure fields from the request body
        const {
            name,
            houseName,
            street,
            city,
            state,
            pincode,
            mobile, // Assuming 'mobile' is equivalent to 'phone' in the schema
            altPhone, // Optional field
            addressType // Optional field
        } = req.body;

        // Ensure all required fields are present
        if (!name || !houseName || !street || !city || !state || !pincode || !mobile) {
            return res.status(400).json({ message: 'All required fields must be provided.' });
        }

        // Find the user by ID stored in the session
        const user = await User.findById(req.session.user);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Create the new address object according to the schema
        const newAddress = {
            name,
            houseName,
            street,
            city,
            state,
            pincode,
            phone: mobile,
            altPhone: altPhone || '', // Optional, provide default if not provided
            addressType: addressType || 'home' // Default address type if not provided
        };

        // Check if the user already has an address document
        const addressDoc = await Address.findOne({ userId: user._id });

        if (addressDoc) {
            // If document exists, update (push) the new address to the address array
            await Address.updateOne(
                { userId: user._id },
                { $push: { address: newAddress } } // Push the new address into the array
            );
        } else {
            // If document does not exist, create it with the new address
            await Address.create({
                userId: user._id,
                address: [newAddress] // Initialize with the first address
            });
        }

        // Return success message
        res.status(201).json({ message: 'Address added successfully' }).redirect("/manage-addresses")
    } catch (error) {
        // Send detailed error response
        console.error(error);
        res.status(500).json({ message: 'Internal Server error' });
    }
};

const getEditAddress = async (req, res) => {
    try {
        const { addressId } = req.params;  // Address ID to edit
        const userId = req.user._id;  // Assuming you have the user's ID

        // Find the user document and address array by userId
        const userAddressData = await Address.findOne({ userId: userId });

        if (!userAddressData) {
            return res.status(404).json({ message: 'User addresses not found' });
        }

        // Find the specific address within the address array
        const address = userAddressData.address.id(addressId); // Find subdocument

        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // Render the edit-address page with the retrieved address details
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