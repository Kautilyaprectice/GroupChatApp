const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group');
const userAuthentication = require('../middleware/authenticate');

router.post('/groups/create', userAuthentication.authenticate, groupController.createGroup);
router.post('/groups/invite', userAuthentication.authenticate, groupController.inviteToGroup);
router.post('/groups/promote', userAuthentication.authenticate, groupController.promoteToAdmin);
router.post('/groups/remove', userAuthentication.authenticate, groupController.removeUserFromGroup);
router.get('/groups', userAuthentication.authenticate, groupController.getUserGroups);
router.get('/groups/:groupId/messages', userAuthentication.authenticate, groupController.getMessagesForGroup);
router.get('/groups/:groupId/role', userAuthentication.authenticate, groupController.getUserRole);

module.exports = router;
