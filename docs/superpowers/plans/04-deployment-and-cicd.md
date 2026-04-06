# Workstream D: Deployment + CI/CD -- Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate from AWS EC2/ECR/Amplify deployment to OVH Managed Kubernetes + Cloudflare Pages with Kustomize manifests and GitHub Actions CI/CD pipelines following DTSL patterns.

**Architecture:** Two frontend apps (marketing + platform) deploy to Cloudflare Pages via wrangler-action. Two backend services (API + judge) build as Docker images, push to OVH Container Registry, and deploy to OVH Managed K8s via Kustomize image tag updates. The K8s cluster uses two node pools -- general (API, ingress, observability) and judge (privileged Docker-in-Docker with gVisor). Environments follow PR -> preview, main -> staging, release tag -> production.

**Tech Stack:** OVH Managed Kubernetes, Cloudflare Pages, Kustomize (base + overlays), Sealed Secrets, GitHub Actions, Docker multi-stage builds, Nginx Ingress Controller, Prometheus + Grafana + Loki + Promtail, dorny/paths-filter, cloudflare/wrangler-action, Changesets.

**Current State:** The existing codebase uses AWS (ECR, EC2 via SSM, Amplify, Terraform for VPC/RDS/ElastiCache). Existing workflows at `.github/workflows/api.yml`, `frontend.yml`, `judge.yml` target AWS. Infrastructure uses Terraform for AWS resources. No `infrastructure/k8s/` directory exists. The `docker-compose.yml` already references all services correctly. The Dockerfiles exist at `infrastructure/docker/Dockerfile.api`, `infrastructure/docker/Dockerfile.web`, and `services/judge/docker/Dockerfile`.

---

## Task 1: Create K8s Base Namespace + RBAC

**Create:**
- `infrastructure/k8s/base/namespace.yaml`
- `infrastructure/k8s/base/rbac.yaml`
- `infrastructure/k8s/base/kustomization.yaml`

### Steps

- [ ] **1.1** Create directory structure:
```bash
mkdir -p infrastructure/k8s/base/api
mkdir -p infrastructure/k8s/base/judge
mkdir -p infrastructure/k8s/base/ingress
mkdir -p infrastructure/k8s/base/observability
mkdir -p infrastructure/k8s/overlays/dev
mkdir -p infrastructure/k8s/overlays/prod
mkdir -p infrastructure/k8s/scripts
```

- [ ] **1.2** Create `infrastructure/k8s/base/namespace.yaml`:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: prepforall
  labels:
    app.kubernetes.io/part-of: prepforall
```

- [ ] **1.3** Create `infrastructure/k8s/base/rbac.yaml`:
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: prepforall-api
  namespace: prepforall
  labels:
    app.kubernetes.io/component: api
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: prepforall-judge
  namespace: prepforall
  labels:
    app.kubernetes.io/component: judge
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: prepforall-api-role
  namespace: prepforall
rules:
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: prepforall-api-binding
  namespace: prepforall
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: prepforall-api-role
subjects:
  - kind: ServiceAccount
    name: prepforall-api
    namespace: prepforall
```

- [ ] **1.4** Create `infrastructure/k8s/base/kustomization.yaml`:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: prepforall

resources:
  - namespace.yaml
  - rbac.yaml
  - api/
  - judge/
  - ingress/
  - observability/

commonLabels:
  app.kubernetes.io/part-of: prepforall
```

- [ ] **1.5** Verify the manifests are valid:
```bash
# Expected: YAML output of all resources with namespace applied
kubectl kustomize infrastructure/k8s/base/ --enable-helm=false 2>&1 | head -20
```

**Commit point:** `feat(k8s): add base namespace and RBAC manifests`

---

## Task 2: API Deployment (Base)

**Create:**
- `infrastructure/k8s/base/api/deployment.yaml`
- `infrastructure/k8s/base/api/service.yaml`
- `infrastructure/k8s/base/api/hpa.yaml`
- `infrastructure/k8s/base/api/configmap.yaml`
- `infrastructure/k8s/base/api/kustomization.yaml`

### Steps

- [ ] **2.1** Create `infrastructure/k8s/base/api/configmap.yaml`:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
  namespace: prepforall
data:
  ENV: "production"
  PORT: "8080"
  JWT_EXPIRY: "24h"
  ALLOWED_ORIGINS: '["https://prepforall.com","https://app.prepforall.com"]'
```

- [ ] **2.2** Create `infrastructure/k8s/base/api/deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: prepforall
  labels:
    app.kubernetes.io/name: api
    app.kubernetes.io/component: api
spec:
  replicas: 2
  selector:
    matchLabels:
      app.kubernetes.io/name: api
  template:
    metadata:
      labels:
        app.kubernetes.io/name: api
        app.kubernetes.io/component: api
    spec:
      serviceAccountName: prepforall-api
      terminationGracePeriodSeconds: 30
      containers:
        - name: api
          image: prepforall-api:latest
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
          envFrom:
            - configMapRef:
                name: api-config
            - secretRef:
                name: api-secrets
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 10
            periodSeconds: 15
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          startupProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
            failureThreshold: 10
      nodeSelector:
        node-pool: general
```

- [ ] **2.3** Create `infrastructure/k8s/base/api/service.yaml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: prepforall
  labels:
    app.kubernetes.io/name: api
spec:
  type: ClusterIP
  ports:
    - name: http
      port: 8080
      targetPort: http
      protocol: TCP
  selector:
    app.kubernetes.io/name: api
```

- [ ] **2.4** Create `infrastructure/k8s/base/api/hpa.yaml`:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
  namespace: prepforall
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 75
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Pods
          value: 1
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Pods
          value: 2
          periodSeconds: 60
```

- [ ] **2.5** Create `infrastructure/k8s/base/api/kustomization.yaml`:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
  - hpa.yaml
  - configmap.yaml
```

- [ ] **2.6** Verify:
```bash
kubectl kustomize infrastructure/k8s/base/api/
# Expected: valid YAML with all 4 resources rendered
```

**Commit point:** `feat(k8s): add API deployment, service, HPA, and configmap`

---

## Task 3: Judge Deployment (Base)

**Create:**
- `infrastructure/k8s/base/judge/deployment.yaml`
- `infrastructure/k8s/base/judge/hpa.yaml`
- `infrastructure/k8s/base/judge/configmap.yaml`
- `infrastructure/k8s/base/judge/kustomization.yaml`

### Steps

- [ ] **3.1** Create `infrastructure/k8s/base/judge/configmap.yaml`:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: judge-config
  namespace: prepforall
data:
  SANDBOX_TIMEOUT: "10"
  SANDBOX_MEMORY_LIMIT: "256m"
  SANDBOX_CPU_LIMIT: "1"
  MAX_CONCURRENT_JOBS: "4"
```

- [ ] **3.2** Create `infrastructure/k8s/base/judge/deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: judge
  namespace: prepforall
  labels:
    app.kubernetes.io/name: judge
    app.kubernetes.io/component: judge
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: judge
  template:
    metadata:
      labels:
        app.kubernetes.io/name: judge
        app.kubernetes.io/component: judge
    spec:
      serviceAccountName: prepforall-judge
      terminationGracePeriodSeconds: 60
      containers:
        - name: judge
          image: prepforall-judge:latest
          envFrom:
            - configMapRef:
                name: judge-config
            - secretRef:
                name: judge-secrets
          resources:
            requests:
              cpu: 250m
              memory: 256Mi
            limits:
              cpu: "1"
              memory: 1Gi
          securityContext:
            privileged: true
          volumeMounts:
            - name: docker-sock
              mountPath: /var/run/docker.sock
            - name: docker-data
              mountPath: /var/lib/docker
          livenessProbe:
            exec:
              command:
                - /bin/sh
                - -c
                - "pgrep judge"
            initialDelaySeconds: 10
            periodSeconds: 30
            failureThreshold: 3
      volumes:
        - name: docker-sock
          hostPath:
            path: /var/run/docker.sock
            type: Socket
        - name: docker-data
          emptyDir: {}
      tolerations:
        - key: workload-type
          operator: Equal
          value: judge
          effect: NoSchedule
      nodeSelector:
        node-pool: judge
