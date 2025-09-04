const { app } = require('@azure/functions');
const { openAIService } = require('../services/openai');

const platformConfigs = {
    linkedin: { name: 'LinkedIn', color: 'bg-blue-600', maxLength: 3000, icon: '💼' },
    instagram: { name: 'Instagram', color: 'bg-pink-600', maxLength: 2200, icon: '📸' },
    twitter: { name: 'X (Twitter)', color: 'bg-black', maxLength: 280, icon: '🐦' },
    facebook: { name: 'Facebook', color: 'bg-blue-700', maxLength: 63206, icon: '👥' }
};

app.http('chat', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Chat function triggered');

        // CORS headers
        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        };

        // Handle preflight OPTIONS request
        if (request.method === 'OPTIONS') {
            return { status: 200, headers };
        }

        try {
            const body = await request.json();
            const { content, platforms, isUrl } = body;

            if (!content || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'Missing required fields: content and platforms array'
                    })
                };
            }

            // Process content for each platform
            const posts = {};
            
            for (const platform of platforms) {
                const config = platformConfigs[platform];
                if (!config) {
                    context.log(`Unknown platform: ${platform}`);
                    continue;
                }

                try {
                    const post = await openAIService.generateSocialMediaPost(content, platform, config);
                    posts[platform] = post;
                } catch (error) {
                    context.log(`Error generating post for ${platform}:`, error);
                    posts[platform] = `Error generating post for ${platform}: ${error.message}`;
                }
            }

            return {
                status: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    posts,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        isUrl,
                        platformCount: platforms.length
                    }
                })
            };

        } catch (error) {
            context.log('Error in chat function:', error);
            return {
                status: 500,
                headers,
                body: JSON.stringify({
                    error: 'Internal server error',
                    message: error.message
                })
            };
        }
    }
});