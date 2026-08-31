param location string
param workspaceName string
param storageAccountId string
param keyVaultId string

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${workspaceName}-insights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
  }
}

resource mlWorkspace 'Microsoft.MachineLearningServices/workspaces@2023-08-01-preview' = {
  name: workspaceName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    friendlyName: 'Smart Fleet Machine Learning Workspace'
    storageAccount: storageAccountId
    keyVault: keyVaultId
    applicationInsights: appInsights.id
  }
}

output workspaceName string = mlWorkspace.name
output workspaceId string = mlWorkspace.id