```

- [ ] **3.3** Create `infrastructure/k8s/base/judge/hpa.yaml`:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: judge-hpa
  namespace: prepforall
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: judge
  minReplicas: 1
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 50
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Pods
          value: 1
          periodSeconds: 120
    scaleUp:
      stabilizationWindowSeconds: 30
      policies:
        - type: Pods
          value: 2
          periodSeconds: 60
```

- [ ] **3.4** Create `infrastructure/k8s/base/judge/kustomization.yaml`:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - hpa.yaml
  - configmap.yaml
```

- [ ] **3.5** Verify:
```bash
kubectl kustomize infrastructure/k8s/base/judge/
# Expected: deployment with privileged=true, tolerations for judge pool, nodeSelector for judge
```

**Commit point:** `feat(k8s): add judge deployment with privileged mode and judge pool tolerations`

---

## Task 4: Ingress (Nginx Ingress Controller)

**Create:**
- `infrastructure/k8s/base/ingress/ingress.yaml`
- `infrastructure/k8s/base/ingress/kustomization.yaml`

### Steps

- [ ] **4.1** Create `infrastructure/k8s/base/ingress/ingress.yaml`:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  namespace: prepforall
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
    nginx.ingress.kubernetes.io/limit-rps: "100"
    nginx.ingress.kubernetes.io/configuration-snippet: |
      more_set_headers "X-Frame-Options: DENY";
      more_set_headers "X-Content-Type-Options: nosniff";
      more_set_headers "X-XSS-Protection: 1; mode=block";
      more_set_headers "Referrer-Policy: strict-origin-when-cross-origin";
spec:
  tls:
    - hosts:
        - api.prepforall.com
      secretName: api-tls-cert
  rules:
    - host: api.prepforall.com
      http:
        paths:
          - path: /api/
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 8080
          - path: /ws
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 8080
          - path: /health
            pathType: Exact
            backend:
              service:
                name: api
                port:
                  number: 8080
          - path: /metrics
            pathType: Exact
            backend:
              service:
                name: api
                port:
                  number: 8080
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress-ws
  namespace: prepforall
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    nginx.ingress.kubernetes.io/upstream-hash-by: "$remote_addr"
    nginx.ingress.kubernetes.io/configuration-snippet: |
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
spec:
  tls:
    - hosts:
        - api.prepforall.com
      secretName: api-tls-cert
  rules:
    - host: api.prepforall.com
      http:
        paths:
          - path: /ws
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 8080
```

- [ ] **4.2** Create `infrastructure/k8s/base/ingress/kustomization.yaml`:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - ingress.yaml
```

- [ ] **4.3** Verify:
```bash
kubectl kustomize infrastructure/k8s/base/ingress/
# Expected: two Ingress resources — one for API routes, one for WebSocket with long timeouts
```

**Commit point:** `feat(k8s): add nginx ingress with TLS, API routes, and WebSocket support`

---

## Task 5: Observability Stack (Base)

**Create:**
- `infrastructure/k8s/base/observability/prometheus.yaml`
- `infrastructure/k8s/base/observability/grafana.yaml`
- `infrastructure/k8s/base/observability/loki.yaml`
- `infrastructure/k8s/base/observability/promtail.yaml`
- `infrastructure/k8s/base/observability/kustomization.yaml`

### Steps

- [ ] **5.1** Create `infrastructure/k8s/base/observability/prometheus.yaml`:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: prepforall
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    scrape_configs:
      - job_name: "prepforall-api"
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names: ["prepforall"]
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app_kubernetes_io_name]
            regex: api
            action: keep
          - source_labels: [__meta_kubernetes_pod_ip]
            target_label: __address__
            replacement: "$1:8080"
        metrics_path: /metrics
      - job_name: "prepforall-judge"
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names: ["prepforall"]
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app_kubernetes_io_name]
            regex: judge
            action: keep
          - source_labels: [__meta_kubernetes_pod_ip]
            target_label: __address__
            replacement: "$1:9091"
        metrics_path: /metrics
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: prepforall
  labels:
    app.kubernetes.io/name: prometheus
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: prometheus
  template:
    metadata:
      labels:
        app.kubernetes.io/name: prometheus
    spec:
      containers:
        - name: prometheus
          image: prom/prometheus:v2.55.1
          args:
            - "--config.file=/etc/prometheus/prometheus.yml"
            - "--storage.tsdb.retention.time=15d"
            - "--storage.tsdb.path=/prometheus"
          ports:
            - containerPort: 9090
          volumeMounts:
            - name: config
              mountPath: /etc/prometheus
            - name: data
              mountPath: /prometheus
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 1Gi
      volumes:
        - name: config
          configMap:
            name: prometheus-config
        - name: data
          emptyDir: {}
      nodeSelector:
        node-pool: general
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: prepforall
spec:
  type: ClusterIP
  ports:
    - port: 9090
      targetPort: 9090
  selector:
    app.kubernetes.io/name: prometheus
```

- [ ] **5.2** Create `infrastructure/k8s/base/observability/grafana.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: prepforall
  labels:
    app.kubernetes.io/name: grafana
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: grafana
  template:
    metadata:
      labels:
        app.kubernetes.io/name: grafana
    spec:
      containers:
        - name: grafana
          image: grafana/grafana:11.4.0
          ports:
            - containerPort: 3000
          env:
            - name: GF_SECURITY_ADMIN_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: grafana-secrets
                  key: admin-password
            - name: GF_SERVER_ROOT_URL
              value: "https://grafana.prepforall.com"
          volumeMounts:
            - name: dashboards
              mountPath: /etc/grafana/provisioning/dashboards
            - name: datasources
              mountPath: /etc/grafana/provisioning/datasources
            - name: data
              mountPath: /var/lib/grafana
          resources:
            requests:
              cpu: 50m
              memory: 128Mi
            limits:
              cpu: 200m
              memory: 256Mi
      volumes:
        - name: dashboards
          configMap:
            name: grafana-dashboards
            optional: true
        - name: datasources
          configMap:
            name: grafana-datasources
        - name: data
          emptyDir: {}
      nodeSelector:
        node-pool: general
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-datasources
  namespace: prepforall
data:
  datasources.yaml: |
    apiVersion: 1
    datasources:
      - name: Prometheus
        type: prometheus
        url: http://prometheus:9090
        isDefault: true
        access: proxy
      - name: Loki
        type: loki
        url: http://loki:3100
        access: proxy
---
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: prepforall
spec:
  type: ClusterIP
  ports:
    - port: 3000
      targetPort: 3000
  selector:
    app.kubernetes.io/name: grafana
```

- [ ] **5.3** Create `infrastructure/k8s/base/observability/loki.yaml`:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: loki-config
  namespace: prepforall
data:
  loki-config.yaml: |
    auth_enabled: false
    server:
      http_listen_port: 3100
    ingester:
      lifecycler:
        address: 127.0.0.1
        ring:
          kvstore:
            store: inmemory
          replication_factor: 1
    schema_config:
      configs:
        - from: 2024-01-01
          store: boltdb-shipper
          object_store: filesystem
          schema: v11
          index:
            prefix: index_
            period: 24h
    storage_config:
      boltdb_shipper:
        active_index_directory: /loki/boltdb-shipper-active
        cache_location: /loki/boltdb-shipper-cache
        shared_store: filesystem
      filesystem:
        directory: /loki/chunks
    limits_config:
      enforce_metric_name: false
      reject_old_samples: true
      reject_old_samples_max_age: 168h
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: loki
  namespace: prepforall
  labels:
    app.kubernetes.io/name: loki
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: loki
  template:
    metadata:
      labels:
        app.kubernetes.io/name: loki
    spec:
      containers:
        - name: loki
          image: grafana/loki:3.3.2
          args:
            - "-config.file=/etc/loki/local-config.yaml"
          ports:
            - containerPort: 3100
          volumeMounts:
            - name: config
              mountPath: /etc/loki
            - name: data
              mountPath: /loki
          resources:
            requests:
              cpu: 50m
              memory: 128Mi
            limits:
              cpu: 200m
              memory: 512Mi
      volumes:
        - name: config
          configMap:
            name: loki-config
            items:
              - key: loki-config.yaml
                path: local-config.yaml
        - name: data
          emptyDir: {}
      nodeSelector:
        node-pool: general
