# Task 9: Agents Function/Tools Calling

## Overview

This task focuses on implementing function calling capabilities for AI agents using AWS Bedrock. By defining functions that the LLM can call, we enable more interactive and dynamic interactions where the AI can perform specific actions based on user requests.

## Instructions

## AWS Console Setup

### 1. Create a New Lambda Function

Create a Lambda function in the AWS Console that will handle the function calls from the agent.

### 2. Update Lambda Permissions

Add the following permission to your Lambda function's Resource-based policy statements:

- Statement ID: `agentsInvokeFunction`
- Principal: `bedrock.amazonaws.com`
- Action: `lambda:InvokeFunction`

### 3. Update Lambda Function Code

Set up a basic Lambda function to handle function calls:

```javascript
console.log('Loading function');

export const handler = async (event, context) => {
   const agent = event['agent'];
   const actionGroup = event['actionGroup'];
   const _function = event['function'];
   const parameters = event['parameters'];
  
   console.log(agent);
   console.log(actionGroup);
   console.log(_function);
   console.log(parameters);
   
   let result_text = 'function called';
   const responseBody =  {
        "TEXT": {
            "body": result_text
        }
    }
  
   const action_response = {
       'actionGroup': actionGroup,
        'function': _function,
        'functionResponse': {
            'responseBody': responseBody
        }
   }
  
   const function_response = {'response': action_response, 'messageVersion': event['messageVersion']};
   return function_response;   
};
```

### 4. Create AWS Bedrock Agent

In the AWS Console, create a new Bedrock Agent with the following details:

#### Agent Prompt
```
You are a helpful agent who can perform below tasks by calling functions,

tell the current time

add two numbers
```

### 5. Add Action Groups

Add an action group with two functions:

- `get_time`: "this function returns current time in utc" (no parameters)
- `add_two_numbers`: "This function takes two parameters param1 and param2 and adds them to give the result"

### 6. Save and Prepare the Agent

Save the agent configuration and prepare it for testing.

### 7. Implement get_time Function in Lambda

Update your Lambda function to implement the get_time function:

```javascript
// implement get time function
function get_time(){
   return new Date();
}

// if the function name matches get_time then call the function and set result_text
if(_function === 'get_time'){
   const _currentTime = get_time();
   result_text = `The time is ${_currentTime}`;
}
```

### 8. Test the get_time Function

Deploy your Lambda changes and test the function in the Bedrock Agent console.

### 9. Implement add_two_numbers Function in Lambda

Update your Lambda function to implement the add_two_numbers function:

```javascript
// implement add two number function
function add_two_numbers(param1, param2){
   return parseInt(param1) + parseInt(param2);
}

// Updated function handling
if(_function === 'get_time'){
   const _currentTime = get_time();
   result_text = `The time is ${_currentTime}`;
}else if(_function === 'add_two_numbers'){     
   if(parameters?.length !== 2){
      result_text = `Function ${_function} needs two numbers to perform addition`;
   }else if(parameters.some(_param => !Number.isInteger(parseInt(_param.value, 10)))){
      result_text = `Function ${_function} only supports adding integers.`;
   }else{
       const _result = add_two_numbers(parameters[0].value, parameters[1].value);
       result_text = `Addition of ${parameters[0].value} and  ${parameters[1].value} is ${_result}`;
   }      
}else{
   result_text = `Function ${_function} not supported`;
}
```

### 10. Test the add_two_numbers Function

Deploy your Lambda changes and test the function in the Bedrock Agent console.

## Application Integration

### 1. Update server.js to Import InvokeAgentCommand

Add the import statement:

```javascript
// Import InvokeAgentCommand
import { BedrockAgentRuntimeClient, RetrieveAndGenerateType, RetrieveAndGenerateCommand, RetrieveCommand, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
```

### 2. Add Agent Environment Variables

Add the following environment variables to your .env file:

```
AGENT_ID="your-agent-id"
AGENT_ALIAS_ID="your-agent-alias-id"
```

And add the corresponding constants to your server.js:

```javascript
// Add Agent ID and Alias ID
const agentId = process.env.AGENT_ID;
const agentAliasId = process.env.AGENT_ALIAS_ID;
```

### 3. Add Agent API Route

Create a new endpoint for agent interactions:

```javascript
// Add agent route
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
```

### 4. Implement Agent Chat Function

Add a function to interact with the agent:

```javascript
// Add function to call Agent
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
```

### 5. Update Frontend in index.js

Add the agent function calling option to the featureMap:

```javascript
// update featureMap for api name and add a property to denote session is required
{ type: 'agent', func: streamingChat, api: '/api/agent', cssClass: 'agent-ft', name: 'Agent - Function\\\Tools', requireSession: true }
```

### 6. Update sendMessage Function

Modify the sendMessage function to handle session requirements:

```javascript
// update sendMessage to utilize requireSession property
async function sendMessage(feature) {
   // ...existing code...
   feature.func(userInputText, feature.api, _responseSetter, imageFile, docFile, feature.agent, feature.requireSession);
   // ...existing code...
}
```

### 7. Update streamingChat Function

Update the streamingChat function to include session handling:

```javascript
// update streamingChat method to use and pass requireSession to API
function streamingChat(query, api, responseSetter, imageFile, docFile, agent, requireSession) {
    // ...existing code...
    if (requireSession) {
        formData.append('sessionId', 123456);
    }
    // ...existing code...
}
```

## How It Works

1. The user makes a request that requires a specific action (e.g., "What's the current time?")
2. The application sends the request to the AWS Bedrock Agent
3. The agent analyzes the request and decides which function to call
4. The agent invokes the Lambda function with the appropriate parameters
5. The Lambda function processes the request and returns a response
6. The agent formats and returns the final response to the user

## Sample Use Cases

- Ask the agent for the current time
- Request the agent to add two numbers
- Combine function calls with natural language interaction

## What You'll Learn

- Setting up AWS Bedrock Agents with custom functions
- Implementing AWS Lambda functions for agent actions
- Creating stateful conversations with session management
- Building more interactive and capable AI assistants

## Resources

- [Pull Request](https://github.com/ranjanmadhu/ai-workshop/pull/13)
- [AWS Bedrock Agents Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)