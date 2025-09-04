# Social Media Post Generator - Azure Deployment

This project has been **successfully converted** from a GitHub Spark application to a fully Azure-native solution using Azure Developer CLI (azd). The application generates AI-powered social media posts for multiple platforms with enterprise-grade security and scalability.

## 🚀 Conversion Summary

### Original GitHub Spark Architecture
- **Frontend**: React/TypeScript with Vite and shadcn/ui components
- **AI Features**: `spark.llmPrompt()` for content generation
- **Data Storage**: `useKV()` for local state persistence
- **Deployment**: GitHub Spark hosting

### New Azure Architecture
- **Frontend**: Azure Static Web Apps with React/TypeScript
- **Backend API**: Azure Functions v4 (Flex Consumption Plan FC1)
- **AI Services**: Azure OpenAI Service (GPT-4o, GPT-4o-mini, embeddings)
- **Database**: Azure Cosmos DB (Serverless, NoSQL)
- **Security**: Managed Identity (no API keys in client code)
- **Infrastructure**: Bicep with Azure Verified Modules

## 🏗️ Azure Services Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Static Web Apps │────│ Azure Functions │────│ Azure OpenAI    │
│ (React Frontend)│    │ (v4 API Backend)│    │ (GPT-4o Models) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Key Vault       │    │ Cosmos DB       │    │ App Insights    │
│ (Secrets)       │    │ (NoSQL/Serverless)│  │ (Monitoring)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛡️ Enterprise Security Features

- ✅ **Managed Identity Authentication** - No API keys stored in client code
- ✅ **Azure Policy Compliance** - Disabled local authentication methods
- ✅ **RBAC Security** - Role-based access control for all services
- ✅ **Key Vault Integration** - Secure secret management
- ✅ **HTTPS Enforcement** - End-to-end encryption
- ✅ **CORS Configuration** - Secure cross-origin requests

## 🔄 Spark to Azure Migration Details

### AI Function Conversions
| Original Spark Function | Azure Replacement | Implementation |
|-------------------------|-------------------|----------------|
| `spark.llmPrompt()` | Azure Functions `/api/chat` | Azure OpenAI Chat Completions |
| `spark.generateText()` | Azure Functions `/api/chat` | GPT-4o model with prompts |
| `spark.analyzeContent()` | Azure Functions `/api/extract-url` | Content analysis API |
| `spark.embedding()` | Azure Functions `/api/embedding` | text-embedding-3-small |

### Data Storage Conversions
| Original Spark Storage | Azure Replacement | Implementation |
|------------------------|-------------------|----------------|
| `useKV('user-prefs')` | Azure Functions `/api/data` | Cosmos DB NoSQL documents |
| `useKV('saved-posts')` | Azure Functions `/api/data` | Cosmos DB with query support |
| Local state persistence | Cosmos DB serverless | Global, scalable data storage |

## 🔧 Local Development

### Prerequisites
- Node.js 20+
- Azure Functions Core Tools v4
- Azure CLI (for deployment)

### Running Locally

1. **Start Azure Functions API**:
   ```bash
   cd api
   func start
   ```
   - Runs on `http://localhost:7071`
   - Uses mock services for offline development
   - No Azure credentials required for local testing

2. **Start Frontend Development Server**:
   ```bash
   npm run dev
   ```
   - Runs on `http://localhost:5173`
   - Automatically connects to local Functions API
   - Full functionality with mock AI responses

### Local Development Features
- 🎭 **Mock OpenAI Service** - Generates realistic mock social media posts
- 💾 **In-Memory Storage** - Mock Cosmos DB using JavaScript Map
- 🔧 **Environment Detection** - Automatically switches between local/production
- 🚀 **Hot Reload** - Frontend and backend support live reloading

## 🚀 Azure Deployment

### Prerequisites
1. **Install Azure Developer CLI**:
   ```bash
   # macOS
   brew tap azure/azd && brew install azd
   
   # Windows
   winget install microsoft.azd
   ```

2. **Login to Azure**:
   ```bash
   azd auth login
   ```

### Deploy to Azure

1. **Initialize Environment**:
   ```bash
   azd init
   # Choose existing template: social-media-post-generator
   ```

2. **Provision Infrastructure**:
   ```bash
   azd provision
   # Creates all Azure resources with Bicep templates
   ```

3. **Deploy Application**:
   ```bash
   azd deploy
   # Deploys frontend to Static Web Apps
   # Deploys backend to Azure Functions
   ```

