param location string
param functionAppName string
param storageAccountName string
param cosmosDbConnectionStringSecretUri string

resource serverfarm 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${functionAppName}-plan'
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {}
}

resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: serverfarm.id
    siteConfig: {
      pythonVersion: '3.10'
      appSettings: [
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'python'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'COSMOS_DB_CONNECTION_STRING'
          value: cosmosDbConnectionStringSecretUri
        }
      ]
    }
  }
}

output functionAppHostName string = functionApp.properties.defaultHostName
output functionAppId string = functionApp.id
