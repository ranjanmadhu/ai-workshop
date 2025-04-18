const featureMap = [
    { type: 'chat', func: chat, api: '', cssClass: 'chat', name: 'Chat' },
    { type: 'chat', func: streamingChat, api: '', cssClass: 'chat-streaming', name: 'Chat with Streaming' },
    { type: 'chat', func: chat, api: '', cssClass: 'chat-kb', name: 'Chat with Knowledge Base' },
    { type: 'chat', func: streamingChat, api: '', cssClass: 'chat-kb-streaming', name: 'Chat with Knowledge Base Streaming' },
    { type: 'agent', func: streamingChat, api: '', cssClass: 'agent-ka', name: 'Agent - Kitchen Assistant' },
    { type: 'agent', func: streamingChat, api: '', cssClass: 'agent-sac', name: 'Agent - Safe Agile Coach' },
    { type: 'agent', func: streamingChat, api: '', cssClass: 'agent-ia', name: 'Agent - Insight Architect' },
    { type: 'agent', func: streamingChat, api: '', cssClass: 'agent-ft', name: 'Agent - Function\Tools' }
];

(function init() {
    const chatBtns = document.getElementById('chat-btns');
    const agentBtns = document.getElementById('agent-btns');

    featureMap.forEach((feature) => {
        const btn = document.createElement('button');
        btn.className = `btn ${feature.cssClass}`;
        btn.textContent = feature.name;
        btn.onclick = () => sendMessage(feature);
        if (feature.type === 'chat') {
            chatBtns.appendChild(btn);
        } else {
            agentBtns.appendChild(btn);
        }
    });
})();

function sendMessage(feature) {
    const userInput = document.getElementById('userInput');
    const chatBox = document.getElementById('chatBox');

    const userInputText = userInput.value.trim();
    if (userInputText !== "") {
        // Append user message
        const userMessage = document.createElement('div');
        userMessage.className = `message user ${feature.cssClass}`;
        userMessage.textContent = userInput.value;
        chatBox.appendChild(userMessage);

        showProgressBar();
        // Clear input
        userInput.value = '';
        const _responseSetter = responseSetter();
        feature.func(userInputText, feature.api, _responseSetter);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

function responseSetter() {
    const chatBox = document.getElementById('chatBox');
    const botMessage = document.createElement('div');
    botMessage.className = 'message bot';
    chatBox.appendChild(botMessage);
    let value = '';
    function set(response) {
        value += response;
        botMessage.innerHTML = value;
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    return { set };
}

function showProgressBar() {
    const progressBar = document.querySelector('.progress-bar');
    progressBar.style.display = 'block';
}

function hideProgressBar() {
    const progressBar = document.querySelector('.progress-bar');
    progressBar.style.display = 'none';
}

function chat(query, api, responseSetter) {
    setTimeout(() => {
        hideProgressBar();
        responseSetter.set('chat response');
    }, 1000);
}

function streamingChat(query, api, responseSetter) {
    setTimeout(() => {
        hideProgressBar();
        responseSetter.set('streaming chat response');
    }, 1000);
}