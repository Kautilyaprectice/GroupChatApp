const express = require('express');
const router = express.Router();
const multer = require('multer');
const messageController = require('../controllers/message');
const userAuthentication = require('../middleware/authenticate');

const storage = multer.memoryStorage(); 
const upload = multer({ storage });

router.get('/groups/:groupId/messages', userAuthentication.authenticate, messageController.getAllMessages);
router.post('/groups/:groupId/messages', userAuthentication.authenticate, messageController.createMessage);
router.post('/groups/upload', userAuthentication.authenticate, upload.single('file'), messageController.upload);

module.exports = router;
