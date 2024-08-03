document.addEventListener('DOMContentLoaded', () => {
    const chatArea = document.querySelector('.chat-area');
    const messageInput = document.getElementById('message-input');
    const sendMessageButton = document.getElementById('send-button');
    const groupList = document.getElementById('groupList');
    const createGroupButton = document.getElementById('createGroupButton');
    const groupNameInput = document.getElementById('groupName');
    const groupActions = document.getElementById('groupActions');
    const inviteUserButton = document.getElementById('inviteButton'); 
    const makeAdminButton = document.getElementById('promoteButton'); 
    const removeUserButton = document.getElementById('removeButton');  

    let selectedGroupId = localStorage.getItem('selectedGroupId') || null;

    setupGroupActionButtons();
    loadGroups();
    if (selectedGroupId) {
        fetchMessages();
    }
    setInterval(() => {
        if (selectedGroupId) {
            fetchMessages();
        }
    }, 1000);

    sendMessageButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    createGroupButton.addEventListener('click', createGroup);

    function setupGroupActionButtons() {
        inviteUserButton.textContent = "Invite User";
        inviteUserButton.addEventListener('click', inviteUser);

        makeAdminButton.textContent = "Make Admin";
        makeAdminButton.addEventListener('click', promoteUser);

        removeUserButton.textContent = "Remove User";
        removeUserButton.addEventListener('click', removeUser);
    }

    function getAuthToken() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found in localStorage');
        }
        return token;
    }

    function loadGroups() {
        const token = getAuthToken();
        if (!token) return;

        axios.get('http://localhost:3000/groups', { headers: { 'authorization': token } })
            .then(response => {
                const groups = response.data;
                displayGroups(groups);
            })
            .catch(error => {
                console.error('Error fetching groups:', error);
            });
    }

    function displayGroups(groups) {
        groupList.innerHTML = '';
        groups.forEach(group => {
            const groupElement = document.createElement('div');
            groupElement.classList.add('group-container');

            const groupButton = document.createElement('button');
            groupButton.textContent = group.name;
            groupButton.dataset.groupId = group.id;
            groupButton.classList.add('group-item');

            groupButton.addEventListener('click', () => {
                selectedGroupId = group.id;
                localStorage.setItem('selectedGroupId', selectedGroupId);
                fetchMessages();
                showGroupActions(group.id, group.role);
            });

            groupElement.appendChild(groupButton);

            groupList.appendChild(groupElement);
        });
    }

    function showGroupActions(groupId) {
        const token = getAuthToken();
        if (!token || !selectedGroupId) return;
    
        axios.get(`http://localhost:3000/groups/${selectedGroupId}/role`, { headers: { 'authorization': token } })
            .then(response => {
                const role = response.data.role;
                if (role === 'admin') {
                    groupActions.style.display = 'block';
    
                    // Update IDs with groupId
                    document.getElementById('inviteUserId').id = `inviteUserId-${groupId}`;
                    document.getElementById('promoteUserId').id = `promoteUserId-${groupId}`;
                } else {
                    groupActions.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error fetching user role:', error);
                groupActions.style.display = 'none';
            });
    }    

    function hideGroupActions() {
        groupActions.style.display = 'none';
    }

    function sendMessage() {
        const content = messageInput.value;
        const token = getAuthToken();
        if (!token || !content || !selectedGroupId) return;

        axios.post(`http://localhost:3000/groups/${selectedGroupId}/messages`, { content }, { headers: { 'authorization': token } })
            .then(response => {
                messageInput.value = '';
                fetchMessages();
            })
            .catch(error => {
                console.error('Error sending message:', error);
            });
    }

    function fetchMessages() {
        const token = getAuthToken();
        if (!token || !selectedGroupId) return;
    
        axios.get(`http://localhost:3000/groups/${selectedGroupId}/messages`, { headers: { 'authorization': token } })
            .then(response => {
                const messages = response.data;
                displayMessages(messages);
                saveMessagesToLocalStorage(messages);
            })
            .catch(error => {
                if (error.response && error.response.status === 403) {
                    console.error('User is not a member of this group');
                    chatArea.innerHTML = '<p>You are not a member of this group.</p>';
                } else {
                    console.error('Error fetching messages:', error);
                }
            });
    }

    function displayMessages(messages) {
        chatArea.innerHTML = '';
        const currentUserId = localStorage.getItem('userId');

        messages.forEach(message => {
            if (message && message.user && message.user.name && message.content) {
                const messageElement = document.createElement('div');
                const senderName = message.userId === parseInt(currentUserId, 10) ? 'you' : message.user.name;
                const messageContent = message.content;
    
                messageElement.textContent = `${senderName}: ${messageContent}`;
                const messageClass = message.userId === parseInt(currentUserId, 10) ? 'you' : 'other';
                messageElement.classList.add('message', messageClass);
                chatArea.appendChild(messageElement);
            } else {
                console.error('Invalid message format:', message);
            }
        });
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    function createGroup() {
        const groupName = groupNameInput.value;
        const token = getAuthToken();
        if (!token || !groupName) return;

        axios.post('http://localhost:3000/groups', { name: groupName }, { headers: { 'authorization': token } })
            .then(response => {
                console.log('Group created:', response.data);
                loadGroups(); 
                groupNameInput.value = ''; 
            })
            .catch(error => {
                console.error('Error creating group:', error);
            });
    }

    function inviteUser() {
        const groupId = localStorage.getItem('selectedGroupId');
        const userId = document.getElementById(`inviteUserId-${groupId}`)?.value;
        const token = getAuthToken();
        if (!token || !userId) {
            console.error('Missing required fields: token or userId');
            return;
        }
    
        axios.post('http://localhost:3000/groups/invite', { groupId, userId }, { headers: { 'authorization': token } })
            .then(response => {
                console.log('User invited:', response.data);
                document.getElementById(`inviteUserId-${groupId}`).value = ''; 
            })
            .catch(error => {
                console.error('Error inviting user:', error.response ? error.response.data : error.message);
            });
    }
    
    function promoteUser() {
        const groupId = localStorage.getItem('selectedGroupId');
        const userId = document.getElementById(`promoteUserId-${groupId}`)?.value;
        const token = getAuthToken();
        if (!token || !userId) return;
    
        axios.post('http://localhost:3000/groups/promote', { groupId, userId }, { headers: { 'authorization': token } })
            .then(response => {
                console.log('User promoted:', response.data);
                document.getElementById(`promoteUserId-${groupId}`).value = ''; 
            })
            .catch(error => {
                console.error('Error promoting user:', error);
            });
    }
    
    function removeUser() {
        const groupId = localStorage.getItem('selectedGroupId');
        const userId = document.getElementById(`promoteUserId-${groupId}`)?.value;
        const token = getAuthToken();
        if (!token || !userId) return;
    
        axios.post('http://localhost:3000/groups/remove', { groupId, userId }, { headers: { 'authorization': token } })
            .then(response => {
                console.log('User removed:', response.data);
                document.getElementById(`promoteUserId-${groupId}`).value = ''; 
            })
            .catch(error => {
                console.error('Error removing user:', error);
            });
    }    

    function saveMessagesToLocalStorage(messages) {
        if (!Array.isArray(messages)) {
            console.error('Invalid messages data:', messages);
            return;
        }
        localStorage.setItem('messages', JSON.stringify(messages));
    }
});
