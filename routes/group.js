const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group');
const userAuthentication = require('../middleware/authenticate');
const { use } = require('./user');

router.post('/groups/create', userAuthentication.authenticate, groupController.createGroup);
router.post('/groups/invite', userAuthentication.authenticate, groupController.inviteToGroup);
router.get('/groups', userAuthentication.authenticate, groupController.getUserGroups);
router.get('/groups/:groupId/messages', userAuthentication.authenticate, groupController.getMessagesForGroup);

module.exports = router;