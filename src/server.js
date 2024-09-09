import express from 'express';
import { resolve } from 'path';
import { config } from 'dotenv';
import { BedrockRuntimeClient, ConverseCommand, ConverseStreamCommand } from "@aws-sdk/client-bedrock-runtime";

// Load environment variables from .env file
config();


// Variables
const app = express();
const port = 3000;

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

// Serve static files from the 'public' directory
app.use(express.static(('./src/public/')));

// Parse JSON bodies
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(resolve(__dirname, './public/index.html'));
});

app.get('/api', (req, res) => {
    res.send('Welcome to AI Workshop');
});

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

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});