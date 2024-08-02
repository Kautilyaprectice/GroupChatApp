const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message');
const userAuthentication = require('../middleware/authenticate');

router.get('/groups/:groupId/messages', userAuthentication.authenticate, messageController.getAllMessages);
router.post('/groups/:groupId/messages', userAuthentication.authenticate, messageController.createMessage);


module.exports = router;
