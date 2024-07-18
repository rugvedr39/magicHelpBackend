const express = require('express');
const router = express.Router();
const { getTransactionsWithReceiverInfo,updateTransactionUtrAndDate,
    getTransactionsWithSenderInfo,getMatrixSummary,updateTransactionDone,getPaymentToPiadOrNot,getTransactionsPMF,payPMF } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
//for getting to pay details
router.get('/transactions/payer/:payerId',protect, getTransactionsWithReceiverInfo);
// for getting to get who will send me the payments
router.get('/transactions/sender/:payerId/:level',protect, getTransactionsWithSenderInfo);
// for updating transactionn to Pending
router.put('/transactions/:transactionId', updateTransactionUtrAndDate);
router.put('/transactions/done/:transactionId', updateTransactionDone);
// Pay PMF
router.put('/transactions/payPMF/:transactionId/:ePinId', payPMF);
// 
router.post('/transactions/wanttopay', getPaymentToPiadOrNot);
// get PMF transaction
router.get('/getTransactionsPMF/:payerId', getTransactionsPMF);

// getMatrixSummary
router.get('/getMatrixSummary/:userId', getMatrixSummary);



module.exports = router;
