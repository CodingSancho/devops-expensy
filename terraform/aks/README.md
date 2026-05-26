# AKS Terraform

This Terraform stack provisions a small Azure Kubernetes Service cluster for the expense app.

It creates:

- One AKS cluster
- One default node pool
- One small VM node by default

It uses the existing Azure resource group `viktor-rg`.

## Usage

From this directory:

```bash
terraform init
terraform plan
terraform apply
```

After apply finishes, configure `kubectl`:

```bash
az aks get-credentials --resource-group viktor-rg --name aks-devops-expensy --overwrite-existing
kubectl get nodes
```

## Defaults

- Resource group: `viktor-rg`
- Node count: `1`
- VM size: `Standard_B2s`
- Kubernetes version: Azure regional default

To override values, copy the example file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Then edit `terraform.tfvars` before running `terraform plan`.

## Cleanup

```bash
terraform destroy
```
