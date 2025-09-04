@description('Primary location for all resources')
param location string

@description('Resource tags')
param tags object = {}

@description('Storage account name')
param name string

// Storage account for Functions deployment (FC1 requirement)
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    // CRITICAL: Disable shared key access for enterprise compliance
    allowSharedKeyAccess: false
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    accessTier: 'Hot'
    allowBlobPublicAccess: false
  }
}

// Blob container for deployment packages
resource deploymentContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/deploymentpackage'
  properties: {
    publicAccess: 'None'
  }
}

output name string = storageAccount.name
output resourceId string = storageAccount.id
output primaryEndpoints object = storageAccount.properties.primaryEndpoints
