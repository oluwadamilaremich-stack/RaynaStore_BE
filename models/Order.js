const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    orderNumber: { type: String, required: true, unique: true },
    trackingNumber: { type: String, required: true, unique: true },
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
      },
    ],
    shippingDetails: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      zip: { type: String, required: true },
      landmarks: { type: String, default: '' },
    },
    deliveryNotes: { type: String, default: '' },
    assignedDriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    phoneNumber: { type: String, required: true },
    paymentStatus: {
      type: String,
      required: true,
      default: 'Pending',
    },
    paymentReference: {
      type: String,
      default: '',
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    status: {
      type: String,
      required: true,
      enum: ['ordered', 'processing', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
      default: 'ordered',
    },
    proofOfDelivery: {
      timestamp: { type: Date },
      details: { type: String },
      imageUrl: { type: String },
    },
    deliveryZone: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
