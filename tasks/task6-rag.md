# Task 6: Retrieval-Augmented Generation

## Overview

This task introduces Retrieval-Augmented Generation (RAG) to enhance the application with the ability to answer questions based on specific knowledge bases. By leveraging AWS Bedrock's Knowledge Bases, we can provide more accurate and contextual answers to user queries.

## Instructions

### 1. Create an AWS Bedrock Knowledge Base

Before implementing the RAG functionality, you need to create a knowledge base in AWS Bedrock:

1. **Create a data source**: 
   - Navigate to the AWS Management Console and open the Amazon Bedrock service.
   - Select "Knowledge bases" from the left sidebar.
   - Click on "Create knowledge base".
   - Choose your data source type (S3, SharePoint, Confluence, etc.).
   - Configure access permissions and data source settings.

2. **Preprocess your data** (optional but recommended):
   - For better RAG performance, preprocess your documents before ingestion.
   - See our [Data Preprocessing Guide](preprocessing-data-rag.md) for detailed instructions.

3. **Configure your knowledge base**:
   - Name your knowledge base.
   - Select a vector embedding model (like Amazon Titan Embeddings).
   - Configure chunking settings based on your data.
   - Set up the retrieval settings.

4. **Review and create**:
   - Review your configuration settings.
   - Click "Create knowledge base".
   - Wait for the knowledge base creation and data ingestion to complete.

5. **Get your knowledge base ID**:
   - Once created, copy the knowledge base ID for use in your application.

For detailed instructions, refer to the [AWS Bedrock Knowledge Base Creation Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-create.html).

### 2. Install Required AWS SDK Package

```bash
npm i @aws-sdk/client-bedrock-agent-runtime
```

### 3. Update server.js with RAG Integration

Add imports for the Bedrock Agent Runtime client:

```javascript
// import required functions from @aws-sdk/client-bedrock-agent-runtime
import { BedrockAgentRuntimeClient, RetrieveAndGenerateType, RetrieveAndGenerateCommand } from "@aws-sdk/client-bedrock-agent-runtime";
```

### 4. Add Knowledge Base ID to Environment Variables

Add your Knowledge Base ID to the .env file:

```
KB_ID="your-knowledge-base-id"
```

### 5. Add Knowledge Base ID Variable

Add a constant to store your knowledge base ID:

```javascript
// Add Knowledge Base ID
const knowledgeBaseId = process.env.KB_ID;
```

### 6. Add Route for Knowledge Base Chat

Create a new endpoint for knowledge base chat:

```javascript
// Add route
app.post('/api/kbchat', async (req, res) => {
    const { query } = req.body;
    const _response = await chatWithKB(query);
    res.status(200).json({ message: _response });
});
```

### 7. Implement Knowledge Base Chat Function

Add function to retrieve answers from the knowledge base:

```javascript
// Invoke client to talk to Knowledge Base
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
```

### 8. Update Frontend index.js

Update the featureMap to add the knowledge base chat option:

```javascript
// Update featureMap to set api
{ type: 'chat', func: chat, api: '/api/kbchat', cssClass: 'chat-kb', name: 'Chat with Knowledge Base' },
```

## What You'll Learn

- Understanding Retrieval-Augmented Generation (RAG) architecture
- Setting up and configuring AWS Bedrock Knowledge Bases
- Implementing API calls to retrieve contextual information
- Enhancing LLM responses with domain-specific knowledge
- Best practices for document preprocessing and knowledge base optimization

## Resources

- [Pull Request](https://github.com/ranjanmadhu/ai-workshop/pull/10)
- [AWS Bedrock Agent Runtime SDK Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/bedrock-agent-runtime/)
- [Data Preprocessing Guide for RAG](preprocessing-data-rag.md)