---
apiVersion: v1
kind: Service
metadata:
  name: loki
  namespace: prepforall
spec:
  type: ClusterIP
  ports:
    - port: 3100
      targetPort: 3100
  selector:
    app.kubernetes.io/name: loki
```

- [ ] **5.4** Create `infrastructure/k8s/base/observability/promtail.yaml`:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: promtail-config
  namespace: prepforall
data:
  promtail.yaml: |
    server:
      http_listen_port: 9080
      grpc_listen_port: 0
    positions:
      filename: /tmp/positions.yaml
    clients:
      - url: http://loki:3100/loki/api/v1/push
    scrape_configs:
      - job_name: kubernetes-pods
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names: ["prepforall"]
        pipeline_stages:
          - docker: {}
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app_kubernetes_io_name]
            target_label: app
          - source_labels: [__meta_kubernetes_namespace]
            target_label: namespace
          - source_labels: [__meta_kubernetes_pod_name]
            target_label: pod
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: promtail
  namespace: prepforall
  labels:
    app.kubernetes.io/name: promtail
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: promtail
  template:
    metadata:
      labels:
        app.kubernetes.io/name: promtail
    spec:
      containers:
        - name: promtail
          image: grafana/promtail:3.3.2
          args:
            - "-config.file=/etc/promtail/config.yml"
          volumeMounts:
            - name: config
              mountPath: /etc/promtail
            - name: varlog
              mountPath: /var/log
              readOnly: true
            - name: containers
              mountPath: /var/lib/docker/containers
              readOnly: true
          resources:
            requests:
              cpu: 25m
              memory: 64Mi
            limits:
              cpu: 100m
              memory: 128Mi
      volumes:
        - name: config
          configMap:
            name: promtail-config
            items:
              - key: promtail.yaml
                path: config.yml
        - name: varlog
          hostPath:
            path: /var/log
        - name: containers
          hostPath:
            path: /var/lib/docker/containers
      tolerations:
        - effect: NoSchedule
          operator: Exists
```

- [ ] **5.5** Create `infrastructure/k8s/base/observability/kustomization.yaml`:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - prometheus.yaml
  - grafana.yaml
  - loki.yaml
  - promtail.yaml
```

- [ ] **5.6** Verify:
```bash
kubectl kustomize infrastructure/k8s/base/observability/
# Expected: ConfigMaps, Deployments, DaemonSet, Services for all observability components
```

**Commit point:** `feat(k8s): add observability stack — prometheus, grafana, loki, promtail`

---

## Task 6: Kustomize Overlays (Dev + Prod)

**Create:**
- `infrastructure/k8s/overlays/dev/kustomization.yaml`
- `infrastructure/k8s/overlays/dev/api-patch.yaml`
- `infrastructure/k8s/overlays/dev/judge-patch.yaml`
- `infrastructure/k8s/overlays/dev/secrets.yaml`
- `infrastructure/k8s/overlays/prod/kustomization.yaml`
- `infrastructure/k8s/overlays/prod/api-patch.yaml`
- `infrastructure/k8s/overlays/prod/judge-patch.yaml`

### Steps

- [ ] **6.1** Create `infrastructure/k8s/overlays/dev/api-patch.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 1
  template:
    spec:
      containers:
        - name: api
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 250m
              memory: 256Mi
```

- [ ] **6.2** Create `infrastructure/k8s/overlays/dev/judge-patch.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: judge
spec:
  replicas: 1
  template:
    spec:
      containers:
        - name: judge
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
```

- [ ] **6.3** Create `infrastructure/k8s/overlays/dev/secrets.yaml` (plaintext for dev only -- never commit real credentials):
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: api-secrets
  namespace: prepforall
type: Opaque
stringData:
  DATABASE_URL: "postgres://prepforall:devpassword@postgres:5432/prepforall?sslmode=disable"
  REDIS_ADDR: "redis:6379"
  JWT_SECRET: "dev-secret-min-32-characters-long-ok"
---
apiVersion: v1
kind: Secret
metadata:
  name: judge-secrets
  namespace: prepforall
type: Opaque
stringData:
  REDIS_ADDR: "redis:6379"
---
apiVersion: v1
kind: Secret
metadata:
  name: grafana-secrets
  namespace: prepforall
type: Opaque
stringData:
  admin-password: "admin"
```

- [ ] **6.4** Create `infrastructure/k8s/overlays/dev/kustomization.yaml`:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - ../../base
  - secrets.yaml

patches:
  - path: api-patch.yaml
    target:
      kind: Deployment
      name: api
  - path: judge-patch.yaml
    target:
      kind: Deployment
      name: judge

# Override configmap for dev environment
configMapGenerator:
  - name: api-config
    behavior: merge
    literals:
      - ENV=development
      - ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:5173"]
```

- [ ] **6.5** Create `infrastructure/k8s/overlays/prod/api-patch.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: api
          resources:
            requests:
              cpu: 200m
              memory: 256Mi
            limits:
              cpu: "1"
              memory: 1Gi
```

- [ ] **6.6** Create `infrastructure/k8s/overlays/prod/judge-patch.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: judge
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: judge
          resources:
            requests:
              cpu: 500m
              memory: 512Mi
            limits:
              cpu: "2"
              memory: 2Gi
```

- [ ] **6.7** Create `infrastructure/k8s/overlays/prod/kustomization.yaml`:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - ../../base

patches:
  - path: api-patch.yaml
    target:
      kind: Deployment
      name: api
  - path: judge-patch.yaml
    target:
      kind: Deployment
      name: judge

# Sealed secrets are committed separately — see Task 7
# They are referenced by name in base deployment envFrom
```

- [ ] **6.8** Verify both overlays render:
```bash
kubectl kustomize infrastructure/k8s/overlays/dev/
kubectl kustomize infrastructure/k8s/overlays/prod/
# Expected: dev shows 1 replica, prod shows 2 replicas
```

**Commit point:** `feat(k8s): add dev and prod overlays with resource adjustments`

---

## Task 7: Sealed Secrets Setup

**Create:**
- `infrastructure/k8s/overlays/prod/sealed-secrets.yaml`
- `infrastructure/k8s/scripts/seal-secret.sh`

### Steps

- [ ] **7.1** Create `infrastructure/k8s/scripts/seal-secret.sh`:
```bash
#!/usr/bin/env bash
# Usage: ./seal-secret.sh <secret-name> <namespace> <key=value>...
# Requires: kubeseal CLI + sealed-secrets controller running in cluster
#
# Example:
#   ./seal-secret.sh api-secrets prepforall \
#     DATABASE_URL="postgres://..." \
#     REDIS_ADDR="redis:6379" \
#     JWT_SECRET="your-production-secret"

set -euo pipefail

SECRET_NAME="${1:?Usage: seal-secret.sh <name> <namespace> <key=value>...}"
NAMESPACE="${2:?Usage: seal-secret.sh <name> <namespace> <key=value>...}"
shift 2

LITERAL_ARGS=()
for kv in "$@"; do
  LITERAL_ARGS+=("--from-literal=${kv}")
done

echo "--- Creating and sealing secret: ${SECRET_NAME} in namespace: ${NAMESPACE}"

kubectl create secret generic "${SECRET_NAME}" \
  --namespace="${NAMESPACE}" \
  --dry-run=client \
  -o yaml \
  "${LITERAL_ARGS[@]}" \
  | kubeseal \
    --controller-name=sealed-secrets \
    --controller-namespace=kube-system \
    --format yaml \
  > "$(dirname "$0")/../overlays/prod/sealed-${SECRET_NAME}.yaml"

echo "--- Sealed secret written to overlays/prod/sealed-${SECRET_NAME}.yaml"
echo "--- Commit this file to git. It is safe — only the cluster can decrypt it."
```

- [ ] **7.2** Make it executable:
```bash
chmod +x infrastructure/k8s/scripts/seal-secret.sh
```

