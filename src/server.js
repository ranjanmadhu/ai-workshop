import express from 'express';
import { resolve, extname } from 'path';
import { config } from 'dotenv';
import { BedrockRuntimeClient, ConverseCommand, ConverseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockAgentRuntimeClient, RetrieveAndGenerateType, RetrieveAndGenerateCommand, RetrieveCommand, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import multer from 'multer';
import prompts from './prompts.js';

// Load environment variables from .env file
config();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const uploadFields = upload.fields([
    { name: 'imageFile', maxCount: 1 },
    { name: 'docFile', maxCount: 1 }
]);

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

// Add Knowledge Base ID
const knowledgeBaseId = process.env.KB_ID;

// Add Agent ID and Alias ID
const agentId = process.env.AGENT_ID;
const agentAliasId = process.env.AGENT_ALIAS_ID;

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

app.post('/api/llmstreaming', uploadFields, async (req, res) => {
    const { query, agent } = req.body;

    const imageFile = req.files['imageFile'] ? req.files['imageFile'][0] : null;
    const docFile = req.files['docFile'] ? req.files['docFile'][0] : null;

    try {
        let systemPrompt = null;
        if (agent) {
            switch (agent) {
                case 'kitchen_assistant':
                    systemPrompt = prompts.kitchen_assistant;
                    break;
                case 'insight_architect':
                    systemPrompt = prompts.insight_architect;
                    break;
                case 'safe_agile_coach':
                    systemPrompt = prompts.safe_agile_coach;
                    break;
                default:
                    break;
            }
        }

        const _response = await chatWithLLMStreaming(query, imageFile, docFile, null, systemPrompt);
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

async function chatWithLLMStreaming(query, imageFile, docFile, retrievdContext, systemPrompt) {
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

    if (imageFile) {
        // get the file extension
        const fileExtension = extname(imageFile.originalname);
        input.messages[0].content.push({
            "image": {
                "format": fileExtension.slice(1),
                "source": {
                    "bytes": imageFile.buffer
                }
            }
        });
    }

    if (docFile) {
        const fileExtension = extname(docFile.originalname);

        // currently sonnet 3.5 does not support document input
        const haikuModelId = 'anthropic.claude-3-haiku-20240307-v1:0';
        input.modelId = haikuModelId;

        input.messages[0].content.push(
            {
                "document": {
                    "format": fileExtension.slice(1),
                    "name": "string",
                    "source": {
                        "bytes": docFile.buffer
                    }
                }
            }
        );
    }

    if (retrievdContext) {
        input.messages[0].content.push({ text: retrievdContext })
    }

    if (systemPrompt) {
        input['system'] = [
            {
                "text": systemPrompt
            }
        ]
    }

    const command = new ConverseStreamCommand(input);
    const response = await client.send(command);
    return response;
}

app.post('/api/kbchat', async (req, res) => {
    const { query } = req.body;
    const _response = await chatWithKB(query);
    res.status(200).json({ message: _response });
});

async function chatWithKB(query) {
    const client = new BedrockAgentRuntimeClient(awsConfig);

    let payload = {
        input: { text: query },
        retrieveAndGenerateConfiguration: {
            type: RetrieveAndGenerateType.KNOWLEDGE_BASE,
            knowledgeBaseConfiguration: {
                knowledgeBaseId: knowledgeBaseId,
                modelArn: llm_id,
            }
        }
    };

    const invokeCommand = new RetrieveAndGenerateCommand(payload);
    const response = await client.send(invokeCommand);
    return response.output?.text;
}

// Add streaming route
app.post('/api/kbchatstreaming', uploadFields, async (req, res) => {
    const { query } = req.body;
    const _response = await chatWithKBStreaming(query);
    streamingResponse(res, _response);
});

async function chatWithKBStreaming(query) {
    // Retrieve results from knowledge base
    const client = new BedrockAgentRuntimeClient(awsConfig);

    const payload = {
        retrievalQuery: { text: query },
        knowledgeBaseId: knowledgeBaseId
    };

    const invokeCommand = new RetrieveCommand(payload);
    const response = await client.send(invokeCommand);

    // Parse result into a context
    let context = 'Documents: ';
    response?.retrievalResults?.forEach(async (result) => {
        context = context.concat(`\n\n\n${result?.content?.text}`);
    });

    // add safe guard
    context = context.concat('\n\n\n Remember, you should be a responsible AI assistant and should not generate harmful or misleading content!');

    // Generate response using LLM
    return await chatWithLLMStreaming(query, null, null, context, prompts.knowledgebase);
}

app.post('/api/agent', uploadFields, async (req, res) => {
    const { query, sessionId } = req.body;
    const _response = await chatWithAgent(query, sessionId);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Function to send data to the client
    const sendData = (data) => {
        res.write(data);
    };

    try {
        for await (let chunkEvent of _response.completion) {
            const chunk = chunkEvent.chunk;
            const decodedResponse = new TextDecoder("utf-8").decode(chunk.bytes);
            sendData(decodedResponse);
        }

        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Streaming error' });
    }
});

async function chatWithAgent(query, sessionId) {
    const client = new BedrockAgentRuntimeClient(awsConfig);

    const payload = {
        agentId: agentId, 
        agentAliasId: agentAliasId, 
        sessionId: sessionId,
        endSession: false,
        enableTrace: false,
        inputText: query,
    };

    const command = new InvokeAgentCommand(payload);
    return await client.send(command);
}

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});