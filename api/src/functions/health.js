const { app } = require('@azure/functions');

app.http('health', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Health check function triggered');

        // CORS headers
        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        };

        // Handle preflight OPTIONS request
        if (request.method === 'OPTIONS') {
            return { status: 200, headers };
        }

        try {
            // Check environment variables
            const requiredEnvVars = [
                'AZURE_OPENAI_ENDPOINT',
                'AZURE_COSMOS_ENDPOINT',
                'AZURE_OPENAI_GPT_DEPLOYMENT',
                'AZURE_OPENAI_GPT_MINI_DEPLOYMENT',
                'AZURE_OPENAI_EMBEDDING_DEPLOYMENT'
            ];

            const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
            
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                services: {
                    openai: {
                        endpoint: process.env.AZURE_OPENAI_ENDPOINT ? 'configured' : 'missing',
                        deployments: {
                            gpt: process.env.AZURE_OPENAI_GPT_DEPLOYMENT || 'not configured',
                            gptMini: process.env.AZURE_OPENAI_GPT_MINI_DEPLOYMENT || 'not configured',
                            embedding: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'not configured'
                        }
                    },
                    cosmos: {
                        endpoint: process.env.AZURE_COSMOS_ENDPOINT ? 'configured' : 'missing'
                    },
                    functions: {
                        runtime: process.version,
                        environment: process.env.AZURE_FUNCTIONS_ENVIRONMENT || 'local'
                    }
                },
                configuration: {
                    missingEnvVars: missingEnvVars.length > 0 ? missingEnvVars : null
                }
            };

            // Set status based on configuration
            if (missingEnvVars.length > 0) {
                health.status = 'degraded';
            }

            const statusCode = health.status === 'healthy' ? 200 : 503;

            return {
                status: statusCode,
                headers,
                body: JSON.stringify(health)
            };

        } catch (error) {
            context.log('Error in health function:', error);
            return {
                status: 500,
                headers,
                body: JSON.stringify({
                    status: 'unhealthy',
                    error: error.message,
                    timestamp: new Date().toISOString()
                })
            };
        }
    }
});