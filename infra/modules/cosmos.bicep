param location string
param accountName string
param databaseName string = 'FleetDatabase'

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-09-15' = {
  name: accountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: location
        failoverPriority: 0
      }
    ]
    capabilities: [
      {
        name: 'EnableServerless'
      }
    ]
  }
}

resource cosmosDb 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-09-15' = {
  parent: cosmosAccount
  name: databaseName
  properties: {
    resource: {
      id: databaseName
    }
  }
}

resource telemetryContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-09-15' = {
  parent: cosmosDb
  name: 'telemetry'
  properties: {
    resource: {
      id: 'telemetry'
      partitionKey: {
        paths: [
          '/vehicle_id'
        ]
        kind: 'Hash'
      }
    }
  }
}

resource alertsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-09-15' = {
  parent: cosmosDb
  name: 'alerts'
  properties: {
    resource: {
      id: 'alerts'
      partitionKey: {
        paths: [
          '/vehicle_id'
        ]
        kind: 'Hash'
      }
    }
  }
}

output cosmosDbEndpoint string = cosmosAccount.properties.documentEndpoint
output connectionString string = cosmosAccount.listConnectionStrings().connectionStrings[0].connectionString
