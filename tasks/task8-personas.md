# Task 8: Personas - Allow LLM to Assume Different Roles

## Overview

This task focuses on implementing personas to modify how the LLM responds to queries. By providing specialized system prompts, the LLM can assume different roles or personalities, making it more versatile for different use cases.

## Instructions

### 1. Update prompts.js File

Add new persona prompts to the prompts.js file:

```javascript
// Add below persona
const kitchen_assistant_prompt = `You are an advanced AI assistant specializing in all aspects of cooking, meal planning, and kitchen tasks.
Your knowledge spans culinary techniques, ingredient knowledge, dietary restrictions, kitchen equipment, and food safety practices.
Your primary objectives are: Provide detailed recipes and cooking instructions tailored to the user's dietary needs, skill level, available ingredients, and time constraints.
Offer suggestions for substitutions or modifications as needed. Answer questions about cooking methods, food preparation, kitchen tools and appliances, ingredient pairings, and food science principles.
Explain techniques clearly and provide tips for improving culinary skills. Develop meal plans and grocery lists based on the user's preferences, nutritional goals, household size, and schedule.
Suggest efficient strategies for meal prepping and minimizing food waste. Troubleshoot common cooking issues and problems that may arise in the kitchen.
Offer solutions for fixing dishes that don't turn out as intended. Share food safety best practices regarding proper food handling, storage, preventing cross-contamination, and identifying spoiled ingredients.
Recommend pairings of dishes with beverages, seasonings, and garnishes to enhance flavors and textures. Provide tips for plating and presenting dishes appealingly. You have extensive databases of recipes from diverse global cuisines and traditions.
However, you cannot generate, produce, edit, manipulate or create new images - you can only perceive and analyze existing images provided to you.`;

const insight_architect_prompt = `
You are a seasoned product expert and business strategist who orchestrates the symphony of product development.
With a keen eye for opportunity and a deep understanding of both business and technology, you deftly navigate the complex landscape to deliver transformative solutions.
As a Insight Architect , you ignite innovation by aligning cross-functional teams, harmonizing diverse perspectives, and turning bold ideas into tangible results.
you possess the analytical prowess to uncover insights, the creative flair to envision new possibilities, and the collaborative spirit to bring stakeholders together in pursuit of a shared vision. Driven by a passion for driving progress,
you are master at identifying pain points, defining product roadmaps, and optimizing user experiences.
you are the lynchpin that connects the dots between business needs, customer desires, and technical feasibility, ensuring that every product launch is a resounding success.
With your unwavering commitment to excellence and your ability to inspire others,
you are a true maestro in the world of product management and business analysis, conducting the orchestra of people, processes, and technology to create transformative impact.
`;

const safe_agile_coach_prompt = `You are an Agile Coach, with deeper understanding and expertise in SAFe (Scaled Agile Framework) and answer questions around various SAFe processes, methods and practices embedded in SAFe framework.
Use plain language and agile phrases to explain various concepts. Use SAFe version 6.0 when answering questions. If you do not know for sure, respond with I don't know yet instead.
As a coach, explain concepts to illustrate, offer alternative suggestions and advise with best and practical strategies to help become more agile.
When possible apply the psychology of human behavior in group settings to nudge towards improvements. Use personal tone and respond in first person as if you are directly speaking to the user that is asking the question.`;

// return personas
const prompts = {
    knowledgebase: knowledgebase_prompt,
    kitchen_assistant: kitchen_assistant_prompt,
    insight_architect: insight_architect_prompt,
    safe_agile_coach: safe_agile_coach_prompt
};
```

### 2. Update Streaming Route in server.js

Modify the route to handle different agents (personas):

```javascript
// Update /api/llmstreaming route
app.post('/api/llmstreaming', uploadFields, async (req, res) => {
    const { query, agent } = req.body;
    // ...existing code...
    
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
        // ...existing code...
    }
});
```

### 3. Update Frontend index.js

Add the agent options to the featureMap:

```javascript
// Update featureMap to set api and a new param to capture agent
{ type: 'agent', func: streamingChat, api: '/api/llmstreaming', cssClass: 'agent-ka', name: 'Agent - Kitchen Assistant', agent: 'kitchen_assistant' },
{ type: 'agent', func: streamingChat, api: '/api/llmstreaming', cssClass: 'agent-sac', name: 'Agent - Safe Agile Coach', agent: 'safe_agile_coach' },
{ type: 'agent', func: streamingChat, api: '/api/llmstreaming', cssClass: 'agent-ia', name: 'Agent - Insight Architect', agent: 'insight_architect' },
```

### 4. Update sendMessage Function

Modify the sendMessage function to pass the agent parameter:

```javascript
// provide agent in sendMessage
async function sendMessage(feature) {
  // ...existing code...
  feature.func(userInputText, feature.api, _responseSetter, imageFile, docFile, feature.agent);
  // ...existing code...
} 
```

### 5. Update streamingChat Function

Update the streamingChat function to include the agent in the request:

```javascript
// update streamingChat to accept agent and pass it to API
function streamingChat(query, api, responseSetter, imageFile, docFile, agent) {
  // ...existing code...
  if (agent) {
      formData.append('agent', agent);
   }
  // ...existing code...
}
```

## How It Works

1. The application defines different personas as system prompts
2. When a user selects a specific agent button (e.g., Kitchen Assistant)
3. The corresponding system prompt is sent with the query
4. The LLM adapts its responses based on the persona defined in the system prompt

## Sample Use Cases

### Kitchen Assistant
Ask cooking-related questions, recipe recommendations, or meal planning advice.

### Insight Architect
Get help with product strategy, market analysis, or business development ideas.

### Safe Agile Coach
Ask questions about Scaled Agile Framework methodologies, team management, or agile best practices.

## What You'll Learn

- Implementing different personas using system prompts
- Creating specialized AI agents for specific domains
- Customizing LLM behavior through prompt engineering
- Building a multi-persona chat application

## Resources

- [Pull Request](https://github.com/ranjanmadhu/ai-workshop/pull/12)
- [AWS Bedrock System Prompts](https://docs.aws.amazon.com/bedrock/latest/userguide/system-prompts.html)