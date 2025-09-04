@description('Primary location for all resources')
param location string

@description('Resource tags')
param tags object = {}

@description('Key Vault name')
param name string

@description('Principal ID to grant access')
param principalId string

// Key Vault for configuration management
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    enabledForDeployment: false
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: false
    tenantId: tenant().tenantId
    accessPolicies: [
      {
        tenantId: tenant().tenantId
        objectId: principalId
        permissions: {
          keys: ['get']
          secrets: ['get']
        }
      }
    ]
    sku: {
      name: 'standard'
      family: 'A'
    }
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

output name string = keyVault.name
output uri string = keyVault.properties.vaultUri
