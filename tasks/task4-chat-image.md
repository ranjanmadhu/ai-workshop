# Task 4: Chat with Image

## Overview

This task focuses on enabling the application to process and analyze images using AWS Bedrock's Claude model. You'll implement functionality to upload images, send them to the LLM, and display them in the chat interface.

## Instructions

### 1. Install Multer for Handling File Uploads

```bash
npm i multer
```

### 2. Update Import Statements in server.js

Add multer and update path import:

```javascript
import multer from 'multer';
import { resolve, extname } from 'path';
```

### 3. Configure Multer for File Uploads

Add the following configuration for handling file uploads:

```javascript
// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const uploadFields = upload.fields([
    { name: 'imageFile', maxCount: 1 },
    { name: 'docFile', maxCount: 1 }
]);
```

### 4. Update Streaming Route to Handle Image Files

Modify the streaming route to include image handling:

```javascript
// update '/api/llmstreaming' route to add uploadFields middleware and read imageFile data
app.post('/api/llmstreaming', uploadFields, async (req, res) => {
    const { query } = req.body;

    const imageFile = req.files['imageFile'] ? req.files['imageFile'][0] : null;

    try {
        const _response = await chatWithLLMStreaming(query, imageFile);
        streamingResponse(res, _response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Streaming error' });
    }
});
```

### 5. Update chatWithLLMStreaming Function to Process Images

Modify the function to handle image processing:

```javascript
async function chatWithLLMStreaming(query, imageFile) {
   // ...existing code...
   
   if (imageFile) {
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
    
    // ...existing code...
}
```

### 6. Update Frontend to Handle Image Files

Modify the sendMessage function:

```javascript
function sendMessage(feature) {
  // ...existing code...
  
  const imageFile = document.getElementById('jpegFile').files ? document.getElementById('jpegFile').files[0] : null;
        
  // ...existing code...
 
  feature.func(userInputText, feature.api, _responseSetter, imageFile);
  document.getElementById('jpegFile').value = '';
  // ...existing code...
}
```

### 7. Update streamingChat Function to Send Image Data

Modify the function to use FormData for sending files:

```javascript
function streamingChat(query, api, responseSetter, imageFile) {
    const formData = new FormData();
    formData.append('query', query);

    if (imageFile) {
        formData.append('imageFile', imageFile);
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
```

### 8. Add Function to Display Images in Chat

Create a function to display uploaded images in the chat:

```javascript
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
```

### 9. Call displayImage from sendMessage

Update the sendMessage function to show the image:

```javascript
// Inside sendMessage function
...
await displayImage(imageFile);
showProgressBar();
...
```

## Sample Use Cases

- Add a UI screenshot and ask the model to build starting HTML/CSS for it
- Ask the model to analyze a chart or graph in an image
- Request the model to describe the content of an image in detail
- Ask the model to identify objects, text, or people in an image

## Example Prompt

```
You are an expert frontend engineer championed in Angular framework, I am giving you a UI mockup, could you please build a project implementing the same?
```

## What You'll Learn

- Handling file uploads with Multer
- Working with binary data and FormData
- Integrating Claude's multimodal capabilities
- Displaying images in web applications

## Resources

- [Pull Request](https://github.com/ranjanmadhu/ai-workshop/pull/8)
- [FormData API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/FormData)