- [ ] **7.3** Create a placeholder `infrastructure/k8s/overlays/prod/sealed-secrets.yaml` with instructions:
```yaml
# Sealed Secrets for production
# ==============================
# DO NOT create this file manually. Use the seal-secret.sh script:
#
#   ./infrastructure/k8s/scripts/seal-secret.sh api-secrets prepforall \
#     DATABASE_URL="postgres://user:pass@host:5432/prepforall?sslmode=require" \
#     REDIS_ADDR="redis-host:6379" \
#     JWT_SECRET="<production-jwt-secret-min-32-chars>"
#
#   ./infrastructure/k8s/scripts/seal-secret.sh judge-secrets prepforall \
#     REDIS_ADDR="redis-host:6379"
#
#   ./infrastructure/k8s/scripts/seal-secret.sh grafana-secrets prepforall \
#     admin-password="<strong-grafana-password>"
#
# After running, individual sealed-*.yaml files will be generated.
# Add them to overlays/prod/kustomization.yaml resources.
#
# Prerequisites:
#   1. Install kubeseal: brew install kubeseal
#   2. Install sealed-secrets controller in cluster:
#      kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.27.3/controller.yaml
```

- [ ] **7.4** Update `infrastructure/k8s/overlays/prod/kustomization.yaml` to add a comment about sealed secrets:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - ../../base
  # Uncomment after running seal-secret.sh:
  # - sealed-api-secrets.yaml
  # - sealed-judge-secrets.yaml
  # - sealed-grafana-secrets.yaml

patches:
  - path: api-patch.yaml
    target:
      kind: Deployment
      name: api
  - path: judge-patch.yaml
    target:
      kind: Deployment
      name: judge
```

- [ ] **7.5** Verify script is executable:
```bash
test -x infrastructure/k8s/scripts/seal-secret.sh && echo "OK" || echo "FAIL"
# Expected: OK
```

**Commit point:** `feat(k8s): add sealed secrets tooling and documentation`

---

## Task 8: API Dockerfile (Multi-stage: Go builder -> Debian slim)

**Modify:** `infrastructure/docker/Dockerfile.api`

The existing Dockerfile uses `alpine:3.20` which is fine but the spec says Debian slim. We also need to change the build context to work from the monorepo root since the Dockerfile is at `infrastructure/docker/Dockerfile.api` but the context is `services/api/`.

### Steps

- [ ] **8.1** Replace `infrastructure/docker/Dockerfile.api` with:
```dockerfile
# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM golang:1.23-bookworm AS builder

WORKDIR /build

# Download dependencies first (cached layer unless go.mod/go.sum change)
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build static binary with optimizations
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-w -s -X main.version=${VERSION:-dev}" -o /api ./cmd/api

# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    tzdata \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Non-root user for security
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

WORKDIR /app

COPY --from=builder /api .
COPY config/ ./config/

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

ENTRYPOINT ["./api"]
```

- [ ] **8.2** Verify build:
```bash
cd /Users/sahilsharma/education/prepforall && \
docker build -f infrastructure/docker/Dockerfile.api -t prepforall-api:test ./services/api
# Expected: successful build, image should be < 100MB
docker images prepforall-api:test --format "{{.Size}}"
```

**Commit point:** `refactor(docker): update API Dockerfile to Debian slim runtime`

---

## Task 9: Judge Dockerfile (Docker-in-Docker + gVisor Support)

**Modify:** `services/judge/docker/Dockerfile`

The existing Dockerfile uses `alpine:3.20` with `docker-cli` only. We need Docker-in-Docker capability and gVisor (runsc) for sandboxed execution.

### Steps

- [ ] **9.1** Replace `services/judge/docker/Dockerfile` with:
```dockerfile
# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM golang:1.23-bookworm AS builder

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-w -s" -o /judge ./cmd/judge

# ─── Stage 2: Runtime (DinD + gVisor) ───────────────────────────────────────
FROM docker:27-dind

# Install gVisor runtime (runsc)
RUN set -eux; \
    ARCH="$(uname -m)"; \
    wget -qO /usr/local/bin/runsc "https://storage.googleapis.com/gvisor/releases/release/latest/${ARCH}/runsc"; \
    chmod +x /usr/local/bin/runsc; \
    # Configure Docker to use gVisor as a runtime option
    mkdir -p /etc/docker; \
    echo '{"runtimes":{"runsc":{"path":"/usr/local/bin/runsc"}},"default-runtime":"runsc"}' > /etc/docker/daemon.json

# Install ca-certificates for HTTPS
RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /judge .

# Judge needs Docker daemon access — runs as root for DinD
# Security isolation is provided by gVisor (runsc) for sandbox containers

EXPOSE 9091

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD pgrep judge || exit 1

ENTRYPOINT ["./judge"]
```

- [ ] **9.2** Verify build:
```bash
cd /Users/sahilsharma/education/prepforall && \
docker build -f services/judge/docker/Dockerfile -t prepforall-judge:test ./services/judge
# Expected: successful build
docker images prepforall-judge:test --format "{{.Size}}"
```

**Commit point:** `refactor(docker): update judge Dockerfile with DinD and gVisor`

---

## Task 10: Update docker-compose.yml for Monorepo Structure

**Modify:** `docker-compose.yml`

Update to reflect the new monorepo structure with apps/marketing and apps/platform instead of apps/web. Keep backward compatibility during migration.

### Steps

- [ ] **10.1** Update `docker-compose.yml` -- replace the `web` service with `marketing` and `platform`:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: prepforall_postgres
    environment:
      POSTGRES_USER: prepforall
      POSTGRES_PASSWORD: devpassword
      POSTGRES_DB: prepforall
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U prepforall"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: prepforall_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./services/api
      dockerfile: ../../infrastructure/docker/Dockerfile.api
    container_name: prepforall_api
    ports:
      - "8080:8080"
    environment:
      ENV: development
      PORT: "8080"
      DATABASE_URL: postgres://prepforall:devpassword@postgres:5432/prepforall?sslmode=disable
      REDIS_ADDR: redis:6379
      JWT_SECRET: dev-super-secret-change-in-production
      JWT_EXPIRY: 24h
      ALLOWED_ORIGINS: '["http://localhost:3000","http://localhost:5173"]'
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  judge:
    build:
      context: ./services/judge
      dockerfile: docker/Dockerfile
    container_name: prepforall_judge
    environment:
      REDIS_ADDR: redis:6379
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped

  # Legacy app (remove after migration to marketing + platform)
  web:
    build:
      context: ./apps/web
      dockerfile: ../../infrastructure/docker/Dockerfile.web
    container_name: prepforall_web
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8080
      NEXT_PUBLIC_WS_URL: ws://localhost:8080
    depends_on:
      - api
    restart: unless-stopped
    profiles:
      - legacy

  marketing:
    build:
      context: .
      dockerfile: infrastructure/docker/Dockerfile.marketing
    container_name: prepforall_marketing
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8080
    depends_on:
      - api
    restart: unless-stopped
    profiles:
      - monorepo

  platform:
    build:
      context: .
      dockerfile: infrastructure/docker/Dockerfile.platform
    container_name: prepforall_platform
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:8080
      VITE_WS_URL: ws://localhost:8080
    depends_on:
      - api
    restart: unless-stopped
    profiles:
      - monorepo

  prometheus:
    image: prom/prometheus:v2.55.1
    container_name: prepforall_prometheus
    volumes:
      - ./infrastructure/observability/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
    restart: unless-stopped

  grafana:
    image: grafana/grafana:11.4.0
    container_name: prepforall_grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    depends_on:
      - prometheus
    restart: unless-stopped

  loki:
    image: grafana/loki:3.3.2
    container_name: prepforall_loki
    ports:
      - "3100:3100"
    volumes:
      - ./infrastructure/observability/loki/loki-config.yml:/etc/loki/local-config.yaml
    restart: unless-stopped

  promtail:
    image: grafana/promtail:3.3.2
    container_name: prepforall_promtail
    volumes:
      - /var/log:/var/log
      - ./infrastructure/observability/promtail/promtail-config.yml:/etc/promtail/config.yml
    depends_on:
      - loki
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  grafana_data:
```

- [ ] **10.2** Verify both profiles work:
```bash
# Legacy mode (current apps/web)
docker compose --profile legacy config --quiet && echo "legacy profile valid"
# Monorepo mode (apps/marketing + apps/platform)
docker compose --profile monorepo config --quiet && echo "monorepo profile valid"
# Default mode (no frontend, just API + infra)
docker compose config --quiet && echo "default config valid"
```

