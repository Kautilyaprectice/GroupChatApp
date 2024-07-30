const chatArea = document.getElementById('chat-area');
const messageInput = document.getElementById('message-input');
const sendMessageButton = document.getElementById('send-button');

fetchMessages();

sendMessageButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keyup', function(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
});

function fetchMessages() {
    const token = localStorage.getItem('token');
  axios.get('http://localhost:3000/user/messages', { headers: { 'authorization': token } }) 
    .then(response => {
      displayMessages(response.data);
    })
    .catch(error => {
      console.error('Error fetching messages:', error);
    });
}

function displayMessages(messages) {
  chatArea.innerHTML = '';
  messages.forEach(message => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', message.user === 'you' ? 'you' : 'other');
    messageElement.textContent = message.content;
    chatArea.appendChild(messageElement);
  });
  chatArea.scrollTop = chatArea.scrollHeight;
}

function sendMessage() {
  const messageText = messageInput.value;

  if (messageText.trim() !== '') {
    const token = localStorage.getItem('token');
    axios.post('http://localhost:3000/user/messages', { 
      content: messageText,
      user: 'you'
    }, { headers: { 'authorization': token } })
    .then(response => {
      messageInput.value = '';
      fetchMessages();
    })
    .catch(error => {
      console.error('Error sending message:', error);
    });
  }
}