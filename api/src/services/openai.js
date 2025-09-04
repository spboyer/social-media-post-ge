const OpenAI = require('openai');
const { DefaultAzureCredential } = require('@azure/identity');

class OpenAIService {
    constructor() {
        this.endpoint = process.env.AZURE_OPENAI_ENDPOINT;
        this.gptDeployment = process.env.AZURE_OPENAI_GPT_DEPLOYMENT || 'gpt-4o';
        this.miniDeployment = process.env.AZURE_OPENAI_GPT_MINI_DEPLOYMENT || 'gpt-4o-mini';
        this.embeddingDeployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-small';
        
        // Check if we're in local development mode
        const isLocalDev = !process.env.AZURE_OPENAI_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT.includes('your-openai-resource');
        
        if (isLocalDev) {
            // Local development mode - use fake client for mock responses
            this.isLocalMode = true;
            console.log('OpenAI service running in local mock mode - no Azure OpenAI endpoint configured');
        } else {
            // Production mode - use real Azure OpenAI with managed identity
            this.isLocalMode = false;
            console.log('OpenAI service running in production mode with managed identity');
            console.log('Azure OpenAI Endpoint:', this.endpoint);
            console.log('GPT Deployment:', this.gptDeployment);
            
            // Initialize managed identity credential
            this.credential = new DefaultAzureCredential();
            this.tokenCache = null;
            this.tokenExpiry = null;
        }
    }

    async getAccessToken() {
        try {
            // Check if we have a valid cached token
            if (this.tokenCache && this.tokenExpiry && Date.now() < this.tokenExpiry) {
                return this.tokenCache;
            }
            
            // Get new token using managed identity
            const tokenResponse = await this.credential.getToken('https://cognitiveservices.azure.com/.default');
            this.tokenCache = tokenResponse.token;
            this.tokenExpiry = tokenResponse.expiresOnTimestamp;
            
            console.log('Retrieved new access token via managed identity');
            return this.tokenCache;
        } catch (error) {
            console.error('Failed to get managed identity token:', error);
            throw error;
        }
    }

    async generateSocialMediaPost(content, platform, platformConfig) {
        try {
            // Check if we're in local mock mode
            if (this.isLocalMode) {
                return this.generateMockPost(content, platform, platformConfig);
            }
            
            const prompt = this.createPlatformPrompt(content, platform, platformConfig);
            
            const messages = [
                {
                    role: 'system',
                    content: 'You are a social media expert. Transform content into engaging, platform-appropriate posts that follow best practices and stay within character limits.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ];

            // Get access token for managed identity
            const accessToken = await this.getAccessToken();
            
            // Make direct API call to Azure OpenAI
            const response = await fetch(`${this.endpoint}/openai/deployments/${this.gptDeployment}/chat/completions?api-version=2024-08-01-preview`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 500,
                    top_p: 0.9
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Azure OpenAI API error:', response.status, errorText);
                throw new Error(`API request failed: ${response.status} ${errorText}`);
            }

            const result = await response.json();
            return result.choices[0]?.message?.content?.trim() || '';
        } catch (error) {
            console.error('OpenAI API error:', error);
            
            // Fallback to mock response if API fails
            const mockPost = this.generateMockPost(content, platform, platformConfig);
            console.log('Returning mock response due to API error');
            return mockPost;
        }
    }

    generateMockPost(content, platform, platformConfig) {
        // Generate a mock social media post for local development
        const platformEmojis = {
            linkedin: '💼🚀',
            instagram: '📸✨', 
            twitter: '🐦💭',
            facebook: '👥💬'
        };
        
        const emoji = platformEmojis[platform] || '📱';
        const truncatedContent = content.length > 100 ? content.substring(0, 100) + '...' : content;
        
        return `${emoji} Here's a ${platformConfig.name} post based on: "${truncatedContent}" \n\n[This is a mock response for local development] \n\n#SocialMedia #${platformConfig.name.replace(/[^a-zA-Z0-9]/g, '')}`;
    }

    createPlatformPrompt(content, platform, platformConfig) {
        return `Transform the following content into an engaging ${platformConfig.name} post that follows the platform's best practices and stays within ${platformConfig.maxLength} characters.

Content: ${content}

Platform: ${platformConfig.name}
Character limit: ${platformConfig.maxLength}

Requirements:
- Make it engaging and platform-appropriate
- Use relevant hashtags for ${platformConfig.name}
- Match the tone and style typical for ${platformConfig.name}
- Stay within the character limit
- For LinkedIn: Professional tone, industry insights, thought leadership
- For Instagram: Visual storytelling, lifestyle focused, emoji-friendly
- For X (Twitter): Concise, conversational, trending topics
- For Facebook: Community-focused, discussion-starting, personal connection

Return only the post content, no explanations.`;
    }

    async generateEmbedding(text) {
        try {
            // Check if we're in local mock mode
            if (this.isLocalMode) {
                // Return mock embedding for local development
                return Array.from({length: 1536}, () => Math.random() - 0.5);
            }
            
            // Get access token for managed identity
            const accessToken = await this.getAccessToken();
            
            // Make direct API call to Azure OpenAI
            const response = await fetch(`${this.endpoint}/openai/deployments/${this.embeddingDeployment}/embeddings?api-version=2024-08-01-preview`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    input: text
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Azure OpenAI Embeddings API error:', response.status, errorText);
                throw new Error(`Embeddings API request failed: ${response.status} ${errorText}`);
            }

            const result = await response.json();
            return result.data[0]?.embedding || [];
        } catch (error) {
            console.error('Embedding API error:', error);
            // Return mock embedding on error
            return Array.from({length: 1536}, () => Math.random() - 0.5);
        }
    }
}

const openAIService = new OpenAIService();
module.exports = { openAIService };