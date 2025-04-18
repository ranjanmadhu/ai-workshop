# Task 3: Chat Streaming Responses

## Overview

This task focuses on implementing streaming responses from AWS Bedrock's Claude LLM to enable real-time text generation instead of waiting for the complete response.

## Instructions

### 1. Update Import Statement

Update your import to include the `ConverseStreamCommand`:

```javascript
import { BedrockRuntimeClient, ConverseCommand, ConverseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
```

### 2. Add Streaming Chat Route to server.js

Add a new route for streaming responses:

```javascript
// Streaming Chat route
app.post('/api/llmstreaming', async (req, res) => {
    const { query } = req.body;

    try {
        const _response = await chatWithLLMStreaming(query);
        streamingResponse(res, _response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Streaming error' });
    }
});
```

### 3. Implement Stream Response Function

Add a function to handle streaming the response:

```javascript
// Stream response
async function streamingResponse(res, _response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Function to send data to the client
    const sendData = (data) => {
        res.write(data);
    };

    try {
        for await (const item of _response.stream) {
            if (item.contentBlockDelta) {
                const text = item.contentBlockDelta.delta?.text;
                sendData(text);
            }
        }

        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Streaming error' });
    }
}
```

### 4. Implement Streaming Chat Function

Add a function to call the streaming API:

```javascript
// Invoke streaming command
async function chatWithLLMStreaming(query) {
    const client = new BedrockRuntimeClient(awsConfig);
    console.log(query);
    const input = {
        modelId: llm_id,
        messages: [
            {
                role: 'user',
                content: [
                    {
                        text: query
                    }
                ]
            }
        ]
    }

    const command = new ConverseStreamCommand(input);
    const response = await client.send(command);
    return response;
}
```

### 5. Update Frontend index.js

Update the `featureMap` to set the API endpoint for streaming:

```javascript
{ type: 'chat', func: streamingChat, api: '/api/llmstreaming', cssClass: 'chat-streaming', name: 'Chat with Streaming' },
```

### 6. Implement Frontend Streaming Chat Function

Add a function to handle streaming responses on the frontend:

```javascript
function streamingChat(query, api, responseSetter) {
    const data = { query: query };

    fetch(api, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
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
```

## What You'll Learn

- How to implement streaming responses with AWS Bedrock's Claude LLM
- Working with the ReadableStream API
- Creating server-sent events for real-time communication
- Processing incremental responses for better user experience

## Resources

- [Pull Request](https://github.com/ranjanmadhu/ai-workshop/pull/7)
- [ReadableStream API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)