**Commit point:** `refactor(docker): update docker-compose.yml for monorepo with profile-based frontend selection`

---

## Task 11: Frontend CI Workflow

**Create:** `.github/workflows/ci-frontend.yaml`

Replaces the existing `.github/workflows/frontend.yml`. Uses Turbo for lint + test + build across all frontend apps and packages.

### Steps

- [ ] **11.1** Create `.github/workflows/ci-frontend.yaml`:
```yaml
name: Frontend CI

on:
  pull_request:
    branches: [main]
    paths:
      - "apps/marketing/**"
      - "apps/platform/**"
      - "packages/**"
      - "turbo.json"
      - "package.json"
      - "yarn.lock"
      - ".github/workflows/ci-frontend.yaml"
  push:
    branches: [main]
    paths:
      - "apps/marketing/**"
      - "apps/platform/**"
      - "packages/**"
      - "turbo.json"
      - "package.json"
      - "yarn.lock"
      - ".github/workflows/ci-frontend.yaml"

concurrency:
  group: ci-frontend-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "yarn"
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      - name: Turbo lint
        run: yarn turbo lint

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "yarn"
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      - name: Turbo type check
        run: yarn turbo typecheck

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "yarn"
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      - name: Turbo test
        run: yarn turbo test:ci

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "yarn"
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      - name: Turbo build
        run: yarn turbo build
      - name: Upload marketing build
        uses: actions/upload-artifact@v4
        with:
          name: marketing-build
          path: apps/marketing/.next
          retention-days: 1
          if-no-files-found: ignore
      - name: Upload platform build
        uses: actions/upload-artifact@v4
        with:
          name: platform-build
          path: apps/platform/dist
          retention-days: 1
          if-no-files-found: ignore
```

- [ ] **11.2** Verify YAML syntax:
```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci-frontend.yaml'))" && echo "valid YAML"
```

- [ ] **11.3** Remove old workflow file:
```bash
git rm .github/workflows/frontend.yml
```

**Commit point:** `feat(ci): add Turbo-based frontend CI workflow, remove legacy frontend.yml`

---

## Task 12: Go CI Workflow

**Create:** `.github/workflows/ci-go.yaml`

Replaces the CI portions of `.github/workflows/api.yml` and `.github/workflows/judge.yml`. Uses golangci-lint (not just `go vet`) and service containers for Postgres + Redis.

### Steps

- [ ] **12.1** Create `.github/workflows/ci-go.yaml`:
```yaml
name: Go CI

on:
  pull_request:
    branches: [main]
    paths:
      - "services/api/**"
      - "services/judge/**"
      - ".github/workflows/ci-go.yaml"
  push:
    branches: [main]
    paths:
      - "services/api/**"
      - "services/judge/**"
      - ".github/workflows/ci-go.yaml"

concurrency:
  group: ci-go-${{ github.ref }}
  cancel-in-progress: true

jobs:
  changes:
    name: Detect Changes
    runs-on: ubuntu-latest
    outputs:
      api: ${{ steps.filter.outputs.api }}
      judge: ${{ steps.filter.outputs.judge }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            api:
              - 'services/api/**'
            judge:
              - 'services/judge/**'

  lint-api:
    name: Lint API
    runs-on: ubuntu-latest
    needs: changes
    if: needs.changes.outputs.api == 'true'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: "1.23"
          cache-dependency-path: services/api/go.sum
      - name: golangci-lint
        uses: golangci/golangci-lint-action@v6
        with:
          version: v1.62
          working-directory: services/api

  test-api:
    name: Test API
    runs-on: ubuntu-latest
    needs: changes
    if: needs.changes.outputs.api == 'true'
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: prepforall
          POSTGRES_PASSWORD: testpassword
          POSTGRES_DB: prepforall_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: "1.23"
          cache-dependency-path: services/api/go.sum
      - name: Run tests
        working-directory: services/api
        env:
          DATABASE_URL: postgres://prepforall:testpassword@localhost:5432/prepforall_test?sslmode=disable
          REDIS_ADDR: localhost:6379
        run: go test ./... -race -coverprofile=coverage.out -timeout 120s
      - name: Check coverage >= 70%
        working-directory: services/api
        run: |
          coverage=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | tr -d '%')
          echo "Coverage: ${coverage}%"
          threshold=70
          if [ "$(echo "${coverage} < ${threshold}" | bc -l)" -eq 1 ]; then
            echo "::error::Coverage ${coverage}% is below ${threshold}% threshold"
            exit 1
          fi
      - uses: codecov/codecov-action@v4
        with:
          file: services/api/coverage.out
          flags: api

  lint-judge:
    name: Lint Judge
    runs-on: ubuntu-latest
    needs: changes
    if: needs.changes.outputs.judge == 'true'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: "1.23"
          cache-dependency-path: services/judge/go.sum
      - name: golangci-lint
        uses: golangci/golangci-lint-action@v6
        with:
          version: v1.62
          working-directory: services/judge

  test-judge:
    name: Test Judge
    runs-on: ubuntu-latest
    needs: changes
    if: needs.changes.outputs.judge == 'true'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: "1.23"
          cache-dependency-path: services/judge/go.sum
      - name: Run tests
        working-directory: services/judge
        run: go test ./... -race -short -timeout 60s
```

- [ ] **12.2** Verify YAML syntax:
```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci-go.yaml'))" && echo "valid YAML"
```

**Commit point:** `feat(ci): add Go CI workflow with golangci-lint, paths-filter, and service containers`

---

## Task 13: Marketing CD Workflow

**Create:** `.github/workflows/cd-marketing.yaml`

### Steps

- [ ] **13.1** Create `.github/workflows/cd-marketing.yaml`:
```yaml
name: Marketing CD

on:
  push:
    branches: [main]
    paths:
      - "apps/marketing/**"
      - "packages/ui/**"
      - "packages/marketing-ui/**"
      - "packages/shared/**"
  pull_request:
    branches: [main]
    paths:
      - "apps/marketing/**"
      - "packages/ui/**"
      - "packages/marketing-ui/**"
      - "packages/shared/**"
  workflow_dispatch:
    inputs:
      environment:
        description: "Deploy environment"
        required: true
        default: "staging"
        type: choice
        options:
          - staging
          - production

concurrency:
  group: cd-marketing-${{ github.ref }}
  cancel-in-progress: true

jobs:
  changes:
    name: Detect Changes
    runs-on: ubuntu-latest
    outputs:
      marketing: ${{ steps.filter.outputs.marketing }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            marketing:
              - 'apps/marketing/**'
              - 'packages/ui/**'
              - 'packages/marketing-ui/**'
              - 'packages/shared/**'

  build:
    name: Build Marketing
    runs-on: ubuntu-latest
    needs: changes
    if: needs.changes.outputs.marketing == 'true' || github.event_name == 'workflow_dispatch'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "yarn"
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      - name: Build with Turbo (marketing only)
        run: yarn turbo build --filter=@prepforall/marketing
      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: marketing-build
          path: apps/marketing/.next
          retention-days: 1

  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'pull_request'
    environment:
      name: marketing-preview
      url: ${{ steps.deploy.outputs.deployment-url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: marketing-build
          path: apps/marketing/.next
      - name: Deploy to Cloudflare Pages (Preview)
        id: deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy apps/marketing/.next --project-name=prepforall-marketing --branch=${{ github.head_ref }}

  deploy-staging:
    name: Deploy Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: marketing-staging
      url: https://staging.prepforall.com
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: marketing-build
          path: apps/marketing/.next
      - name: Deploy to Cloudflare Pages (Staging)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy apps/marketing/.next --project-name=prepforall-marketing --branch=staging

  deploy-production:
    name: Deploy Production
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'workflow_dispatch' && github.event.inputs.environment == 'production'
    environment:
      name: marketing-production
      url: https://prepforall.com
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: marketing-build
          path: apps/marketing/.next
      - name: Deploy to Cloudflare Pages (Production)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy apps/marketing/.next --project-name=prepforall-marketing --branch=main
```

- [ ] **13.2** Verify YAML syntax:
```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/cd-marketing.yaml'))" && echo "valid YAML"
```

**Commit point:** `feat(cd): add marketing CD workflow with Cloudflare Pages deploy`

