# PowerShell script to deploy Smart Fleet Azure Infrastructure via Bicep

param (
    [string]$SubscriptionId,
    [string]$Location = "eastus",
    [string]$Environment = "dev"
)

Write-Host "=== Smart Fleet Infrastructure Deployment ===" -ForegroundColor Green

if ($SubscriptionId) {
    Set-AzContext -SubscriptionId $SubscriptionId
}

$DeploymentName = "SmartFleetDeployment-$(Get-Date -Format 'yyyyMMddHHmmss')"

Write-Host "Deploying Bicep template: infra/main.bicep..." -ForegroundColor Yellow
New-AzSubscriptionDeployment `
    -Name $DeploymentName `
    -Location $Location `
    -TemplateFile "infra/main.bicep" `
    -TemplateParameterFile "infra/parameters.json"

Write-Host "Deployment completed successfully!" -ForegroundColor Green