4. **One-Command Deployment**:
   ```bash
   azd up
   # Combines provision + deploy in single command
   ```

### Azure Resources Created
- **Resource Group**: `rg-social-media-post-generator-{env}`
- **Static Web Apps**: Frontend hosting with global CDN
- **Azure Functions**: Serverless API backend (FC1 Flex Consumption)
- **Azure OpenAI**: GPT-4o and embedding models
- **Cosmos DB**: Serverless NoSQL database
- **Key Vault**: Secure configuration management
- **Application Insights**: Monitoring and telemetry
- **Storage Account**: Functions deployment storage

## 📁 Project Structure

```
├── src/                           # React frontend (unchanged)
│   ├── components/ui/            # shadcn/ui components
│   ├── hooks/useAzureData.tsx   # Converted from useKV to Azure API
│   └── App.tsx                  # Updated to use Azure Functions API
├── api/                          # Azure Functions backend (NEW)
│   ├── src/
│   │   ├── functions/           # Individual function endpoints
│   │   │   ├── health.js       # Health check endpoint
│   │   │   ├── chat.js         # AI content generation
│   │   │   ├── data.js         # Data persistence API
│   │   │   └── extractUrl.js   # URL content extraction
│   │   └── services/           # Business logic services
│   │       ├── openai.js       # Azure OpenAI integration
│   │       └── cosmos.js       # Cosmos DB integration
│   ├── host.json              # Azure Functions configuration
│   ├── local.settings.json    # Local development settings
│   └── package.json           # Backend dependencies
├── infra/                       # Bicep infrastructure (NEW)
│   ├── main.bicep             # Main infrastructure template
│   ├── main.parameters.json   # Deployment parameters
│   └── modules/               # Reusable Bicep modules
│       ├── staticWebApp.bicep
│       ├── functionApp.bicep
│       ├── openai.bicep
│       └── cosmosdb.bicep
├── azure.yaml                  # Azure Developer CLI configuration
├── .env.local                  # Local development environment
└── README.md                   # This file
```

## 🔍 API Endpoints

### Azure Functions Backend
| Endpoint | Method | Description | Spark Equivalent |
|----------|--------|-------------|------------------|
| `/api/health` | GET | Health check | N/A |
| `/api/chat` | POST | Generate social media posts | `spark.llmPrompt()` |
| `/api/data/{key}` | GET/POST/DELETE | Data persistence | `useKV()` |
| `/api/extract-url` | POST | Extract content from URLs | Custom logic |

### Request/Response Examples

**Generate Social Media Post**:
```bash
curl -X POST "https://func-h7jmxysiqd6yk.azurewebsites.net/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "AI is revolutionizing healthcare",
    "platforms": ["linkedin"],
    "isUrl": false
  }'
```

**Data Persistence**:
```bash
# Save data
curl -X POST "https://func-h7jmxysiqd6yk.azurewebsites.net/api/data/user-prefs?userId=default" \
  -H "Content-Type: application/json" \
  -d '{"value": {"theme": "dark", "language": "en"}}'

# Retrieve data  
curl -X GET "https://func-h7jmxysiqd6yk.azurewebsites.net/api/data/user-prefs?userId=default"
```

## 🎯 Features

### Original Spark Features (Preserved)
- ✅ Multi-platform social media post generation
- ✅ Platform-specific character limits and formatting
- ✅ Content extraction from URLs
- ✅ User preferences persistence
- ✅ Post history and templates
- ✅ Real-time character counting
- ✅ Copy to clipboard functionality

### New Azure Features (Enhanced)
- 🚀 **Global Scalability** - Azure Static Web Apps CDN
- 🔒 **Enterprise Security** - Managed identity and Key Vault
- 📊 **Monitoring** - Application Insights telemetry
- 💰 **Cost Optimization** - Serverless consumption-based pricing
- 🌍 **Global Availability** - Multi-region deployment support
- 🔄 **CI/CD Ready** - Azure DevOps and GitHub Actions integration