---

## Task 14: Platform CD Workflow

**Create:** `.github/workflows/cd-platform.yaml`

### Steps

- [ ] **14.1** Create `.github/workflows/cd-platform.yaml`:
```yaml
name: Platform CD

on:
  push:
    branches: [main]
    paths:
      - "apps/platform/**"
      - "packages/ui/**"
      - "packages/platform-ui/**"
      - "packages/shared/**"
  pull_request:
    branches: [main]
    paths:
      - "apps/platform/**"
      - "packages/ui/**"
      - "packages/platform-ui/**"
      - "packages/shared/**"
  workflow_dispatch:
    inputs:
      environment:
        description: "Deploy environment"
        required: true
        default: "staging"
        type: choice
        options:
          - staging
          - production

concurrency:
  group: cd-platform-${{ github.ref }}
  cancel-in-progress: true

jobs:
  changes:
    name: Detect Changes
    runs-on: ubuntu-latest
    outputs:
      platform: ${{ steps.filter.outputs.platform }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            platform:
              - 'apps/platform/**'
              - 'packages/ui/**'
              - 'packages/platform-ui/**'
              - 'packages/shared/**'

  build:
    name: Build Platform
    runs-on: ubuntu-latest
    needs: changes
    if: needs.changes.outputs.platform == 'true' || github.event_name == 'workflow_dispatch'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "yarn"
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      - name: Build with Turbo (platform only)
        run: yarn turbo build --filter=@prepforall/platform
      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: platform-build
          path: apps/platform/dist
          retention-days: 1

  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'pull_request'
    environment:
      name: platform-preview
      url: ${{ steps.deploy.outputs.deployment-url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: platform-build
          path: apps/platform/dist
      - name: Deploy to Cloudflare Pages (Preview)
        id: deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy apps/platform/dist --project-name=prepforall-platform --branch=${{ github.head_ref }}

  deploy-staging:
    name: Deploy Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: platform-staging
      url: https://staging-app.prepforall.com
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: platform-build
          path: apps/platform/dist
      - name: Deploy to Cloudflare Pages (Staging)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy apps/platform/dist --project-name=prepforall-platform --branch=staging

  deploy-production:
    name: Deploy Production
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'workflow_dispatch' && github.event.inputs.environment == 'production'
    environment:
      name: platform-production
      url: https://app.prepforall.com
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: platform-build
          path: apps/platform/dist
      - name: Deploy to Cloudflare Pages (Production)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy apps/platform/dist --project-name=prepforall-platform --branch=main
```

- [ ] **14.2** Verify YAML syntax:
```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/cd-platform.yaml'))" && echo "valid YAML"
```

**Commit point:** `feat(cd): add platform CD workflow with Cloudflare Pages deploy`

---

## Task 15: API CD Workflow

**Create:** `.github/workflows/cd-api.yaml`

Replaces the deploy portions of `.github/workflows/api.yml`. Docker build + push to OVH Container Registry + Kustomize image tag update.

### Steps

- [ ] **15.1** Create `.github/workflows/cd-api.yaml`:
```yaml
name: API CD

on:
  push:
    branches: [main]
    paths:
      - "services/api/**"
      - "infrastructure/docker/Dockerfile.api"
      - "infrastructure/k8s/base/api/**"
  release:
    types: [published]
  workflow_dispatch:
    inputs:
      environment:
        description: "Deploy environment"
        required: true
        default: "staging"
        type: choice
        options:
          - staging
          - production

concurrency:
  group: cd-api-${{ github.ref }}
  cancel-in-progress: true

env:
  OVH_REGISTRY: ${{ secrets.OVH_REGISTRY_URL }}
  IMAGE_NAME: prepforall-api

jobs:
  build-and-push:
    name: Build & Push
    runs-on: ubuntu-latest
    outputs:
      image_tag: ${{ steps.meta.outputs.version }}
      full_image: ${{ env.OVH_REGISTRY }}/${{ env.IMAGE_NAME }}:${{ steps.meta.outputs.version }}
    steps:
      - uses: actions/checkout@v4

      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.OVH_REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=sha-
            type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}
            type=semver,pattern={{version}},enable=${{ github.event_name == 'release' }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to OVH Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.OVH_REGISTRY }}
          username: ${{ secrets.OVH_REGISTRY_USERNAME }}
          password: ${{ secrets.OVH_REGISTRY_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: ./services/api
          file: ./infrastructure/docker/Dockerfile.api
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            VERSION=${{ steps.meta.outputs.version }}

  deploy-staging:
    name: Deploy Staging
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: api-staging
      url: https://staging-api.prepforall.com
    steps:
      - uses: actions/checkout@v4

      - name: Update Kustomize image tag (staging)
        run: |
          cd infrastructure/k8s/overlays/dev
          kustomize edit set image prepforall-api=${{ needs.build-and-push.outputs.full_image }}

      - name: Apply to cluster (staging)
        uses: azure/k8s-set-context@v4
        with:
          kubeconfig: ${{ secrets.OVH_KUBECONFIG_STAGING }}

      - name: Deploy
        run: kubectl apply -k infrastructure/k8s/overlays/dev/

      - name: Wait for rollout
        run: kubectl rollout status deployment/api -n prepforall --timeout=300s

  deploy-production:
    name: Deploy Production
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.event_name == 'release' || (github.event_name == 'workflow_dispatch' && github.event.inputs.environment == 'production')
    environment:
      name: api-production
      url: https://api.prepforall.com
    steps:
      - uses: actions/checkout@v4

      - name: Update Kustomize image tag (production)
        run: |
          cd infrastructure/k8s/overlays/prod
          kustomize edit set image prepforall-api=${{ needs.build-and-push.outputs.full_image }}

      - name: Apply to cluster (production)
        uses: azure/k8s-set-context@v4
        with:
          kubeconfig: ${{ secrets.OVH_KUBECONFIG_PROD }}

      - name: Deploy
        run: kubectl apply -k infrastructure/k8s/overlays/prod/

      - name: Wait for rollout
        run: kubectl rollout status deployment/api -n prepforall --timeout=300s
```

- [ ] **15.2** Verify YAML syntax:
```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/cd-api.yaml'))" && echo "valid YAML"
```

- [ ] **15.3** Remove old workflow:
```bash
git rm .github/workflows/api.yml
```

**Commit point:** `feat(cd): add API CD workflow for OVH K8s with Kustomize, remove legacy api.yml`

---

## Task 16: Judge CD Workflow

**Create:** `.github/workflows/cd-judge.yaml`

Replaces the deploy portions of `.github/workflows/judge.yml`.

### Steps

