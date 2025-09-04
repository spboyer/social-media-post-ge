@description('Function App managed identity principal ID')
param functionAppPrincipalId string

@description('Azure OpenAI resource ID')
param openAiResourceId string

@description('Cosmos DB account resource ID')
param cosmosAccountResourceId string

@description('Storage account resource ID')
param storageAccountResourceId string

// Azure OpenAI Cognitive Services OpenAI User role assignment
resource openAiUserRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(openAiResourceId, functionAppPrincipalId, '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd')
  scope: resourceGroup()
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd') // Cognitive Services OpenAI User
    principalId: functionAppPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// Cosmos DB Built-in Data Contributor role assignment (data plane)
resource cosmosDbContributorRole 'Microsoft.DocumentDB/databaseAccounts/sqlRoleAssignments@2024-05-15' = {
  name: guid(cosmosAccountResourceId, functionAppPrincipalId, '00000000-0000-0000-0000-000000000002')
  parent: cosmosDbAccount
  properties: {
    roleDefinitionId: '${cosmosAccountResourceId}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002'
    principalId: functionAppPrincipalId
    scope: cosmosAccountResourceId
  }
}

// Reference to existing Cosmos DB account for data plane role assignment
resource cosmosDbAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' existing = {
  name: split(cosmosAccountResourceId, '/')[8] // Extract account name from resource ID
}

// Storage Blob Data Contributor role assignment for deployment storage
resource storageContributorRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccountResourceId, functionAppPrincipalId, 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
  scope: resourceGroup()
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe') // Storage Blob Data Contributor
    principalId: functionAppPrincipalId
    principalType: 'ServicePrincipal'
  }
}

output openAiRoleAssignmentId string = openAiUserRole.id
output cosmosRoleAssignmentId string = cosmosDbContributorRole.id
output storageRoleAssignmentId string = storageContributorRole.id