## 🛠️ Development Commands

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
```

### Backend (Azure Functions)
```bash
cd api
func start           # Start Functions runtime locally
func azure functionapp list  # List deployed function apps
func logs            # Stream deployment logs
```

### Infrastructure
```bash
azd provision --preview    # Preview infrastructure changes
azd provision             # Deploy infrastructure
azd deploy                # Deploy application code
azd down                  # Delete all Azure resources
azd monitor               # Open Application Insights
```

## 🔧 Environment Variables

### Local Development (`.env.local`)
```bash
VITE_API_URL=http://localhost:7071/api
VITE_ENVIRONMENT=development
```

### Azure Functions Local (`api/local.settings.json`)
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AZURE_OPENAI_ENDPOINT": "",
    "AZURE_OPENAI_GPT_DEPLOYMENT": "gpt-4o",
    "AZURE_OPENAI_GPT_MINI_DEPLOYMENT": "gpt-4o-mini",
    "AZURE_OPENAI_EMBEDDING_DEPLOYMENT": "text-embedding-3-small",
    "COSMOS_DB_ENDPOINT": "",
    "COSMOS_DB_DATABASE": "socialmedia",
    "COSMOS_DB_CONTAINER": "preferences"
  }
}
```

> **Note**: Leave Azure service endpoints empty for local development - the functions will automatically use mock services when endpoints are not configured.

### Production (Managed by Azure)
All production environment variables are automatically configured through:
- Azure Key Vault references
- Managed Identity authentication
- Bicep template outputs

## 📋 Deployment Checklist

### ✅ Pre-Deployment Validation
- [x] All Spark dependencies removed from package.json
- [x] `spark.llmPrompt()` calls replaced with `/api/chat`
- [x] `useKV()` calls replaced with `/api/data`
- [x] Frontend build passes: `npm run build` ✅
- [x] Azure Functions start locally: `func start` ✅
- [x] All API endpoints respond correctly
- [x] Mock services work for local development
- [x] Environment variables configured

### ✅ Infrastructure Validation
- [x] main.parameters.json exists and is properly configured
- [x] All Bicep templates validated
- [x] Azure Functions use FC1 Flex Consumption plan
- [x] Managed identity configured for all services
- [x] Azure Policy compliance (no local authentication)
- [x] RBAC roles assigned correctly

### ✅ Post-Deployment Testing
- [x] Static Web Apps deployment successful
- [x] Azure Functions deployment successful  
- [x] OpenAI service responding correctly (managed identity working)
- [x] Cosmos DB connections working
- [x] End-to-end functionality verified
- [x] Application Insights receiving telemetry
- [x] Data persistence working (selected platforms, saved generations)
- [x] Real AI content generation (not mock responses)
- [x] Error handling and defensive coding implemented

## 🐛 Troubleshooting

### Common Issues

**Azure Policy Violations**:
```
RequestDisallowedByPolicy: Local authentication methods are not allowed
```
**Solution**: Ensure `disableLocalAuth: true` in all Bicep templates

**Missing Parameters Error**:
```
The template deployment failed: main.parameters.json not found
```
**Solution**: Verify `infra/main.parameters.json` exists with all required parameters

**Functions Runtime Error**:
```
Unable to find project root. Expecting to find host.json
```
**Solution**: Ensure `api/host.json` exists and run from correct directory

**OpenAI Model Deprecation**:
```
The model version '0613' for model 'gpt-4' is not supported
```
**Solution**: Update Bicep templates with current model versions from Azure documentation

**Runtime Error on History Clear**:
```
Cannot read properties of undefined (reading 'toLowerCase')
```
**Solution**: This was fixed with defensive coding in the search filtering logic to handle undefined values

### Get Support
- Azure Issues: Check Application Insights for detailed error logs
- Local Development: Check browser console and Functions runtime logs
- Infrastructure: Use `azd provision --preview` to validate templates

## 🎉 Success! Conversion Complete

This GitHub Spark application has been successfully converted to a production-ready Azure solution with:

- ✅ **Complete Feature Parity** - All original functionality preserved
- ✅ **Enterprise Security** - Managed identity and policy compliance
- ✅ **Global Scalability** - Azure global infrastructure
- ✅ **Cost Optimization** - Serverless consumption-based pricing
- ✅ **Developer Experience** - Full local development support
- ✅ **Production Ready** - Monitoring, logging, and CI/CD ready

**Live Application URLs**:
- **Frontend**: https://red-sky-0fdeb1e0f.1.azurestaticapps.net/
- **API Backend**: https://func-h7jmxysiqd6yk.azurewebsites.net/
- **Resource Group**: rg-spark-socal

**Next Steps**:
1. ✅ ~~Run `azd up` to deploy to Azure~~ **COMPLETED**
2. Configure custom domain (optional)
3. Set up CI/CD pipelines
4. Monitor usage and costs in Azure portal
5. Review `LEARNINGS.md` for conversion insights

Welcome to Azure! 🚀