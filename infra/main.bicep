// Main infrastructure template for Social Media Post Generator
// Static Web Apps + Azure Functions + Azure OpenAI + Cosmos DB with managed identity

targetScope = 'resourceGroup'

@minLength(1)
@maxLength(64)
@description('Name of the the environment which is used to generate a short unique hash used in all resources.')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

@description('Location for OpenAI resource')
@allowed(['eastus', 'eastus2', 'northcentralus', 'southcentralus', 'westus', 'westus3', 'swedencentral'])
param openAiResourceLocation string = 'eastus'

// OpenAI Model Configuration - Based on documentation research
@description('The OpenAI model deployment name for primary GPT model')
param openAiModelName string = 'gpt-4o'

@description('The OpenAI model version for primary GPT model')
param openAiModelVersion string = '2024-11-20'

@description('The OpenAI model deployment name for cost-effective model')
param openAiMiniModelName string = 'gpt-4o-mini'

@description('The OpenAI model version for cost-effective model')
param openAiMiniModelVersion string = '2024-07-18'

@description('The OpenAI embedding model deployment name')
param openAiEmbeddingModelName string = 'text-embedding-3-small'

@description('The OpenAI embedding model version')
param openAiEmbeddingModelVersion string = '1'

@description('Id of the user or app to assign application roles')
param principalId string = ''

// Generate a unique token for resource names
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))
var tags = { 'azd-env-name': environmentName }

// Import modules
module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring'
  params: {
    location: location
    tags: tags
    logAnalyticsName: 'logs-${resourceToken}'
    applicationInsightsName: 'appi-${resourceToken}'
  }
}

module storage 'modules/storage.bicep' = {
  name: 'storage'
  params: {
    location: location
    tags: tags
    name: 'st${resourceToken}'
  }
}

module keyVault 'modules/keyvault.bicep' = {
  name: 'keyVault'
  params: {
    location: location
    tags: tags
    name: 'kv-${resourceToken}'
    principalId: principalId
  }
}

module cosmosDb 'modules/cosmos.bicep' = {
  name: 'cosmosDb'
  params: {
    location: location
    tags: tags
    accountName: 'cosmos-${resourceToken}'
  }
}

module openAi 'modules/openai.bicep' = {
  name: 'openAi'
  params: {
    location: openAiResourceLocation
    tags: tags
    name: 'openai-${resourceToken}'
    primaryModelName: openAiModelName
    primaryModelVersion: openAiModelVersion
    miniModelName: openAiMiniModelName
    miniModelVersion: openAiMiniModelVersion
    embeddingModelName: openAiEmbeddingModelName
    embeddingModelVersion: openAiEmbeddingModelVersion
  }
}

module functions 'modules/functions.bicep' = {
  name: 'functions'
  params: {
    location: location
    tags: tags
    applicationInsightsConnectionString: monitoring.outputs.applicationInsightsConnectionString
    appServicePlanName: 'plan-${resourceToken}'
    functionAppName: 'func-${resourceToken}'
    storageAccountName: storage.outputs.name
    openAiEndpoint: openAi.outputs.endpoint
    cosmosEndpoint: cosmosDb.outputs.endpoint
    primaryModelDeploymentName: 'gpt-4o'
    miniModelDeploymentName: 'gpt-4o-mini'
    embeddingModelDeploymentName: 'text-embedding-3-small'
  }
}

module staticWebApp 'modules/staticwebapp.bicep' = {
  name: 'staticWebApp'
  params: {
    location: location
    tags: tags
    name: 'swa-${resourceToken}'
  }
}

// RBAC role assignments for Functions managed identity
module roleAssignments 'modules/security.bicep' = {
  name: 'roleAssignments'
  params: {
    functionAppPrincipalId: functions.outputs.functionAppIdentityPrincipalId
    openAiResourceId: openAi.outputs.resourceId
    cosmosAccountResourceId: cosmosDb.outputs.resourceId
    storageAccountResourceId: storage.outputs.resourceId
  }
}

// Output the key values for azd
output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output AZURE_FUNCTION_APP_NAME string = functions.outputs.functionAppName
output AZURE_STATIC_WEB_APP_NAME string = staticWebApp.outputs.name
output AZURE_OPENAI_ENDPOINT string = openAi.outputs.endpoint
output AZURE_COSMOS_ENDPOINT string = cosmosDb.outputs.endpoint
output API_BASE_URL string = functions.outputs.functionAppUrl
output COSMOS_DB_ENDPOINT string = cosmosDb.outputs.endpoint
output COSMOS_DB_DATABASE string = 'socialmedia'
output COSMOS_DB_CONTAINER string = 'preferences'
output AZURE_OPENAI_GPT_DEPLOYMENT string = 'gpt-4o'
output AZURE_OPENAI_GPT_MINI_DEPLOYMENT string = 'gpt-4o-mini'
output AZURE_OPENAI_EMBEDDING_DEPLOYMENT string = 'text-embedding-3-small'
