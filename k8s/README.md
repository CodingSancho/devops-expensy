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
- CPU and memory resource limits
- Horizontal Pod Autoscalers for frontend and backend
- Prometheus and Grafana monitoring through Helm

## Before Applying

Replace the placeholder image names in:

- `backend.yaml`
- `frontend.yaml`

Use images that AKS can pull from a registry, for example Azure Container Registry or Docker Hub.

Replace the ingress and certificate placeholders:

- `REPLACE_WITH_DOMAIN` in `ingress.yaml`, for example `expensy.example.com`
- `REPLACE_WITH_EMAIL@example.com` in `cluster-issuer.yaml`

Create a local Secret manifest from `secret.example.yaml` when applying from your machine:

```bash
cp k8s/secret.example.yaml k8s/secret.yaml
```

Then replace every `change-me` value in `k8s/secret.yaml`. The real `secret.yaml` file is intentionally ignored by git.

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
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/mongo.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/cluster-issuer.yaml
kubectl apply -f k8s/hpa.yaml
```

Autoscaling requires metrics-server. AKS clusters often include it, but if HPA shows `<unknown>` metrics, install it:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

## Check Status

```bash
kubectl get pods -n viktor-expensy
kubectl get svc -n viktor-expensy
kubectl get ingress -n viktor-expensy
kubectl get certificate -n viktor-expensy
kubectl get hpa -n viktor-expensy
```

The frontend and backend services are internal `ClusterIP` services. The ingress exposes the app on HTTPS port `443`, routes `/` to the frontend, and routes `/api` to the backend.

## Autoscaling Demo

The backend and frontend start with one pod. The backend can scale up to five pods, and the frontend can scale up to three pods when average CPU usage goes above 50%.

Open Grafana and use the `Kubernetes / Compute Resources / Namespace (Pods)` dashboard with the namespace set to `viktor-expensy`. This makes the demo understandable for both technical and non-technical viewers: one backend pod receives load, Kubernetes starts more backend pods, and the work is spread across them.

Use terminal commands as a truth check while Grafana is the main presentation view:

```bash
kubectl get hpa -n viktor-expensy -w
```

Generate controlled backend traffic from inside the cluster:

```bash
kubectl run load-test-1 \
  --image=busybox:1.36 \
  --restart=Never \
  -n viktor-expensy \
  -- /bin/sh -c 'while true; do wget -q -O- http://backend:8706/load; sleep 0.3; done'

kubectl run load-test-2 \
  --image=busybox:1.36 \
  --restart=Never \
  -n viktor-expensy \
  -- /bin/sh -c 'while true; do wget -q -O- http://backend:8706/load; sleep 0.3; done'
```

The load-test pods repeatedly call the backend `/load` endpoint, which creates CPU pressure. The HPA should scale the backend from one pod toward five pods. Once the traffic is distributed across the replicas, each backend pod carries a smaller share of the work.

Stop the demo:

```bash
kubectl delete pod load-test-1 load-test-2 -n viktor-expensy --ignore-not-found
```

After the load stops, HPA should scale the deployment back down to one pod after a short cooldown.

## Monitoring

Install Prometheus and Grafana with the community `kube-prometheus-stack` Helm chart:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --values k8s/monitoring-values.yaml
```

Check the monitoring pods:

```bash
kubectl get pods -n monitoring
```

Get the Grafana admin password:

```bash
kubectl get secret monitoring-grafana \
  -n monitoring \
  -o jsonpath="{.data.admin-password}" | base64 --decode
```

Open Grafana locally:

```bash
kubectl port-forward svc/monitoring-grafana 3000:80 -n monitoring
```

Then open `http://localhost:3000` and log in with:

- Username: `admin`
- Password: the decoded password from the previous command

Useful built-in dashboards for the lab:

- `Kubernetes / Compute Resources / Namespace (Pods)` to show backend pod CPU during the HPA demo.
- `Kubernetes / Compute Resources / Workload` to show deployment-level CPU and memory.
- `Kubernetes / Kubelet` to show node and pod health.

## GitHub Actions CI/CD

The workflow in `.github/workflows/deploy.yml` builds the backend and frontend, pushes both images to Azure Container Registry, renders the Kubernetes manifests with the current image tag and domain values, then deploys to AKS.

Create these GitHub repository secrets before running it:

- Secret `ACR_USERNAME`: Azure Container Registry username.
- Secret `ACR_PASSWORD`: Azure Container Registry password.
- Secret `KUBE_CONFIG`: AKS kubeconfig content.
- Secret `APP_DOMAIN`: your ingress hostname, for example `viktor.eastus.cloudapp.azure.com`.
- Secret `CERT_MANAGER_EMAIL`: the email address used for Let's Encrypt certificate registration.
- Secret `MONGO_INITDB_ROOT_USERNAME`: MongoDB root username.
- Secret `MONGO_INITDB_ROOT_PASSWORD`: MongoDB root password.
- Secret `REDIS_PASSWORD`: Redis password used by Redis and the backend.

Make sure AKS can pull images from ACR:

```bash
az aks update \
  --resource-group viktor-rg \
  --name viktor-expensy \
  --attach-acr viktorexpensyacr
```
