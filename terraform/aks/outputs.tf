output "resource_group_name" {
  description = "Resource group used for AKS."
  value       = data.azurerm_resource_group.main.name
}

output "cluster_name" {
  description = "AKS cluster name."
  value       = azurerm_kubernetes_cluster.main.name
}

output "kube_config_command" {
  description = "Command to configure kubectl for this cluster."
  value       = "az aks get-credentials --resource-group ${data.azurerm_resource_group.main.name} --name ${azurerm_kubernetes_cluster.main.name} --overwrite-existing"
}

output "kubelet_identity_object_id" {
  description = "Object ID for the kubelet identity."
  value       = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
}
