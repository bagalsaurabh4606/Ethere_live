const razorpay = require("../../config/razorpay");
const userModel = require("../../models/userModels");
const orderModel = require("../../models/orderModel");

const paymentController = async (request, response) => {
  try {
    const bagItems = request.body;
    const curruentUser=request.userId;
    // console.log("bagItems",bagItems)
    const user = await userModel.findOne({ _id: request.userId });
    let amount = 0;
    bagItems.forEach((item) => {
      const discount = item.discountPercentage || 0;
      const discountedPrice = item.originalPrice * (1 - discount / 100);
      amount += discountedPrice * item.quantity;
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // amount in paise
      currency: "INR",
      receipt: `receipt_order_${new Date().getTime()}`,
      notes: {
        email: user.email,
      },
    });

    // Save order details in the database
    await orderModel.create({
      userId: curruentUser,
      email: user.email,
      products: bagItems,
      totalAmount: amount,
      orderId: order.id,
      paymentStatus: "Pending",
      orderPacked:false,
    });

    console.log("order detalis sending in backend",order.id)

    response.status(200).json({ orderId: order.id });
  } catch (err) {
    response.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
};

module.exports = paymentController;