- [ ] **16.1** Create `.github/workflows/cd-judge.yaml`:
```yaml
name: Judge CD

on:
  push:
    branches: [main]
    paths:
      - "services/judge/**"
      - "infrastructure/k8s/base/judge/**"
  release:
    types: [published]
  workflow_dispatch:
    inputs:
      environment:
        description: "Deploy environment"
        required: true
        default: "staging"
        type: choice
        options:
          - staging
          - production

concurrency:
  group: cd-judge-${{ github.ref }}
  cancel-in-progress: true

env:
  OVH_REGISTRY: ${{ secrets.OVH_REGISTRY_URL }}
  IMAGE_NAME: prepforall-judge

jobs:
  build-and-push:
    name: Build & Push Judge + Sandbox Images
    runs-on: ubuntu-latest
    outputs:
      image_tag: ${{ steps.meta.outputs.version }}
      full_image: ${{ env.OVH_REGISTRY }}/${{ env.IMAGE_NAME }}:${{ steps.meta.outputs.version }}
    steps:
      - uses: actions/checkout@v4

      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.OVH_REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=sha-
            type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}
            type=semver,pattern={{version}},enable=${{ github.event_name == 'release' }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to OVH Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.OVH_REGISTRY }}
          username: ${{ secrets.OVH_REGISTRY_USERNAME }}
          password: ${{ secrets.OVH_REGISTRY_PASSWORD }}

      - name: Build and push judge image
        uses: docker/build-push-action@v6
        with:
          context: ./services/judge
          file: ./services/judge/docker/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and push sandbox images
        working-directory: services/judge/docker/sandbox
        run: |
          for lang in cpp python java node; do
            echo "--- Building sandbox-${lang} ---"
            docker build \
              -f Dockerfile.${lang} \
              -t ${{ env.OVH_REGISTRY }}/prepforall-sandbox-${lang}:latest \
              -t ${{ env.OVH_REGISTRY }}/prepforall-sandbox-${lang}:${{ steps.meta.outputs.version }} \
              .
            docker push ${{ env.OVH_REGISTRY }}/prepforall-sandbox-${lang}:latest
            docker push ${{ env.OVH_REGISTRY }}/prepforall-sandbox-${lang}:${{ steps.meta.outputs.version }}
          done

  deploy-staging:
    name: Deploy Staging
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: judge-staging
    steps:
      - uses: actions/checkout@v4

      - name: Update Kustomize image tag (staging)
        run: |
          cd infrastructure/k8s/overlays/dev
          kustomize edit set image prepforall-judge=${{ needs.build-and-push.outputs.full_image }}

      - name: Apply to cluster (staging)
        uses: azure/k8s-set-context@v4
        with:
          kubeconfig: ${{ secrets.OVH_KUBECONFIG_STAGING }}

      - name: Deploy
        run: kubectl apply -k infrastructure/k8s/overlays/dev/

      - name: Wait for rollout
        run: kubectl rollout status deployment/judge -n prepforall --timeout=300s

  deploy-production:
    name: Deploy Production
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.event_name == 'release' || (github.event_name == 'workflow_dispatch' && github.event.inputs.environment == 'production')
    environment:
      name: judge-production
    steps:
      - uses: actions/checkout@v4

      - name: Update Kustomize image tag (production)
        run: |
          cd infrastructure/k8s/overlays/prod
          kustomize edit set image prepforall-judge=${{ needs.build-and-push.outputs.full_image }}

      - name: Apply to cluster (production)
        uses: azure/k8s-set-context@v4
        with:
          kubeconfig: ${{ secrets.OVH_KUBECONFIG_PROD }}

      - name: Deploy
        run: kubectl apply -k infrastructure/k8s/overlays/prod/

      - name: Wait for rollout
        run: kubectl rollout status deployment/judge -n prepforall --timeout=300s
```

- [ ] **16.2** Verify YAML syntax:
```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/cd-judge.yaml'))" && echo "valid YAML"
```

- [ ] **16.3** Remove old workflow:
```bash
git rm .github/workflows/judge.yml
```

**Commit point:** `feat(cd): add judge CD workflow for OVH K8s, remove legacy judge.yml`

---

## Task 17: Design System Release Workflow (Changesets)

**Create:** `.github/workflows/release-packages.yaml`

### Steps

- [ ] **17.1** Create `.github/workflows/release-packages.yaml`:
```yaml
name: Release Packages

on:
  push:
    branches: [main]
    paths:
      - "packages/ui/**"
      - ".changeset/**"

concurrency:
  group: release-packages-${{ github.ref }}
  cancel-in-progress: false

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "yarn"

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Build packages
        run: yarn turbo build --filter='./packages/*'

      - name: Create Release PR or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          title: "chore(release): version packages"
          commit: "chore(release): version packages"
          publish: yarn changeset publish
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

- [ ] **17.2** Verify YAML syntax:
```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release-packages.yaml'))" && echo "valid YAML"
```

**Commit point:** `feat(cd): add Changesets release workflow for design system packages`

---

## Task 18: OVH Cluster Setup Script

**Create:** `infrastructure/k8s/scripts/setup-cluster.sh`

### Steps

- [ ] **18.1** Create `infrastructure/k8s/scripts/setup-cluster.sh`:
```bash
#!/usr/bin/env bash
# ─── PrepForAll: OVH Managed K8s Cluster Bootstrap ─────────────────────────
# Run this ONCE after creating the OVH Managed K8s cluster in the OVH console.
#
# Prerequisites:
#   - kubectl configured with OVH cluster kubeconfig
#   - helm v3 installed
#   - kubeseal installed
#
# Usage:
#   ./infrastructure/k8s/scripts/setup-cluster.sh
# ────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$(dirname "${SCRIPT_DIR}")"

echo "============================================"
echo "PrepForAll K8s Cluster Bootstrap"
echo "============================================"

# ── 1. Verify cluster connection ────────────────────────────────────────────
echo ""
echo "--- Step 1: Verify cluster connection"
kubectl cluster-info
kubectl get nodes -o wide
echo "OK: Cluster is reachable"

# ── 2. Create namespace ─────────────────────────────────────────────────────
echo ""
echo "--- Step 2: Create prepforall namespace"
kubectl apply -f "${K8S_DIR}/base/namespace.yaml"
echo "OK: Namespace created"

# ── 3. Install Nginx Ingress Controller ─────────────────────────────────────
echo ""
echo "--- Step 3: Install Nginx Ingress Controller"
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.replicaCount=2 \
  --set controller.nodeSelector."node-pool"=general \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/ovh-loadbalancer-proxy-protocol"=v2 \
  --wait
echo "OK: Nginx Ingress installed"

# ── 4. Install cert-manager (for Let's Encrypt TLS) ─────────────────────────
echo ""
echo "--- Step 4: Install cert-manager"
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set crds.enabled=true \
  --wait
echo "OK: cert-manager installed"

# ── 5. Create Let's Encrypt ClusterIssuer ────────────────────────────────────
echo ""
echo "--- Step 5: Create Let's Encrypt ClusterIssuer"
kubectl apply -f - <<'ISSUER_EOF'
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: engineering@prepforall.com
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
      - http01:
          ingress:
            class: nginx
ISSUER_EOF
echo "OK: ClusterIssuer created"

# ── 6. Install Sealed Secrets Controller ─────────────────────────────────────
echo ""
echo "--- Step 6: Install Sealed Secrets Controller"
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm repo update
helm upgrade --install sealed-secrets sealed-secrets/sealed-secrets \
  --namespace kube-system \
  --set fullnameOverride=sealed-secrets \
  --wait
echo "OK: Sealed Secrets controller installed"

# ── 7. Taint judge node pool ────────────────────────────────────────────────
echo ""
echo "--- Step 7: Taint judge node pool"
JUDGE_NODES=$(kubectl get nodes -l node-pool=judge -o name 2>/dev/null || true)
if [ -z "${JUDGE_NODES}" ]; then
  echo "WARN: No nodes with label node-pool=judge found. Taint manually after adding judge pool."
else
  for node in ${JUDGE_NODES}; do
    kubectl taint nodes "${node}" workload-type=judge:NoSchedule --overwrite
    echo "  Tainted: ${node}"
  done
  echo "OK: Judge nodes tainted"
fi

# ── 8. Install metrics-server (for HPA) ─────────────────────────────────────
echo ""
echo "--- Step 8: Install metrics-server"
helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/
helm repo update
helm upgrade --install metrics-server metrics-server/metrics-server \
  --namespace kube-system \
  --set args[0]="--kubelet-preferred-address-types=InternalIP" \
  --wait
echo "OK: metrics-server installed"

# ── 9. Verify ───────────────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "Cluster bootstrap complete. Summary:"
echo "============================================"
kubectl get ns
echo ""
kubectl get pods -n ingress-nginx
echo ""
kubectl get pods -n cert-manager
echo ""
kubectl get pods -n kube-system -l app.kubernetes.io/name=sealed-secrets
echo ""
echo "Next steps:"
echo "  1. Create OVH Container Registry and note the URL"
echo "  2. Add GitHub Actions secrets (OVH_REGISTRY_URL, OVH_REGISTRY_USERNAME, OVH_REGISTRY_PASSWORD, OVH_KUBECONFIG_*)"
echo "  3. Run seal-secret.sh to create sealed production secrets"
echo "  4. Apply overlays: kubectl apply -k infrastructure/k8s/overlays/prod/"
```

- [ ] **18.2** Make it executable:
```bash
chmod +x infrastructure/k8s/scripts/setup-cluster.sh
```

- [ ] **18.3** Verify script syntax:
```bash
bash -n infrastructure/k8s/scripts/setup-cluster.sh && echo "valid bash"
# Expected: valid bash
```

**Commit point:** `feat(infra): add OVH K8s cluster bootstrap script`

---

## Task 19: Makefile Updates for Monorepo Commands

**Modify:** `Makefile`

### Steps

- [ ] **19.1** Replace the contents of `Makefile` with:
```makefile
.PHONY: dev dev-legacy dev-api dev-judge dev-marketing dev-platform \
        build test lint migrate clean \
        k8s-dev k8s-prod k8s-diff-dev k8s-diff-prod \
        build-sandbox-images docker-api docker-judge

