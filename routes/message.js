const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message');
const userAuthentication = require('../middleware/authenticate');

router.get('/messages', userAuthentication.authenticate, messageController.getAllMessages);
router.post('/messages', userAuthentication.authenticate, messageController.createMessage);

module.exports = router;
