@description('Primary location for Azure OpenAI resource')
param location string

@description('Resource tags')
param tags object = {}

@description('Azure OpenAI service name')
param name string

@description('Primary GPT model name')
param primaryModelName string

@description('Primary GPT model version')
param primaryModelVersion string

@description('Mini GPT model name')
param miniModelName string

@description('Mini GPT model version')
param miniModelVersion string

@description('Embedding model name')
param embeddingModelName string

@description('Embedding model version')
param embeddingModelVersion string

// Azure OpenAI service with managed identity (no local auth)
resource openAI 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: 'S0'
  }
  kind: 'OpenAI'
  properties: {
    customSubDomainName: name
    // CRITICAL: Disable local authentication for enterprise compliance
    disableLocalAuth: true
    publicNetworkAccess: 'Enabled'
  }
}

// Primary GPT model deployment (gpt-4o)
resource primaryGptDeployment 'Microsoft.CognitiveServices/accounts/deployments@2023-05-01' = {
  parent: openAI
  name: 'gpt-4o'
  sku: {
    name: 'Standard'
    capacity: 10
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: primaryModelName
      version: primaryModelVersion
    }
  }
}

// Cost-effective GPT model deployment (gpt-4o-mini)
resource miniGptDeployment 'Microsoft.CognitiveServices/accounts/deployments@2023-05-01' = {
  parent: openAI
  name: 'gpt-4o-mini'
  dependsOn: [primaryGptDeployment]
  sku: {
    name: 'Standard'
    capacity: 10
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: miniModelName
      version: miniModelVersion
    }
  }
}

// Embedding model deployment
resource embeddingDeployment 'Microsoft.CognitiveServices/accounts/deployments@2023-05-01' = {
  parent: openAI
  name: 'text-embedding-3-small'
  dependsOn: [miniGptDeployment]
  sku: {
    name: 'Standard'
    capacity: 10
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: embeddingModelName
      version: embeddingModelVersion
    }
  }
}

output endpoint string = openAI.properties.endpoint
output resourceId string = openAI.id
output name string = openAI.name
