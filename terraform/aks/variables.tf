variable "resource_group_name" {
  description = "Name of the existing Azure resource group that will contain the AKS cluster."
  type        = string
  default     = "viktor-rg"
}

variable "cluster_name" {
  description = "Name of the AKS cluster."
  type        = string
  default     = "aks-devops-expensy"
}

variable "dns_prefix" {
  description = "DNS prefix used by the AKS API server."
  type        = string
  default     = "devops-expensy"
}

variable "kubernetes_version" {
  description = "AKS Kubernetes version. Leave null to use Azure's default version for the region."
  type        = string
  default     = null
}

variable "node_count" {
  description = "Number of nodes in the default node pool."
  type        = number
  default     = 1
}

variable "vm_size" {
  description = "VM size for the single AKS node pool."
  type        = string
  default     = "Standard_B2s"
}

variable "tags" {
  description = "Tags applied to Azure resources."
  type        = map(string)
  default = {
    project     = "devops-expensy"
    environment = "dev"
    managed_by  = "terraform"
  }
}
