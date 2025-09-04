const { app } = require('@azure/functions');
const { cosmosService } = require('../services/cosmos');

app.http('data', {
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'data/{key?}',
    handler: async (request, context) => {
        context.log('Data function triggered');

        // CORS headers
        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        };

        // Handle preflight OPTIONS request
        if (request.method === 'OPTIONS') {
            return { status: 200, headers };
        }

        const key = request.params.key;
        const userId = request.query.get('userId') || 'default';

        if (!key) {
            return {
                status: 400,
                headers,
                body: JSON.stringify({ error: 'Key parameter is required' })
            };
        }

        try {
            switch (request.method) {
                case 'GET':
                    const value = await cosmosService.getValue(key, userId);
                    return {
                        status: 200,
                        headers,
                        body: JSON.stringify({
                            success: true,
                            key,
                            value: value || null
                        })
                    };

                case 'POST':
                    let body;
                    try {
                        body = await request.json();
                    } catch (jsonError) {
                        context.log('JSON parsing error:', jsonError);
                        return {
                            status: 400,
                            headers,
                            body: JSON.stringify({ error: 'Invalid JSON in request body' })
                        };
                    }
                    
                    context.log('POST body:', body);
                    const { value: newValue } = body;
                    context.log('Extracted value:', newValue);
                    
                    if (newValue === undefined) {
                        return {
                            status: 400,
                            headers,
                            body: JSON.stringify({ 
                                error: 'Value is required in request body',
                                receivedBody: body,
                                receivedValue: newValue
                            })
                        };
                    }

                    const savedValue = await cosmosService.setValue(key, newValue, userId);
                    return {
                        status: 200,
                        headers,
                        body: JSON.stringify({
                            success: true,
                            key,
                            value: savedValue
                        })
                    };

                case 'DELETE':
                    const deleted = await cosmosService.deleteValue(key, userId);
                    return {
                        status: 200,
                        headers,
                        body: JSON.stringify({
                            success: true,
                            key,
                            deleted
                        })
                    };

                default:
                    return {
                        status: 405,
                        headers,
                        body: JSON.stringify({ error: 'Method not allowed' })
                    };
            }
        } catch (error) {
            context.log('Error in data function:', error);
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