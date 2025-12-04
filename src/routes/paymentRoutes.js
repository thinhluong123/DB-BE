const express = require('express');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

router.post('/create-payos-link', paymentController.createPayOSLink);
router.get('/:orderId/status', paymentController.getPaymentStatus);

module.exports = router;

