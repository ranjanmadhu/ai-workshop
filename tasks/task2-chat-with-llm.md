# Task 2: Chat with LLM

## Overview

This task focuses on integrating AWS Bedrock's Claude LLM into our application to enable basic conversational capabilities.

## Instructions

### 1. Install Required AWS Bedrock NPM Package

```bash
npm i @aws-sdk/client-bedrock-runtime
```

### 2. Install Package for Environment Variables

```bash
npm i dotenv
```

### 3. Create Environment File

Create a `.env` file in the project root and add your AWS credentials:

```
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_SESSION_TOKEN=""
```

### 4. Update Server.js File

Add the following code to `server.js`:

```javascript
// Add Import statements 
import { config } from 'dotenv';
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

// Load environment variables from .env file
config();

// Parse JSON bodies
app.use(express.json());

// Define AWS configuration
const aws_region = 'us-east-1';
const credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN
};
const awsConfig = {
    region: aws_region,
    credentials: credentials
};

// Define Large Language Model Id
const llm_id = 'anthropic.claude-3-5-sonnet-20240620-v1:0';

// Define route
app.post('/api/llm', async (req, res) => {
    const { query } = req.body;
    const _response = await chatWithLLM(query);
    res.status(200).json({ message: _response });
});

// Converse with LLM
async function chatWithLLM(query) {
    const client = new BedrockRuntimeClient(awsConfig);

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

    const command = new ConverseCommand(input);
    const response = await client.send(command);
    // console.log(JSON.stringify(response, null, 2));
    return response?.output?.message?.content[0]?.text || 'could not get response';
}
```

### 5. Update Frontend index.js File

Update the `featureMap` to set the API endpoint:

```javascript
{ type: 'chat', func: chat, api: '/api/llm', cssClass: 'chat', name: 'Chat' },
```

Replace the `chat` function with this implementation:

```javascript
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
```

### 6. Update index.html for Markdown Rendering

Add the marked.js library to parse Markdown responses:

```html
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
```

### 7. Update responseSetter Method

Update the `responseSetter` method to use marked.parse:

```javascript
function set(response) {
    value += response;
    botMessage.innerHTML = marked.parse(value);
    chatBox.scrollTop = chatBox.scrollHeight;
}
```

## What You'll Learn

- How to integrate AWS Bedrock's Claude LLM
- Setting up environment variables for secure API access
- Implementing basic chat functionality with LLMs
- Formatting LLM responses with Markdown parsing

## Resources

- [Pull Request](https://github.com/ranjanmadhu/ai-workshop/pull/6)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)