const { app } = require('@azure/functions');

app.http('extractUrl', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'extract-url',
    handler: async (request, context) => {
        context.log('Extract URL function triggered');

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
            const { url } = body;

            if (!url) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({ error: 'URL is required' })
                };
            }

            // Validate URL format
            let parsedUrl;
            try {
                parsedUrl = new URL(url);
            } catch (error) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid URL format' })
                };
            }

            // Simplified content extraction using native fetch
            try {
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    signal: AbortSignal.timeout(10000) // 10 second timeout
                });

                if (!response.ok) {
                    return {
                        status: 400,
                        headers,
                        body: JSON.stringify({ 
                            error: `Failed to fetch URL: ${response.status} ${response.statusText}` 
                        })
                    };
                }

                const html = await response.text();
                
                // Simple content extraction without external dependencies
                // Extract title using regex
                const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
                const title = titleMatch ? titleMatch[1].trim() : '';

                // Extract meta description
                const descMatch = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"']*)["\'][^>]*>/i);
                const description = descMatch ? descMatch[1].trim() : '';

                // Simple text extraction - remove HTML tags and clean up
                let content = html
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // Remove styles
                    .replace(/<[^>]*>/g, ' ')                         // Remove all HTML tags
                    .replace(/\s+/g, ' ')                            // Normalize whitespace
                    .trim();

                // Limit content length
                const maxLength = 1500;
                if (content.length > maxLength) {
                    content = content.substring(0, maxLength) + '...';
                }

                // Combine extracted content
                let extractedContent = '';
                if (title) extractedContent += `Title: ${title}\n\n`;
                if (description) extractedContent += `Description: ${description}\n\n`;
                if (content) extractedContent += `Content: ${content}`;

                if (!extractedContent.trim()) {
                    extractedContent = `Content from ${parsedUrl.hostname}: Unable to extract meaningful content from this page.`;
                }

                return {
                    status: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        url,
                        extractedContent: extractedContent.trim(),
                        metadata: {
                            title,
                            description,
                            hostname: parsedUrl.hostname,
                            contentLength: content.length,
                            timestamp: new Date().toISOString()
                        }
                    })
                };

            } catch (fetchError) {
                context.log('Fetch error:', fetchError);
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'Failed to fetch URL content',
                        message: fetchError.message
                    })
                };
            }

        } catch (error) {
            context.log('Error in extract-url function:', error);
            return {
                status: 500,
                headers,
                body: JSON.stringify({
                    error: 'Failed to extract content from URL',
                    message: error.message
                })
            };
        }
    }
});