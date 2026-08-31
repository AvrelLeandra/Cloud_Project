param location string
param apimServiceName string
param publisherEmail string

resource apim 'Microsoft.ApiManagement/service@2022-08-01' = {
  name: apimServiceName
  location: location
  sku: {
    name: 'Developer'
    capacity: 1
  }
  properties: {
    publisherEmail: publisherEmail
    publisherName: 'Smart Fleet Management'
  }
}

output apimId string = apim.id
output gatewayUrl string = apim.properties.gatewayUrl
