# Kubernetes Manifests

These manifests deploy the expense app to AKS.

They include:

- Namespace
- ConfigMap
- Secret
- Deployment and Service for MongoDB
- Deployment and Service for Redis
- Deployment and Service for backend
- Deployment and Service for frontend
- NGINX Ingress routing for frontend and backend
- cert-manager ClusterIssuer for Let's Encrypt TLS certificates

## Before Applying

Replace the placeholder image names in:

- `backend.yaml`
- `frontend.yaml`

Use images that AKS can pull from a registry, for example Azure Container Registry or Docker Hub.

Replace the ingress and certificate placeholders:

- `REPLACE_WITH_DOMAIN` in `ingress.yaml`, for example `expensy.example.com`
- `REPLACE_WITH_EMAIL@example.com` in `cluster-issuer.yaml`

The frontend calls the API through the same ingress host. `NEXT_PUBLIC_API_URL` is set to `/`, so browser requests to `/api/...` are routed to the backend by `ingress.yaml`.

## Install Ingress and cert-manager

Install the NGINX ingress controller:

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace
```

Install cert-manager:

```bash
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set crds.enabled=true
```

After the ingress controller is ready, point your domain at its external IP:

```bash
kubectl get svc ingress-nginx-controller -n ingress-nginx
```

## Apply

```bash
kubectl apply -f k8s/
```

## Check Status

```bash
kubectl get pods -n viktor-expensy
kubectl get svc -n viktor-expensy
kubectl get ingress -n viktor-expensy
kubectl get certificate -n viktor-expensy
```

The frontend and backend services are internal `ClusterIP` services. The ingress exposes the app on HTTPS port `443`, routes `/` to the frontend, and routes `/api` to the backend.

## GitHub Actions CI/CD

The workflow in `.github/workflows/deploy.yml` builds the backend and frontend, pushes both images to Azure Container Registry, renders the Kubernetes manifests with the current image tag and domain values, then deploys to AKS.

Create these GitHub repository settings before running it:

- Secret `AZURE_CREDENTIALS`: JSON credentials for an Azure service principal with access to the resource group, AKS cluster, and ACR.
- Variable `APP_DOMAIN`: your ingress hostname, for example `viktor.eastus.cloudapp.azure.com`.
- Variable `CERT_MANAGER_EMAIL`: the email address used for Let's Encrypt certificate registration.

Make sure AKS can pull images from ACR:

```bash
az aks update \
  --resource-group viktor-rg \
  --name viktor-expensy \
  --attach-acr viktorexpensyacr
```
