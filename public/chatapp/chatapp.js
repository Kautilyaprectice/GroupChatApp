const chatArea = document.querySelector('.chat-area');
const messageInput = document.getElementById('message-input');
const sendMessageButton = document.getElementById('send-button');

fetchMessages();

setInterval(fetchMessages, 1000);

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
      displayMessages(response.data);
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
    const senderName = message.user.name;
    const messageContent = message.content;
    
    messageElement.textContent = `${senderName}: ${messageContent}`;
    messageElement.textContent = `${senderName}: ${messageContent}`;
    const messageClass = message.user.id == currentUserId ? 'you' : 'other';
    messageElement.classList.add('message', messageClass);
    chatArea.appendChild(messageElement);
  });
  chatArea.scrollTop = chatArea.scrollHeight;
};


function sendMessage() {
  const messageText = messageInput.value;

  if (messageText.trim() !== '') {
    const token = localStorage.getItem('token');
    axios.post('http://localhost:3000/messages', { content: messageText }, { headers: { 'authorization': token } })
      .then(response => {
        messageInput.value = '';
        fetchMessages();
      })
      .catch(error => {
        console.error('Error sending message:', error);
      });
  }
};
