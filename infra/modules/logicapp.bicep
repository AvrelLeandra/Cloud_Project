param location string
param logicAppName string
param alertRecipientEmail string

resource logicApp 'Microsoft.Logic/workflows@2019-05-01' = {
  name: logicAppName
  location: location
  properties: {
    state: 'Enabled'
    definition: {
      '$schema': 'https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#'
      contentVersion: '1.0.0.0'
      triggers: {
        manual: {
          type: 'Request'
          kind: 'Http'
          inputs: {
            schema: {
              type: 'object'
              properties: {
                vehicle_id: { type: 'string' }
                alert_type: { type: 'string' }
                severity: { type: 'string' }
                failure_risk_score: { type: 'number' }
                details: { type: 'string' }
              }
            }
          }
        }
      }
      actions: {
        SendAlertNotification: {
          type: 'Http'
          inputs: {
            method: 'POST'
            uri: 'https://httpbin.org/post'
            body: {
              to: alertRecipientEmail
              subject: 'CRITICAL FLEET ALERT: Vehicle @{triggerBody()?[\'vehicle_id\']}'
              body: 'High Risk Detected (@{triggerBody()?[\'failure_risk_score\']}): @{triggerBody()?[\'details\']}'
            }
          }
        }
      }
    }
  }
}

output logicAppId string = logicApp.id
output endpointUrl string = listCallbackUrl(resourceId('Microsoft.Logic/workflows/triggers', logicAppName, 'manual'), '2019-05-01').value