# ── Local Dev (monorepo) ────────────────────────────────────────────────────
dev:
	docker compose up --build postgres redis api judge

dev-legacy:
	docker compose --profile legacy up --build

dev-monorepo:
	docker compose --profile monorepo up --build

dev-api:
	cd services/api && go run ./cmd/api

dev-judge:
	cd services/judge && go run ./cmd/judge

dev-marketing:
	yarn turbo dev --filter=@prepforall/marketing

dev-platform:
	yarn turbo dev --filter=@prepforall/platform

# ── Infra only (Postgres + Redis) ───────────────────────────────────────────
infra:
	docker compose up -d postgres redis

# ── Build ────────────────────────────────────────────────────────────────────
build-api:
	cd services/api && go build -o bin/api ./cmd/api

build-judge:
	cd services/judge && go build -o bin/judge ./cmd/judge

build-frontend:
	yarn turbo build

build: build-api build-judge build-frontend

# ── Test ─────────────────────────────────────────────────────────────────────
test-api:
	cd services/api && go test ./... -race -count=1

test-judge:
	cd services/judge && go test ./... -race -count=1

test-frontend:
	yarn turbo test:ci

test: test-api test-judge test-frontend

# ── Lint ─────────────────────────────────────────────────────────────────────
lint-api:
	cd services/api && golangci-lint run ./...

lint-judge:
	cd services/judge && golangci-lint run ./...

lint-frontend:
	yarn turbo lint

lint: lint-api lint-judge lint-frontend

# ── Database Migrations ───────────────────────────────────────────────────────
migrate-up:
	migrate -path services/api/migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path services/api/migrations -database "$(DATABASE_URL)" down 1

migrate-create:
	migrate create -ext sql -dir services/api/migrations -seq $(name)

# ── Docker Images ────────────────────────────────────────────────────────────
docker-api:
	docker build -f infrastructure/docker/Dockerfile.api -t prepforall-api:latest ./services/api

docker-judge:
	docker build -f services/judge/docker/Dockerfile -t prepforall-judge:latest ./services/judge

build-sandbox-images:
	cd services/judge/docker/sandbox && \
	docker build -f Dockerfile.cpp    -t prepforall/sandbox-cpp:latest    . && \
	docker build -f Dockerfile.python -t prepforall/sandbox-python:latest . && \
	docker build -f Dockerfile.java   -t prepforall/sandbox-java:latest   . && \
	docker build -f Dockerfile.node   -t prepforall/sandbox-node:latest   .

# ── Kubernetes (Kustomize) ──────────────────────────────────────────────────
k8s-dev:
	kubectl apply -k infrastructure/k8s/overlays/dev/

k8s-prod:
	kubectl apply -k infrastructure/k8s/overlays/prod/

k8s-diff-dev:
	kubectl diff -k infrastructure/k8s/overlays/dev/ || true

k8s-diff-prod:
	kubectl diff -k infrastructure/k8s/overlays/prod/ || true

k8s-validate:
	kubectl kustomize infrastructure/k8s/overlays/dev/ > /dev/null && echo "dev overlay: valid"
	kubectl kustomize infrastructure/k8s/overlays/prod/ > /dev/null && echo "prod overlay: valid"

# ── Sealed Secrets ──────────────────────────────────────────────────────────
seal-secret:
	@echo "Usage: ./infrastructure/k8s/scripts/seal-secret.sh <name> <namespace> <key=value>..."

# ── Cluster Setup ───────────────────────────────────────────────────────────
cluster-setup:
	./infrastructure/k8s/scripts/setup-cluster.sh

# ── Clean ────────────────────────────────────────────────────────────────────
clean:
	docker compose down -v
	rm -f services/api/bin/api services/judge/bin/judge
```

- [ ] **19.2** Verify Makefile syntax:
```bash
make -n dev 2>&1 | head -5
make -n test 2>&1 | head -5
make -n k8s-validate 2>&1 | head -5
# Expected: prints the commands without executing
```

**Commit point:** `refactor(makefile): update Makefile for monorepo + K8s commands`

---

## GitHub Actions Secrets Required

Before the CD workflows can run, the following secrets must be configured in the GitHub repository settings:

| Secret Name | Description | Where to get |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Pages edit permissions | Cloudflare dashboard > API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | Cloudflare dashboard > Overview |
| `OVH_REGISTRY_URL` | OVH Container Registry URL (e.g., `xyz.c1.gra9.container-registry.ovh.net`) | OVH Console > Container Registry |
| `OVH_REGISTRY_USERNAME` | OVH Container Registry username | OVH Console > Container Registry > Users |
| `OVH_REGISTRY_PASSWORD` | OVH Container Registry password | OVH Console > Container Registry > Users |
| `OVH_KUBECONFIG_STAGING` | Base64-encoded kubeconfig for staging cluster | `kubectl config view --raw` on staging |
| `OVH_KUBECONFIG_PROD` | Base64-encoded kubeconfig for production cluster | `kubectl config view --raw` on prod |
| `NPM_TOKEN` | npm auth token for publishing packages (if publishing to npm) | npm > Access Tokens |

---

## Execution Order

Tasks can be parallelized as follows:

```
Phase 1 (K8s manifests — independent of each other):
  Task 1 → Task 2, Task 3, Task 4, Task 5 (all depend on Task 1 directory structure)
  
Phase 2 (Overlays — depend on Phase 1):
  Task 6, Task 7

Phase 3 (Docker — independent):
  Task 8, Task 9, Task 10

Phase 4 (CI — independent of K8s):
  Task 11, Task 12

Phase 5 (CD — depend on K8s manifests + Docker):
  Task 13, Task 14, Task 15, Task 16, Task 17

Phase 6 (Infrastructure scripts — depend on everything):
  Task 18, Task 19
```

---

## Files To Remove After Migration

Once all new workflows are verified working:
- `.github/workflows/api.yml` (replaced by `ci-go.yaml` + `cd-api.yaml`)
- `.github/workflows/frontend.yml` (replaced by `ci-frontend.yaml` + `cd-marketing.yaml` + `cd-platform.yaml`)
- `.github/workflows/judge.yml` (replaced by `ci-go.yaml` + `cd-judge.yaml`)
- `infrastructure/terraform/` (replaced by OVH Managed K8s -- no Terraform needed for OVH free control plane)
- `docker-compose.prod.yml` (replaced by K8s manifests)
- `infrastructure/nginx/api.conf` (replaced by K8s Ingress)

---

**NOTE:** This plan file needs to be saved to `/Users/sahilsharma/education/prepforall/docs/superpowers/plans/04-deployment-and-cicd.md`. Since I am in read-only mode, the executing agent will need to:
1. Create the directory: `mkdir -p docs/superpowers/plans`
2. Write this plan to `docs/superpowers/plans/04-deployment-and-cicd.md`

### Critical Files for Implementation

- `/Users/sahilsharma/education/prepforall/infrastructure/k8s/base/kustomization.yaml` -- The root Kustomize file that ties all base manifests together; every K8s task depends on getting this right
- `/Users/sahilsharma/education/prepforall/.github/workflows/cd-api.yaml` -- The most complex workflow (Docker build, OVH registry push, Kustomize image update, staged deploy to staging/production)
- `/Users/sahilsharma/education/prepforall/infrastructure/k8s/base/api/deployment.yaml` -- The API deployment manifest with health checks, resource limits, and node selectors that the CD pipeline targets
- `/Users/sahilsharma/education/prepforall/infrastructure/k8s/scripts/setup-cluster.sh` -- The one-time bootstrap script that installs all cluster prerequisites (ingress, cert-manager, sealed-secrets, metrics-server)
- `/Users/sahilsharma/education/prepforall/Makefile` -- The developer entry point that must be updated to support both legacy and monorepo workflows plus K8s commands