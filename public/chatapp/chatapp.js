document.addEventListener('DOMContentLoaded', () => {
    const socket = io('http://localhost:3000');
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
    const fileInput = document.getElementById('fileInput');
    const uploadFileButton = document.getElementById('uploadFileButton');

    if (!fileInput || !uploadFileButton) {
        console.error('File input or upload button not found in the DOM');
        return;
    }

    let selectedGroupId = localStorage.getItem('selectedGroupId') || null;

    setupGroupActionButtons();
    loadGroups();
    if (selectedGroupId) {
        joinGroup(selectedGroupId);
    }

    sendMessageButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    createGroupButton.addEventListener('click', createGroup);

    uploadFileButton.addEventListener('click', uploadFile);

    socket.on('receiveMessage', message => {
        console.log('Received message:', message); // Log the entire message object
        if (message.groupId === selectedGroupId) {
            if (!message.user || !message.user.name) {
                console.error('Invalid message structure:', message);
            } else {
                displayMessages([message]);
            }
        }
    });
    

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
                joinGroup(selectedGroupId);
                showGroupActions(group.id);
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
                    document.getElementById('inviteUserId').dataset.groupId = groupId;
                    document.getElementById('promoteUserId').dataset.groupId = groupId;
                    document.getElementById('removeUserId').dataset.groupId = groupId;
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
        const userId = localStorage.getItem('userId');
        
        if (!token || !content || !selectedGroupId) return;
        
        const message = { groupId: selectedGroupId, userId, content };
        displayMessages([message]);
        messageInput.value = '';
        socket.emit('sendMessage', message);
        fetchMessages();
    }

    function joinGroup(groupId) {
        socket.emit('joinGroup', { groupId });
        fetchMessages();
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
            console.log('Displaying message:', message);
    
            const senderName = message.user && message.user.name ? message.user.name : 'Unknown';
            const messageContent = message.content;
    
            if (messageContent) {
                const messageElement = document.createElement('div');
                const displayedSenderName = message.userId === parseInt(currentUserId, 10) ? 'you' : senderName;
    
                messageElement.textContent = `${displayedSenderName}: ${messageContent}`;
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

        axios.post('http://localhost:3000/groups/create', { name: groupName }, { headers: { 'authorization': token } })
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
        const groupId = selectedGroupId;
        const userId = document.getElementById('inviteUserId').value;
        const token = getAuthToken();
        if (!token || !userId || !groupId) {
            console.error('Missing required fields: token, userId, or groupId');
            return;
        }

        axios.post('http://localhost:3000/groups/invite', { groupId, userId }, { headers: { 'authorization': token } })
            .then(response => {
                console.log('User invited:', response.data);
                document.getElementById('inviteUserId').value = '';
            })
            .catch(error => {
                console.error('Error inviting user:', error.response ? error.response.data : error.message);
            });
    }

    function promoteUser() {
        const groupId = selectedGroupId;
        const userId = document.getElementById('promoteUserId').value;
        const token = getAuthToken();

        if (!token || !userId || !groupId) {
            console.error('Missing required fields: token, userId, or groupId');
            return;
        }

        axios.post('http://localhost:3000/groups/promote', { groupId, userId }, { headers: { 'authorization': token } })
            .then(response => {
                console.log('User promoted:', response.data);
                document.getElementById('promoteUserId').value = '';
            })
            .catch(error => {
                console.error('Error promoting user:', error.response ? error.response.data : error.message);
            });
    }

    function removeUser() {
        const groupId = selectedGroupId;
        const userId = document.getElementById('removeUserId').value;
        const token = getAuthToken();

        if (!token || !userId || !groupId) {
            console.error('Missing required fields: token, userId, or groupId');
            return;
        }

        axios.post('http://localhost:3000/groups/remove', { groupId, userId }, { headers: { 'authorization': token } })
            .then(response => {
                console.log('User removed:', response.data);
                document.getElementById('removeUserId').value = '';
            })
            .catch(error => {
                console.error('Error removing user:', error.response ? error.response.data : error.message);
            });
    }

    function uploadFile() {
        if (!fileInput.files.length) {
            console.error('No file selected');
            return;
        }
        
        const file = fileInput.files[0];
        const token = getAuthToken();
        if (!token || !file || !selectedGroupId) return;
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('groupId', selectedGroupId);
        
        axios.post('http://localhost:3000/groups/upload', formData, {
            headers: {
                'authorization': token,
                'Content-Type': 'multipart/form-data'
            }
        })
        .then(response => {
            console.log('File uploaded:', response.data);
            fileInput.value = ''; 
        })
        .catch(error => console.error('Error uploading file:', error.response ? error.response.data : error.message));
    }    

    function saveMessagesToLocalStorage(messages) {
        const key = `messages_${selectedGroupId}`;
        localStorage.setItem(key, JSON.stringify(messages));
    }

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            fetchMessages();
        }
    });

    let messageFetchInterval = null;
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            fetchMessages();
            messageFetchInterval = setInterval(fetchMessages, 5000);
        } else {
            clearInterval(messageFetchInterval);
        }
    });

    messageFetchInterval = setInterval(() => {
        if (document.visibilityState === 'visible') {
            fetchMessages();
        }
    }, 5000);
});
