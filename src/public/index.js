const functionMap = {
    'llm': { func: chat, cssClass: 'llm', api: '' },
    'llm-streaming': { func: streamingChat, cssClass: 'llm-streaming', api: '' },
    'llm-doc': { func: streamingChat, cssClass: 'llm-doc', api: '' },
    'llm-image': { func: streamingChat, cssClass: 'llm-image', api: '' },
    'llm-kb': { func: chat, cssClass: 'llm-kb', api: '' },
    'llm-kb-streaming': { func: streamingChat, cssClass: 'llm-kb-streaming', api: '' },
    'agent': { func: chat, cssClass: 'agent', api: '' },
};

function sendMessage(type) {
    const userInput = document.getElementById('userInput');
    const chatBox = document.getElementById('chatBox');
    const _function = functionMap[type];
    const userInputText = userInput.value.trim();
    if (userInputText !== "") {
        // Append user message
        const userMessage = document.createElement('div');
        userMessage.className = `message user ${_function.cssClass}`;
        userMessage.textContent = userInput.value;
        chatBox.appendChild(userMessage);

        showProgressBar();
        // Clear input
        userInput.value = '';
        const _responseSetter = responseSetter();
        _function.func(userInputText, _function.api, _responseSetter);
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