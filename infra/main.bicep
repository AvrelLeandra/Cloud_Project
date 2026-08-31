targetScope = 'subscription'

@description('Location for all resources')
param location string = 'eastus'

@description('Environment name (dev, test, prod)')
param environment string = 'dev'

@description('Prefix for resource names')
param resourcePrefix string = 'smartfleet'

@description('Administrator email for Logic App alert notifications')
param alertRecipientEmail string = 'fleet-admin@example.com'

resource rg 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: 'rg-${resourcePrefix}-${environment}'
  location: location
}

module keyvault 'modules/keyvault.bicep' = {
  name: 'keyvaultDeployment'
  scope: rg
  params: {
    location: location
    keyVaultName: '${resourcePrefix}-kv-${environment}'
  }
}

module storage 'modules/storage.bicep' = {
  name: 'storageDeployment'
  scope: rg
  params: {
    location: location
    storageAccountName: '${resourcePrefix}st${environment}'
  }
}

module iothub 'modules/iothub.bicep' = {
  name: 'iothubDeployment'
  scope: rg
  params: {
    location: location
    iotHubName: '${resourcePrefix}-hub-${environment}'
  }
}

module cosmos 'modules/cosmos.bicep' = {
  name: 'cosmosDeployment'
  scope: rg
  params: {
    location: location
    accountName: '${resourcePrefix}-cosmos-${environment}'
    databaseName: 'FleetDatabase'
  }
}

module functions 'modules/functions.bicep' = {
  name: 'functionsDeployment'
  scope: rg
  params: {
    location: location
    functionAppName: '${resourcePrefix}-func-${environment}'
    storageAccountName: storage.outputs.storageAccountName
    cosmosDbConnectionStringSecretUri: cosmos.outputs.connectionString
  }
}

module ml 'modules/ml.bicep' = {
  name: 'mlDeployment'
  scope: rg
  params: {
    location: location
    workspaceName: '${resourcePrefix}-ml-${environment}'
    storageAccountId: storage.outputs.storageAccountId
    keyVaultId: keyvault.outputs.keyVaultId
  }
}

module openai 'modules/openai.bicep' = {
  name: 'openaiDeployment'
  scope: rg
  params: {
    location: location
    accountName: '${resourcePrefix}-oai-${environment}'
  }
}

module logicapp 'modules/logicapp.bicep' = {
  name: 'logicappDeployment'
  scope: rg
  params: {
    location: location
    logicAppName: '${resourcePrefix}-logic-${environment}'
    alertRecipientEmail: alertRecipientEmail
  }
}

module apim 'modules/apim.bicep' = {
  name: 'apimDeployment'
  scope: rg
  params: {
    location: location
    apimServiceName: '${resourcePrefix}-apim-${environment}'
    publisherEmail: alertRecipientEmail
  }
}

output iotHubConnectionString string = iothub.outputs.iotHubConnectionString
output cosmosDbEndpoint string = cosmos.outputs.cosmosDbEndpoint
output functionAppHostName string = functions.outputs.functionAppHostName
output mlWorkspaceName string = ml.outputs.workspaceName
output openAiEndpoint string = openai.outputs.openAiEndpoint
