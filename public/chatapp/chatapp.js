const chatArea = document.querySelector('.chat-area');
const messageInput = document.getElementById('message-input');
const sendMessageButton = document.getElementById('send-button');
const groupList = document.getElementById('groupList');
const createGroupButton = document.getElementById('createGroupButton');
const groupNameInput = document.getElementById('groupName');

let lastMessageId = null;
let selectedGroupId = localStorage.getItem('selectedGroupId') || null;

document.addEventListener('DOMContentLoaded', () => {
    loadGroups();
    loadMessagesFromLocalStorage();
    if (selectedGroupId) {
        fetchMessages();
    }
    setInterval(() => {
        if (selectedGroupId) {
            fetchMessages();
        }
    }, 1000);
});

sendMessageButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

createGroupButton.addEventListener('click', createGroup);

function loadGroups() {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:3000/groups', { headers: { 'authorization': token } })
        .then(response => {
            const groups = response.data;
            displayGroups(groups);
        })
        .catch(error => {
            console.error('Error fetching groups:', error);
        });
};

function displayGroups(groups) {
    groupList.innerHTML = '';
    groups.forEach(group => {
        const groupElement = document.createElement('div');
        groupElement.textContent = group.name;
        groupElement.dataset.groupId = group.id;
        groupElement.classList.add('group-item');
        groupElement.addEventListener('click', () => {
            selectedGroupId = group.id;
            localStorage.setItem('selectedGroupId', selectedGroupId); 
            fetchMessages();
        });
        groupList.appendChild(groupElement);
    });
};

function createGroup() {
    const groupName = groupNameInput.value.trim();
    if (groupName) {
        const token = localStorage.getItem('token');
        axios.post('http://localhost:3000/groups/create', { name: groupName }, { headers: { 'authorization': token } })
            .then(response => {
                groupNameInput.value = '';
                loadGroups();
            })
            .catch(error => {
                console.error('Error creating group:', error);
            });
    }
};

function fetchMessages() {
    if (!selectedGroupId) return;
  
    const token = localStorage.getItem('token');
    axios.get(`http://localhost:3000/groups/${selectedGroupId}/messages`, { headers: { 'authorization': token }, params: { lastMessageId } })
        .then(response => {
            const newMessages = response.data;
            if (Array.isArray(newMessages) && newMessages.length > 0) {
                lastMessageId = newMessages[newMessages.length - 1].id;
                saveMessagesToLocalStorage(newMessages);
                appendMessages(newMessages);
            }
        })
        .catch(error => {
            console.error('Error fetching messages:', error);
        });
};  

function appendMessages(messages) {
    chatArea.innerHTML = ''; 

    messages.forEach(message => {
        if (message && message.user && message.user.name) {
            const existingMessages = Array.from(chatArea.getElementsByClassName('message'));
            const isDuplicate = existingMessages.some(existingMessage => 
                existingMessage.dataset.messageId === message.id.toString()
            );

            if (!isDuplicate) {
                const messageElement = document.createElement('div');
                messageElement.classList.add('message');
                messageElement.dataset.messageId = message.id; 
                messageElement.textContent = `${message.user.name}: ${message.content}`;
                chatArea.appendChild(messageElement);
            }
        } else if (message && message.userId) {
            const existingMessages = Array.from(chatArea.getElementsByClassName('message'));
            const isDuplicate = existingMessages.some(existingMessage => 
                existingMessage.dataset.messageId === message.id.toString()
            );

            if (!isDuplicate) {
                const messageElement = document.createElement('div');
                messageElement.classList.add('message');
                messageElement.dataset.messageId = message.id; 
                messageElement.textContent = `User ${message.userId}: ${message.content}`;
                chatArea.appendChild(messageElement);
            }
        } else {
            console.error('Message or user information is missing:', message);
        }
    });
    chatArea.scrollTop = chatArea.scrollHeight;
};


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
};

function sendMessage() {
    const messageText = messageInput.value.trim();
  
    if (messageText !== '' && selectedGroupId) {
        const token = localStorage.getItem('token');
        axios.post(`http://localhost:3000/groups/${selectedGroupId}/messages`, { content: messageText }, { headers: { 'authorization': token } })
            .then(response => {
                const newMessage = response.data;
                if (newMessage && newMessage.user && newMessage.user.name) { 
                    messageInput.value = '';
                    saveMessagesToLocalStorage([newMessage]);
                    appendMessages([newMessage]); 
                } else {
                    console.error('Invalid message format:', newMessage);
                }
            })
            .catch(error => {
                console.error('Error sending message:', error);
            });
    }
}; 

function loadMessagesFromLocalStorage() {
    let storedMessages = [];
    try {
        storedMessages = JSON.parse(localStorage.getItem('messages')) || [];
    } catch (e) {
        console.error('Failed to parse messages from localStorage:', e);
        localStorage.removeItem('messages');
    }
    
    if (storedMessages.length > 0) {
        lastMessageId = storedMessages[storedMessages.length - 1].id;
        chatArea.innerHTML = ''; 
        displayMessages(storedMessages);
    }
};

function saveMessagesToLocalStorage(newMessages) {
    let storedMessages = JSON.parse(localStorage.getItem('messages')) || [];
    
    const messageIds = new Set(storedMessages.map(m => m.id));
    const uniqueNewMessages = newMessages.filter(m => !messageIds.has(m.id));
    const updatedMessages = [...storedMessages, ...uniqueNewMessages].slice(-10);
    localStorage.setItem('messages', JSON.stringify(updatedMessages));
};
