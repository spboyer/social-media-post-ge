# GitHub Spark to Azure azd Conversion: Learnings and Best Practices

This document captures the critical learnings from converting a GitHub Spark social media post generator application to Azure using the Azure Developer CLI (azd). These insights should be incorporated into the Spark azd custom chat mode to prevent common issues and streamline future conversions.

## Table of Contents
1. [Azure Functions Enterprise Security](#azure-functions-enterprise-security)
2. [Infrastructure Requirements](#infrastructure-requirements)
3. [Frontend Code Transformation](#frontend-code-transformation)
4. [Azure Functions Implementation](#azure-functions-implementation)
5. [Static Web Apps Configuration](#static-web-apps-configuration)
6. [Authentication and Managed Identity](#authentication-and-managed-identity)
7. [Deployment and Testing](#deployment-and-testing)
8. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)

## Azure Functions Enterprise Security

### Critical Finding: Managed Identity is MANDATORY
**Issue**: Enterprise Azure environments enforce policies that disable local authentication methods (API keys, connection strings) for security compliance.

**Impact**: 
- Cosmos DB with `disableLocalAuth: true`
- Azure OpenAI with `disableLocalAuth: true` 
- Storage Accounts with `allowSharedKeyAccess: false`

**Solution**: All Azure service connections MUST use managed identity authentication.

```javascript
// ❌ BLOCKED: Direct client-side Azure service access
const openAI = new OpenAIClient(endpoint, new DefaultAzureCredential());

// ✅ REQUIRED: Azure Functions API layer with managed identity
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ prompt: userMessage })
});
```

### Recommendation for Spark azd Mode:
- **Always implement Azure Functions API layer** when converting apps with `spark.llmPrompt()` or `useKV()`
- **Never expose Azure service endpoints** directly to client-side code
- **Default to managed identity** for all Azure service authentication

## Infrastructure Requirements

### Flex Consumption Plan (FC1) is MANDATORY
**Issue**: Azure Functions deployment failures with Y1 dynamic plans in enterprise environments.

**Critical Requirements**:
- **ALWAYS use Flex Consumption plan (FC1)** - NEVER Y1 dynamic plan
- **MUST include functionAppConfig** with deployment.storage configuration
- **Follow Azure Verified Modules (AVM)** patterns

```bicep
// CRITICAL: FC1 Configuration Template
resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: flexConsumptionPlan.id
    functionAppConfig: {
      deployment: {
        storage: {
          type: 'blobContainer'
          value: '${storageAccount.properties.primaryEndpoints.blob}deploymentpackage'
          authentication: {
            type: 'SystemAssignedIdentity'
          }
        }
      }
      scaleAndConcurrency: {
        maximumInstanceCount: 100
        instanceMemoryMB: 2048
      }
      runtime: {
        name: 'node'
        version: '~20'
      }
    }
  }
}
```

### Reference Templates (MANDATORY):
- JavaScript: https://github.com/Azure-Samples/functions-quickstart-javascript-azd/tree/main/infra
- .NET: https://github.com/Azure-Samples/functions-quickstart-dotnet-azd-eventgrid-blob/tree/main/infra

### Recommendation for Spark azd Mode:
- **Use reference templates** as the foundation for all Azure Functions infrastructure
- **Never hardcode infrastructure patterns** - always reference verified samples
- **Include main.parameters.json validation** in deployment workflow

## Frontend Code Transformation

### Complete Spark Dependency Removal Required
**Issue**: Partial removal of Spark dependencies caused build failures and runtime errors.

**Critical Steps**:
1. **Remove ALL Spark packages**: `@github/spark`, `@github/github-spark`
2. **Clean icon dependencies**: Remove unused `@phosphor-icons/react` (Sparkles icon)
3. **Remove configuration files**: `spark.config.js`, `spark.meta.json`
4. **Update useKV wrapper**: Handle React functional state updates properly

```typescript
// Critical Fix: useKV wrapper must handle functional updates
export function useKV<T>(key: string, defaultValue: T): [T, (newData: T | ((prev: T) => T)) => void] {
  const [data, setData] = useAzureData(key, defaultValue);
  
  const setDataWrapper = useCallback((newData: T | ((prev: T) => T)) => {
    if (typeof newData === 'function') {
      const updater = newData as (prev: T) => T;
      const newValue = updater(data);
      setData(newValue).catch(console.error);
    } else {
      setData(newData).catch(console.error);
    }
  }, [setData, data]);
  
  return [data, setDataWrapper];
}
```

### Build Validation is MANDATORY
**Issue**: TypeScript compilation errors prevented deployment.

**Required Process**:
```bash
npm install
npm run build  # MUST PASS WITHOUT ERRORS
npx tsc --noEmit  # Validate TypeScript compilation
```

### Recommendation for Spark azd Mode:
- **Always run build validation** before proceeding with deployment
- **Include comprehensive Spark cleanup checklist** in conversion workflow
- **Provide useKV wrapper template** that handles React patterns correctly

## Azure Functions Implementation

### v4 Programming Model with CommonJS
**Issue**: Module format and registration patterns caused function discovery failures.

**Required Configuration**:
```javascript
// package.json
{
  "type": "commonjs",  // CRITICAL: Not module
  "main": "src/app.js"
}

// src/app.js - Registration pattern
const { app } = require('@azure/functions');

app.http('chat', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'chat',
  handler: require('./functions/chat').handler
});
```

### API Endpoint Requirements for Spark Features
**Critical Mapping**:
- `spark.llmPrompt()` → `POST /api/chat` with `{content, platforms, isUrl}` format
- `useKV()` → `GET/POST/DELETE /api/data/{key}` with `{value}` format
- **Must include OPTIONS** for CORS preflight handling

### Local Development Support
**Issue**: Functions needed to work offline during development.

**Solution Pattern**:
```javascript
const isLocalDev = !process.env.AZURE_OPENAI_ENDPOINT || 
                   process.env.AZURE_OPENAI_ENDPOINT.includes('your-openai-resource');

if (isLocalDev) {
  // Use mock responses for local development
  return this.generateMockPost(content, platform, platformConfig);
}
```

### Recommendation for Spark azd Mode:
- **Provide complete Functions v4 template** with correct module format
- **Include comprehensive API endpoint mapping** for all Spark features
- **Always include local development fallbacks** with mock responses

## Static Web Apps Configuration

### SWA-Functions Integration Issues
**Issue**: Linking Static Web Apps with Azure Functions caused authentication blocking and infinite loops.

**Critical Discovery**: **DO NOT LINK** Static Web Apps with Azure Functions in enterprise environments.

**Required Configuration**:
```json
// staticwebapp.config.json
{
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated", "anonymous"]
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html"
  }
}
```

**Environment Variable Injection**:
```yaml
# azure.yaml hooks
hooks:
  postprovision:
    shell: sh
    run: |
      echo "VITE_API_URL=$API_BASE_URL/api" > .env.production
      echo "VITE_ENVIRONMENT=$AZURE_ENV_NAME" >> .env.production
```

### Recommendation for Spark azd Mode:
- **Always deploy SWA and Functions separately** in enterprise environments
- **Never use SWA-Functions integration** for Spark conversions
- **Include environment variable injection** in azd hooks

## Authentication and Managed Identity

### Azure OpenAI Managed Identity Implementation
**Issue**: Standard OpenAI client doesn't support Azure managed identity properly.

**Required Implementation**:
```javascript
// Direct fetch with managed identity token
async generateSocialMediaPost(content, platform, platformConfig) {
  const accessToken = await this.getAccessToken();
  
  const response = await fetch(`${this.endpoint}/openai/deployments/${this.gptDeployment}/chat/completions?api-version=2024-08-01-preview`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: messages,
      temperature: 0.7,
      max_tokens: 500
    })
  });
}

async getAccessToken() {
  if (this.tokenCache && Date.now() < this.tokenExpiry) {
    return this.tokenCache;
  }
  
  const tokenResponse = await this.credential.getToken('https://cognitiveservices.azure.com/.default');
  this.tokenCache = tokenResponse.token;
  this.tokenExpiry = tokenResponse.expiresOnTimestamp;
  return this.tokenCache;
}
```

### RBAC Role Assignments Required
```bicep
// Essential role assignments
resource openAiUserRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd') // Cognitive Services OpenAI User
    principalId: functionApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource cosmosContributorRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '00000000-0000-0000-0000-000000000002') // Cosmos DB Built-in Data Contributor  
    principalId: functionApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}
```

### Recommendation for Spark azd Mode:
- **Always implement managed identity authentication** for Azure services
- **Use direct fetch calls** instead of SDK clients for Azure OpenAI
- **Include token caching** to optimize performance and avoid rate limits

## Deployment and Testing

### Azure Policy Compliance Issues
**Common Error**: `RequestDisallowedByPolicy: Local authentication methods are not allowed`

**Required Infrastructure Updates**:
```bicep
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  properties: {
    disableLocalAuth: true  // CRITICAL: Required by enterprise policy
  }
}

resource openAI 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  properties: {
    disableLocalAuth: true  // CRITICAL: Required by enterprise policy
  }
}
```

### Model Version Currency
**Issue**: Hardcoded Azure OpenAI model versions become deprecated.

**Solution**: Always check current model availability before deployment.
```bash
# Use documentation search to verify current models
microsoft_docs_search("Azure OpenAI models current GPT-4o latest versions")
```

### API Payload Format Mismatches
**Issue**: Frontend-backend payload format inconsistencies caused empty request bodies.

**Critical Fix**: Ensure useKV wrapper handles React functional state updates:
```typescript
// Issue: setSelectedPlatforms(prev => [...prev, platform]) 
// sent undefined to API because wrapper didn't handle functions

// Solution: Detect and handle functional updates
if (typeof newData === 'function') {
  const updater = newData as (prev: T) => T;
  const newValue = updater(data);
  setData(newValue).catch(console.error);
}
```

### Recommendation for Spark azd Mode:
- **Include policy compliance validation** in deployment workflow
- **Always verify current Azure OpenAI model versions** before deployment
- **Test API payload formats** end-to-end before considering conversion complete

## Common Pitfalls and Solutions

### 1. Missing main.parameters.json
**Error**: `InvalidTemplateDeployment: missing parameters`
**Solution**: Always generate main.parameters.json with azd infrastructure

### 2. Infinite Request Loops
**Issue**: useAzureData hook causing infinite re-renders
**Solution**: Add `hasTriedApi` state to prevent duplicate API calls

### 3. Build Failures from Icon Dependencies
**Issue**: Unused @phosphor-icons/react causing compilation errors
**Solution**: Remove all unused Spark-related dependencies completely

### 4. Runtime Errors from Undefined Checks
**Issue**: `.toLowerCase()` on undefined values after clearing data
**Solution**: Comprehensive defensive coding with null/undefined checks

```typescript
// Defensive filtering pattern
const filteredGenerations = (savedGenerations || []).filter(gen => {
  if (!gen || !gen.content || !gen.platforms) {
    return false;
  }
  const normalizedSearchTerm = (searchTerm || '').toLowerCase();
  return gen.content.toLowerCase().includes(normalizedSearchTerm);
});
```

### 5. Azure Functions Cold Start Issues
**Issue**: Functions not warming up properly in FC1 plan
**Solution**: Include proper health check endpoints and monitoring

## Conversion Checklist for Spark azd Mode

### Pre-Conversion Analysis
- [ ] Identify all `spark.llmPrompt()` usage patterns
- [ ] Identify all `useKV()` usage patterns and data types
- [ ] Analyze AI feature complexity (simple prompts vs. complex workflows)
- [ ] Assess data persistence requirements (simple K-V vs. relational)

### Infrastructure Design
- [ ] Use Azure Verified Module templates for Functions infrastructure
- [ ] Configure FC1 Flex Consumption plan with functionAppConfig
- [ ] Include main.parameters.json in Bicep templates
- [ ] Set disableLocalAuth: true for all Azure services
- [ ] Configure managed identity and RBAC role assignments

### Frontend Transformation
- [ ] Remove ALL Spark dependencies from package.json
- [ ] Delete Spark configuration files (spark.config.js, spark.meta.json)
- [ ] Update useKV wrapper to handle React functional state updates
- [ ] Add defensive coding for undefined/null values
- [ ] Validate TypeScript compilation with `npx tsc --noEmit`
- [ ] Ensure `npm run build` passes without errors

### Azure Functions Implementation
- [ ] Use CommonJS module format (not ES modules)
- [ ] Implement v4 programming model with app.http() registration
- [ ] Create API endpoints for all Spark feature replacements
- [ ] Include local development mock responses
- [ ] Implement managed identity authentication for Azure services
- [ ] Add comprehensive CORS handling

### Deployment and Validation
- [ ] Deploy Static Web Apps and Functions separately (not linked)
- [ ] Include environment variable injection in azd hooks
- [ ] Verify Azure OpenAI model versions are current
- [ ] Test all API endpoints with correct payload formats
- [ ] Validate managed identity authentication works
- [ ] Test complete user workflows end-to-end

### Post-Deployment Testing
- [ ] Verify real AI content generation (not mock responses)
- [ ] Test data persistence across user sessions
- [ ] Validate error handling and fallback mechanisms
- [ ] Confirm no infinite request loops or runtime errors
- [ ] Test clearing/deleting data without errors

## Documentation and Model Verification

### Always Use Documentation Search
Before implementing any Azure OpenAI models:
```bash
microsoft_docs_search("Azure OpenAI models current GPT-4o latest versions")
microsoft_docs_search("Azure OpenAI model retirements deprecation")
microsoft_docs_search("Azure OpenAI regional availability")
```

### Reference Architecture Templates
Always use these as starting points:
- JavaScript Functions: https://github.com/Azure-Samples/functions-quickstart-javascript-azd
- .NET Functions: https://github.com/Azure-Samples/functions-quickstart-dotnet-azd-eventgrid-blob

## Conclusion

The GitHub Spark to Azure azd conversion process requires careful attention to enterprise security requirements, proper infrastructure patterns, and comprehensive code transformation. The most critical success factors are:

1. **Mandatory managed identity** for all Azure service authentication
2. **Azure Functions API layer** required for enterprise security compliance
3. **FC1 Flex Consumption plan** with proper functionAppConfig
4. **Complete Spark dependency removal** with build validation
5. **Comprehensive defensive coding** to prevent runtime errors

By following these learnings and implementing the recommended patterns, future Spark to azd conversions should avoid the common pitfalls encountered in this project and result in production-ready, enterprise-compliant Azure applications.