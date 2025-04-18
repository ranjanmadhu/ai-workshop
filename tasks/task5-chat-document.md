# Task 5: Chat with Document

## Overview

This task extends our application to handle document uploads (PDF, DOCX), allowing users to chat with Claude about the content of their documents. The LLM can analyze and answer questions about the uploaded documents.

## Instructions

### 1. Update Streaming Route in server.js

Modify the route to handle document files:

```javascript
// update '/api/llmstreaming' route to read docFile data and send to chatWithLLMStreaming
app.post('/api/llmstreaming', uploadFields, async (req, res) => {
    const { query } = req.body;

    const imageFile = req.files['imageFile'] ? req.files['imageFile'][0] : null;
    const docFile = req.files['docFile'] ? req.files['docFile'][0] : null;

    try {
        const _response = await chatWithLLMStreaming(query, imageFile, docFile);
        streamingResponse(res, _response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Streaming error' });
    }
});
```

### 2. Update chatWithLLMStreaming Function for Document Processing

Modify the function to handle document processing:

```javascript
async function chatWithLLMStreaming(query, imageFile, docFile) {
   // ...existing code...
  
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
    
    // ...existing code...
}
```

### 3. Update Frontend to Handle Document Files

Modify the sendMessage function:

```javascript
function sendMessage(feature) {
  // ...existing code...
  
  const docFile = document.getElementById('docFile').files ? document.getElementById('docFile').files[0] : null;
        
  // ...existing code...
 
  feature.func(userInputText, feature.api, _responseSetter, imageFile, docFile);
  // ...existing code...
  document.getElementById('docFile').value = '';
  // ...existing code...
}
```

### 4. Update streamingChat Function to Send Document Data

Modify the function to send document files:

```javascript
function streamingChat(query, api, responseSetter, imageFile, docFile) {
  // ...existing code...
  if (docFile) {
      formData.append('docFile', docFile);
  }   
  // ...existing code...
}
```

### 5. Add Function to Display Documents in Chat

Create a function to display uploaded documents in the chat:

```javascript
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
```

### 6. Call displayDocument from sendMessage

Update the sendMessage function to show the document:

```javascript
// Inside sendMessage function
...
await displayDocument(docFile);
showProgressBar();
...
```

## Sample Use Cases

### Document Summarization
Upload a document and ask the model to summarize its content.

### Resume Analysis
Upload a resume and use this prompt for detailed analysis:

```
You are an AI assistant specialized in parsing and analyzing resume data. I have a resume in document format that includes details about a person's work experience, education, skills, and other relevant information. Please analyze the attached resume and provide me with:

A summary of the candidate's total years of work experience with start date
Their most recent job title and company with year of employment
List all unique skills
The highest level of education achieved
A summary of roles and responsibilities company wise
Can you give strength of the candidate?

If any of this information is not available please indicate so. Resume is attached to the conversation
```

## What You'll Learn

- Processing document files (PDF, DOCX) with Claude
- Switching between different Claude models based on input type
- Creating interactive document previews in web applications
- Implementing multimodal conversations with LLMs

## Resources

- [Pull Request](https://github.com/ranjanmadhu/ai-workshop/pull/9)
- [AWS Bedrock Models and Features](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html#conversation-inference-supported-models-features)