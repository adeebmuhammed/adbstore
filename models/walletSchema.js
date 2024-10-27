const mongoose = require("mongoose")
const {Schema} = mongoose

const walletSchema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  balance: {
    type: Number,
    default: 0
  },
  transactions: [
    {
      transaction_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      type: {
        type: String,
        required: true,
        enum: ['credit', 'debit']
      },
      date: {
        type: Date,
        default: Date.now
      },
      description: {
        type: String
      }
    }
  ]
});

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet