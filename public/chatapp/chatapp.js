const chatArea = document.querySelector('.chat-area');
const messageInput = document.getElementById('message-input');
const sendMessageButton = document.getElementById('send-button');

let lastMessageId = null;

document.addEventListener('DOMContentLoaded', () => {
  loadMessagesFromLocalStorage();
  fetchMessages();
  setInterval(fetchMessages, 1000);
});

sendMessageButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keyup', function(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
});

function fetchMessages() {
  const token = localStorage.getItem('token');
  axios.get('http://localhost:3000/messages', { headers: { 'authorization': token } })
    .then(response => {
      const newMessages = response.data;
      if(newMessages.length > 0){
        lastMessageId = newMessages[newMessages.length - 1].id;
        saveMessagesToLocalStorage(newMessages);
        displayMessages(newMessages);
      }
    })
    .catch(error => {
      console.error('Error fetching messages:', error);
    });
};

function displayMessages(messages) {
  chatArea.innerHTML = '';
  const currentUserId = localStorage.getItem('userId');
  
  messages.forEach(message => {
    const messageElement = document.createElement('div');
    const senderName = message.user.id == currentUserId ? 'you' : message.user.name;
    const messageContent = message.content;
    
    messageElement.textContent = `${senderName}: ${messageContent}`;
    const messageClass = message.user.id == currentUserId ? 'you' : 'other';
    messageElement.classList.add('message', messageClass);
    chatArea.appendChild(messageElement);
  });
  chatArea.scrollTop = chatArea.scrollHeight;
}


function sendMessage() {
  const messageText = messageInput.value;

  if (messageText.trim() !== '') {
    const token = localStorage.getItem('token');
    axios.post('http://localhost:3000/messages', { content: messageText }, { headers: { 'authorization': token } })
      .then(response => {
        messageInput.value = '';
        const newMessages = response.data;
        saveMessagesToLocalStorage([newMessages]);
        fetchMessages([newMessages]);
      })
      .catch(error => {
        console.error('Error sending message:', error);
      });
  }
};

function loadMessagesFromLocalStorage(){
  const storedMessages = JSON.parse(localStorage.getItem('message')) || [];
  if(storedMessages.length > 0){
    lastMessageId = storedMessages[storedMessages.length - 1].id;
    fetchMessages(storedMessages);
  }
};

function saveMessagesToLocalStorage(newMessages){
  const storedMessages = JSON.parse(localStorage.getItem('message')) || [];
  const updatedMessages = [...storedMessages, ...newMessages].slice(-10);
  localStorage.setItem('messages', JSON.stringify(updatedMessages));
}
