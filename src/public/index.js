const featureMap = [
    { type: 'chat', func: chat, api: '/api/llm', cssClass: 'chat', name: 'Chat' },
    { type: 'chat', func: streamingChat, api: '/api/llmstreaming', cssClass: 'chat-streaming', name: 'Chat with Streaming' },
    { type: 'chat', func: chat, api: '/api/kbchat', cssClass: 'chat-kb', name: 'Chat with Knowledge Base' },
    { type: 'chat', func: streamingChat, api: '/api/kbchatstreaming', cssClass: 'chat-kb-streaming', name: 'Chat with Knowledge Base Streaming' },
    { type: 'agent', func: streamingChat, api: '/api/llmstreaming', cssClass: 'agent-ka', name: 'Agent - Kitchen Assistant', agent: 'kitchen_assistant' },
    { type: 'agent', func: streamingChat, api: '/api/llmstreaming', cssClass: 'agent-sac', name: 'Agent - Safe Agile Coach', agent: 'safe_agile_coach' },
    { type: 'agent', func: streamingChat, api: '/api/llmstreaming', cssClass: 'agent-ia', name: 'Agent - Insight Architect', agent: 'insight_architect' },
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

async function sendMessage(feature) {
    const userInput = document.getElementById('userInput');
    const chatBox = document.getElementById('chatBox');

    const userInputText = userInput.value.trim();
    if (userInputText !== "") {
        // Append user message
        const userMessage = document.createElement('div');
        userMessage.className = `message user ${feature.cssClass}`;
        userMessage.textContent = userInput.value;
        chatBox.appendChild(userMessage);

        const imageFile = document.getElementById('jpegFile').files ? document.getElementById('jpegFile').files[0] : null;
        const docFile = document.getElementById('docFile').files ? document.getElementById('docFile').files[0] : null;

        await displayImage(imageFile);
        await displayDocument(docFile);
        showProgressBar();
        // Clear input
        userInput.value = '';
        const _responseSetter = responseSetter();
        feature.func(userInputText, feature.api, _responseSetter, imageFile, docFile, feature.agent);
        
        document.getElementById('jpegFile').value = '';
        document.getElementById('docFile').value = '';
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

displayImage = function (imageFile) {
    return new Promise((resolve, reject) => {
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = async function (e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                chatBox.appendChild(img);
                resolve();
            };
            reader.readAsDataURL(imageFile);
        } else {
            resolve();
        }
    });
}

async function displayDocument(docFile) {
    return new Promise((resolve, reject) => {
        if (docFile) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const link = document.createElement('a');
                link.href = e.target.result;
                link.textContent = docFile.name;
                link.download = docFile.name;

                const icon = document.createElement('img');
                icon.src = './file-icon.png';
                icon.alt = 'File Icon';
                icon.style.width = '32px';
                icon.style.height = '32px';
                icon.style.marginRight = '8px';

                const container = document.createElement('div');
                container.className = 'file-container';
                container.appendChild(icon);
                container.appendChild(link);

                chatBox.appendChild(container);

                resolve();
            };
            reader.readAsDataURL(docFile);
        } else {
            resolve();
        }
    });
}

function responseSetter() {
    const chatBox = document.getElementById('chatBox');
    const botMessage = document.createElement('div');
    botMessage.className = 'message bot';
    chatBox.appendChild(botMessage);
    let value = '';
    function set(response) {
        value += response;
        botMessage.innerHTML = marked.parse(value);
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
    const data = { query: query };
    fetch(api, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            responseSetter.set(data?.message);
            hideProgressBar();
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function streamingChat(query, api, responseSetter, imageFile, docFile, agent) {
    const formData = new FormData();
    formData.append('query', query);

    if (imageFile) {
        formData.append('imageFile', imageFile);
    }

    if (docFile) {
        formData.append('docFile', docFile);
    }

    if (agent) {
        formData.append('agent', agent);
    }

    fetch(api, {
        method: 'POST',
        body: formData
    })
        .then(response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            return new ReadableStream({
                start(controller) {
                    function push() {
                        reader.read().then(({ done, value }) => {
                            if (done) {
                                controller.close();
                                hideProgressBar();
                                return;
                            }
                            const chunk = decoder.decode(value, { stream: true });
                            responseSetter.set(chunk);
                            push();
                        });
                    }
                    push();
                }
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });
}