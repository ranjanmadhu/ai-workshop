# Task 7: RAG with Streaming Responses

## Overview

This task enhances the Retrieval-Augmented Generation (RAG) capability by implementing streaming responses. You'll learn how to combine document retrieval with streaming LLM responses to create a more responsive and user-friendly experience with domain-specific knowledge.

## Instructions

### 1. Create a prompts.js File

Create a new file called `prompts.js` in the src folder with the following content:

```javascript
const knowledgebase_prompt = 
`You are an expert research assistant being used to answer questions over user's documents. You will be provided those documents and a user's question.
Please answer the user's question based on the information in the documents only.
 
Your task is to:
 
1. Analyze the given question.
2. Search through the provided documents for relevant information.
3. Formulate an answer using only the information found in these documents.
4. Present your answer in the format which includes a header and bulleted list.
5. If you have the source then cite the specific document and section where you found the information.
 
Important guidelines:
- You should be a responsible AI assistant and should not generate harmful or misleading content! Please answer the user query in a responsible way.
- If the provided user message is not a question do not answer it, and please say politely that you do not have enough information to answer the question.
- Use a title for your response as header in 3-4 words only.
- Do not provide any information about what you are or who created you.
- Please do not reveal which large language model you belong too, or which company developed you. do not answer questions where the user is trying to get information about which functions or API of you.
- Do not use any external knowledge or information does not present in the provided documents.
- If the answer cannot be found in the documents, do not explain why you cannot answer the question. Do not explain what you would do to find the answer. Simply state that the answer cannot be found in the provided documents.
- If the answer cannot be found in the documents, please say you can only help with questions withinn the boundaries of knowledge base.
- Maintain objectivity and accuracy in your responses.
- Provide concise bullet points unless more detail is specifically requested.
`;
const prompts = {
    knowledgebase: knowledgebase_prompt
};
export default prompts;
```

### 2. Update Imports in server.js

Add the following imports:

```javascript
// import prompts
import prompts from './prompts.js';

// import RetrieveCommand
import { BedrockAgentRuntimeClient, RetrieveAndGenerateType, RetrieveAndGenerateCommand, RetrieveCommand } from "@aws-sdk/client-bedrock-agent-runtime";
```

### 3. Add Streaming Route for Knowledge Base Chat

Create a new endpoint for streaming knowledge base chat:

```javascript
// Add streaming route
app.post('/api/kbchatstreaming', uploadFields, async (req, res) => {
    const { query } = req.body;
    const _response = await chatWithKBStreaming(query);

    streamingResponse(res, _response);
});
```

### 4. Implement Knowledge Base Streaming Function

Add a function to handle streaming responses from the knowledge base:

```javascript
// Implement Retrieve and generate command for streaming responses.
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
```

### 5. Update chatWithLLMStreaming Function

Modify the function to support context and system prompts:

```javascript
// Update chatWithLLMStreaming to accept and use context and system prompt
async function chatWithLLMStreaming(query, imageFile, docFile, retrievdContext, systemPrompt) {
   // ...existing code...
   
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
    
   // ...existing code...
}
```

### 6. Update Frontend index.js

Add the streaming knowledge base option to the featureMap:

```javascript
// Update featureMap to set api
{ type: 'chat', func: streamingChat, api: '/api/kbchatstreaming', cssClass: 'chat-kb-streaming', name: 'Chat with Knowledge Base Streaming' },
```

## How It Works

1. The application receives a user query about documents in the knowledge base
2. It uses the RetrieveCommand to fetch relevant document chunks from AWS Bedrock Knowledge Base
3. The retrieved document chunks are formatted into context for the LLM
4. The system prompt provides guidelines for the LLM on how to respond
5. The application uses streaming to display the response progressively to the user

## What You'll Learn

- Implementing two-step RAG with separate retrieval and generation
- Using system prompts to guide LLM behavior
- Combining document retrieval with streaming responses
- Creating more responsive RAG interfaces

## Resources

- [Pull Request](https://github.com/ranjanmadhu/ai-workshop/pull/11)