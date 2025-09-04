@description('Primary location for all resources')
param location string

@description('Resource tags')
param tags object = {}

@description('Application Insights connection string')
param applicationInsightsConnectionString string

@description('App Service Plan name')
param appServicePlanName string

@description('Function App name')
param functionAppName string

@description('Storage account name')
param storageAccountName string

@description('Azure OpenAI endpoint')
param openAiEndpoint string

@description('Cosmos DB endpoint')
param cosmosEndpoint string

@description('Primary model deployment name')
param primaryModelDeploymentName string

@description('Mini model deployment name')
param miniModelDeploymentName string

@description('Embedding model deployment name')
param embeddingModelDeploymentName string

// Flex Consumption Plan (FC1) - MANDATORY for enterprise deployment
resource flexConsumptionPlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: 'FC1'
    tier: 'FlexConsumption'
  }
  properties: {
    reserved: true
  }
}

// Function App with System-Assigned Managed Identity
resource functionApp 'Microsoft.Web/sites@2024-04-01' = {
  name: functionAppName
  location: location
  tags: union(tags, {
    'azd-service-name': 'api'
  })
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: flexConsumptionPlan.id
    reserved: true
    // CRITICAL: functionAppConfig is REQUIRED for FC1 Flex Consumption plans
    functionAppConfig: {
      deployment: {
        storage: {
          type: 'blobContainer'
          value: 'https://${storageAccountName}.blob.${environment().suffixes.storage}/deploymentpackage'
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
        version: '20'
      }
    }
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage__credential'
          value: 'managedidentity'
        }
        {
          name: 'AzureWebJobsStorage__blobServiceUri'
          value: 'https://${storageAccountName}.blob.${environment().suffixes.storage}'
        }
        {
          name: 'AzureWebJobsStorage__queueServiceUri'
          value: 'https://${storageAccountName}.queue.${environment().suffixes.storage}'
        }
        {
          name: 'AzureWebJobsStorage__tableServiceUri'
          value: 'https://${storageAccountName}.table.${environment().suffixes.storage}'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicationInsightsConnectionString
        }
        {
          name: 'APPLICATIONINSIGHTS_AUTHENTICATION_STRING'
          value: 'Authorization=AAD'
        }
        {
          name: 'AZURE_OPENAI_ENDPOINT'
          value: openAiEndpoint
        }
        {
          name: 'AZURE_COSMOS_ENDPOINT'
          value: cosmosEndpoint
        }
        {
          name: 'AZURE_OPENAI_GPT_DEPLOYMENT'
          value: primaryModelDeploymentName
        }
        {
          name: 'AZURE_OPENAI_GPT_MINI_DEPLOYMENT'
          value: miniModelDeploymentName
        }
        {
          name: 'AZURE_OPENAI_EMBEDDING_DEPLOYMENT'
          value: embeddingModelDeploymentName
        }
      ]
      cors: {
        allowedOrigins: ['*']
        supportCredentials: false
      }
      use32BitWorkerProcess: false
      ftpsState: 'Disabled'
    }
    clientAffinityEnabled: false
    publicNetworkAccess: 'Enabled'
    httpsOnly: true
  }
}

// Explicitly disable App Service Authentication to allow anonymous functions
resource functionAppAuthSettings 'Microsoft.Web/sites/config@2024-04-01' = {
  name: 'authsettingsV2'
  parent: functionApp
  properties: {
    platform: {
      enabled: false
    }
    globalValidation: {
      requireAuthentication: false
      unauthenticatedClientAction: 'AllowAnonymous'
    }
    httpSettings: {
      requireHttps: true
      routes: {
        apiPrefix: 'api'
      }
    }
  }
}

output functionAppName string = functionApp.name
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output functionAppIdentityPrincipalId string = functionApp.identity.principalId
