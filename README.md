# Social Media Post Generator

A React-based application that transforms any content into platform-optimized social media posts using Azure AI services.

## Features

- **Multi-Platform Support**: Generate posts for LinkedIn, Instagram, X (Twitter), and Facebook
- **AI-Powered Content**: Leverages Azure OpenAI for intelligent content transformation
- **URL Content Extraction**: Automatically extracts and summarizes content from web pages
- **Persistent History**: Save and manage your generated posts with Azure Cosmos DB
- **Platform Optimization**: Respects character limits and best practices for each platform
- **Modern UI**: Built with React, TypeScript, and shadcn/ui components

## Architecture

- **Frontend**: React + TypeScript + Vite (Azure Static Web Apps)
- **Backend**: Azure Functions (Node.js v4)
- **AI Services**: Azure OpenAI (GPT-4o and text-embedding models)
- **Database**: Azure Cosmos DB (serverless)
- **Monitoring**: Application Insights
- **Security**: Managed Identity for all Azure service connections

## Local Development

### Prerequisites

- Node.js 20+
- Azure CLI
- Azure Developer CLI (azd)
- Azure Functions Core Tools

### Setup

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd social-media-post-generator
   npm install
   cd api && npm install && cd ..
   ```

2. **Configure Environment**:
   ```bash
   cp .env.template .env
   # Edit .env with your Azure resource configurations
   ```

3. **Start Development Servers**:
   ```bash
   # Terminal 1: Start frontend
   npm run dev
   
   # Terminal 2: Start Azure Functions
   cd api && func start
   ```

4. **Access Application**:
   - Frontend: http://localhost:5173
   - API: http://localhost:7071/api

## Azure Deployment

### Deploy with Azure Developer CLI

1. **Initialize Azure Environment**:
   ```bash
   azd auth login
   azd env new <environment-name>
   ```

2. **Deploy Infrastructure and Application**:
   ```bash
   azd up
   ```

3. **Access Deployed Application**:
   ```bash
   azd browse
   ```

### Manual Configuration

If you need to configure Azure resources manually:

1. **Azure OpenAI**:
   - Deploy GPT-4o model for chat completions
   - Deploy text-embedding-3-small for embeddings
   - Configure managed identity access

2. **Azure Cosmos DB**:
   - Create database: `socialmedia`
   - Create containers: `preferences`, `generations`
   - Enable managed identity access

3. **Azure Functions**:
   - Use Flex Consumption plan (FC1)
   - Configure managed identity
   - Set environment variables

## API Endpoints

- `POST /api/chat` - Generate social media content using AI
- `GET /api/data/{key}` - Retrieve user data
- `POST /api/data/{key}` - Store user data
- `DELETE /api/data/{key}` - Delete user data
- `POST /api/extract-url` - Extract content from web URLs
- `GET /api/health` - Health check endpoint

## Environment Variables

### Frontend (Vite)
- `VITE_API_URL` - Azure Functions API base URL
- `VITE_APP_NAME` - Application name
- `VITE_ENVIRONMENT` - Deployment environment

### Backend (Azure Functions)
- `AZURE_OPENAI_ENDPOINT` - Azure OpenAI service endpoint
- `AZURE_OPENAI_DEPLOYMENT_NAME` - Primary GPT model deployment
- `AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME` - Embedding model deployment
- `COSMOS_DB_ENDPOINT` - Cosmos DB account endpoint
- `COSMOS_DB_DATABASE_NAME` - Database name
- `APPLICATIONINSIGHTS_CONNECTION_STRING` - Application Insights telemetry

## Security

- **Managed Identity**: All Azure services use managed identity for authentication
- **No API Keys**: No secrets stored in client-side code
- **HTTPS Only**: All communications encrypted in transit
- **CORS Configuration**: Properly configured for production domains
- **Content Security Policy**: Implemented for additional security

## Monitoring

- **Application Insights**: Tracks application performance and usage
- **Azure Functions Metrics**: Monitor function execution and errors
- **Cosmos DB Metrics**: Track database performance and costs
- **Health Checks**: Automated endpoint monitoring

## Cost Optimization

- **Serverless Architecture**: Pay only for actual usage
- **Cosmos DB Serverless**: Scales automatically with usage
- **Azure Functions FC1**: Optimized for variable workloads
- **Static Web Apps**: Free tier for frontend hosting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the [Issues](../../issues) section
2. Review the deployment logs in Azure Portal
3. Check Application Insights for runtime errors
4. Verify Azure resource configurations
