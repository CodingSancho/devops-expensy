# Security and Compliance Overview

This document summarizes the security controls used in the Expensy AKS deployment and the compliance assumptions for a portfolio/lab environment.

## Scope

Expensy is an expense tracking application with a Next.js frontend, Express backend, MongoDB database, Redis cache, and Kubernetes deployment on Azure Kubernetes Service.

The application may process expense descriptions and amounts in a real business scenario. It should not store payment card data, national identifiers, health records, or other highly regulated data without additional controls.

## Identity and Access

- AKS is provisioned with a system-assigned managed identity in Terraform.
- Kubernetes RBAC is enabled on the AKS cluster.
- GitHub Actions deploys with a kubeconfig stored as a GitHub Actions secret.
- AKS is attached to Azure Container Registry so the cluster can pull images without embedding registry credentials in manifests.
- No root cloud account credentials are stored in the repository.

Relevant files:

- `terraform/aks/main.tf`
- `.github/workflows/deploy.yml`

## Secrets Management

Secrets are not committed to source control.

Ignored local files include:

- `.env`
- `.env.*`
- `kubeconfig`
- `k8s/secret.yaml`
- Terraform state files

Safe examples are committed instead:

- `backend/.env.example`
- `frontend/.env.example`
- `k8s/secret.example.yaml`

In CI/CD, GitHub Actions reads sensitive values from repository secrets and creates or updates the Kubernetes Secret at deploy time:

- `KUBE_CONFIG`
- `MONGO_INITDB_ROOT_USERNAME`
- `MONGO_INITDB_ROOT_PASSWORD`
- `REDIS_PASSWORD`
- `ACR_USERNAME`
- `ACR_PASSWORD`
- `APP_DOMAIN`
- `CERT_MANAGER_EMAIL`

For a production environment, the next improvement would be Azure Key Vault with CSI Secret Store or External Secrets Operator, so the cluster can read secrets from a managed secret store instead of relying only on GitHub Actions injection.

## Network Security

- Public traffic enters the cluster through NGINX Ingress.
- TLS is enabled at the ingress layer using cert-manager and Let's Encrypt.
- Frontend and backend Kubernetes Services are internal `ClusterIP` services.
- MongoDB and Redis are internal cluster services and are not exposed through ingress.
- The ingress routes `/` to the frontend and `/api` to the backend.

Current lab limitation:

- The AKS API server and ingress are reachable according to the Azure/AKS defaults used for this lab. A production deployment should restrict API server access, tighten Azure NSG rules, and consider private AKS networking.

## TLS and Data Protection

- Browser-to-application traffic is protected with HTTPS at ingress.
- cert-manager automates certificate issuance and renewal.
- Azure managed disks and AKS infrastructure provide encryption at rest by default for managed storage in Azure.

Current lab limitation:

- Service-to-service traffic inside the cluster is plain Kubernetes network traffic. For stricter production requirements, add a service mesh or mTLS-capable internal networking pattern.

## Observability and Retention

Monitoring is provided by `kube-prometheus-stack`.

- Prometheus retention is configured to `7d`.
- Grafana dashboards show pod CPU, memory, network usage, HPA behavior, and workload health.
- Alertmanager is installed as part of the stack.

Current lab limitation:

- Loki/log aggregation is not currently installed. Logs are available through Kubernetes pod logs, but centralized long-term application log retention is future work.

Relevant file:

- `k8s/monitoring-values.yaml`

## Compliance Notes

This project is a portfolio/lab deployment, not a certified compliance implementation.

### GDPR-style Considerations

If used for real employees or customers in the EU, expense data could be personal data. A production implementation should document:

- What personal data is collected.
- Where the data is stored.
- Who has access.
- How long records are retained.
- How data can be deleted on request.
- How backups and logs are retained and deleted.

### HIPAA

This app is not designed for protected health information and should not be used for HIPAA-regulated data without additional controls, audit logging, access policies, encryption review, and formal compliance processes.

## Incident Response Lessons Applied

During development, local kubeconfig and secret material were removed from tracked history, credentials were rotated, and ignore rules were hardened. The current repository keeps operational secrets out of Git and uses examples plus runtime secret injection instead.

## Production Hardening Backlog

- Move secrets to Azure Key Vault.
- Restrict AKS API server access.
- Add Kubernetes NetworkPolicies.
- Add centralized log aggregation with Loki or Azure Monitor.
- Add alert rules for crash loops, high CPU, failed rollouts, and unavailable deployments.
- Add image vulnerability scanning in CI/CD.
- Add least-privilege Kubernetes service accounts for workloads.
- Define data retention and deletion procedures for real expense records.
