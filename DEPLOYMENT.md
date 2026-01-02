# Deployment Guide - GLP-1 E-Commerce Platform

This guide covers deployment strategies for local development, staging, and production environments.

---

## Table of Contents

1. [Local Development with Docker Compose](#local-development)
2. [Kubernetes Deployment with Minikube](#kubernetes-deployment)
3. [AWS Production Deployment](#aws-production-deployment)
4. [Scaling Strategies](#scaling-strategies)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Troubleshooting](#troubleshooting)

---

## Local Development

### Using Docker Compose

Docker Compose is the recommended approach for local development.

#### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd glp1-ecommerce-mvp

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

#### Database Initialization

```bash
# Create and seed database (first time only)
docker-compose exec backend rails db:create
docker-compose exec backend rails db:migrate
docker-compose exec backend rails db:seed

# Or all at once
docker-compose exec backend rails db:setup
```

#### Accessing Services

| Service | URL | Credentials |
|---------|-----|-------------|
| React Frontend | http://localhost:3001 | N/A |
| GraphQL API | http://localhost:3000/graphql | N/A |
| GraphiQL IDE | http://localhost:3000/graphiql | N/A |
| Sidekiq Dashboard | http://localhost:3000/sidekiq | N/A |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| PostgreSQL | localhost:5432 | postgres / password |
| Redis | localhost:6379 | N/A |

#### Common Commands

```bash
# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (clean slate)
docker-compose down -v

# Rebuild images after code changes
docker-compose build

# Restart a specific service
docker-compose restart backend

# Execute Rails console
docker-compose exec backend rails console

# Run migrations
docker-compose exec backend rails db:migrate

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f sidekiq

# Scale sidekiq workers
docker-compose up -d --scale sidekiq=3
```

#### Environment Variables

Create `.env` file in project root:

```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=glp1_ecommerce_development

# Redis
REDIS_URL=redis://redis:6379/0

# MinIO (S3 alternative)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

# Rails
RAILS_ENV=development
SECRET_KEY_BASE=development_secret_key

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
```

---

## Kubernetes Deployment

### Prerequisites

```bash
# Install minikube
brew install minikube

# Install kubectl
brew install kubectl

# Verify installations
minikube version
kubectl version --client
```

### Minikube Setup

```bash
# Start minikube with adequate resources
minikube start --cpus=4 --memory=8192 --disk-size=20g

# Enable metrics server (for autoscaling)
minikube addons enable metrics-server

# Verify cluster is running
kubectl cluster-info
kubectl get nodes
```

### Building Docker Images

```bash
# Point Docker to minikube's Docker daemon
eval $(minikube docker-env)

# Build backend image
cd backend
docker build -t glp1-backend:latest .

# Build frontend image
cd ../frontend
docker build -t glp1-frontend:latest .

# Verify images
docker images | grep glp1
```

### Kubernetes Configuration Files

All Kubernetes manifests should be in the `k8s/` directory:

```
k8s/
├── namespace.yaml
├── postgres-deployment.yaml
├── redis-deployment.yaml
├── minio-deployment.yaml
├── backend-deployment.yaml
├── backend-service.yaml
├── frontend-deployment.yaml
├── frontend-service.yaml
├── sidekiq-deployment.yaml
└── backend-hpa.yaml
```

#### Create Namespace

`k8s/namespace.yaml`:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: glp1-ecommerce
```

#### PostgreSQL Deployment

`k8s/postgres-deployment.yaml`:
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: glp1-ecommerce
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 2Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: glp1-ecommerce
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        env:
        - name: POSTGRES_USER
          value: "postgres"
        - name: POSTGRES_PASSWORD
          value: "password"
        - name: POSTGRES_DB
          value: "glp1_ecommerce_production"
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: glp1-ecommerce
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
```

#### Redis Deployment

`k8s/redis-deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: glp1-ecommerce
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: glp1-ecommerce
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
  type: ClusterIP
```

#### Backend Deployment

`k8s/backend-deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: glp1-ecommerce
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: glp1-backend:latest
        imagePullPolicy: Never
        env:
        - name: DATABASE_URL
          value: "postgresql://postgres:password@postgres:5432/glp1_ecommerce_production"
        - name: REDIS_URL
          value: "redis://redis:6379/0"
        - name: RAILS_ENV
          value: "production"
        - name: RAILS_SERVE_STATIC_FILES
          value: "true"
        - name: SECRET_KEY_BASE
          value: "your_production_secret_key_here"
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /graphql
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /graphql
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: glp1-ecommerce
spec:
  type: NodePort
  selector:
    app: backend
  ports:
  - port: 3000
    targetPort: 3000
    nodePort: 30000
```

#### Frontend Deployment

`k8s/frontend-deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: glp1-ecommerce
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: glp1-frontend:latest
        imagePullPolicy: Never
        env:
        - name: REACT_APP_GRAPHQL_URL
          value: "http://localhost:30000/graphql"
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: glp1-ecommerce
spec:
  type: NodePort
  selector:
    app: frontend
  ports:
  - port: 3000
    targetPort: 3000
    nodePort: 30001
```

#### Sidekiq Deployment

`k8s/sidekiq-deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sidekiq
  namespace: glp1-ecommerce
spec:
  replicas: 2
  selector:
    matchLabels:
      app: sidekiq
  template:
    metadata:
      labels:
        app: sidekiq
    spec:
      containers:
      - name: sidekiq
        image: glp1-backend:latest
        imagePullPolicy: Never
        command: ["bundle", "exec", "sidekiq"]
        env:
        - name: DATABASE_URL
          value: "postgresql://postgres:password@postgres:5432/glp1_ecommerce_production"
        - name: REDIS_URL
          value: "redis://redis:6379/0"
        - name: RAILS_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "250m"
```

### Deployment Commands

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Deploy infrastructure services
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml

# Wait for infrastructure to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n glp1-ecommerce --timeout=120s
kubectl wait --for=condition=ready pod -l app=redis -n glp1-ecommerce --timeout=120s

# Deploy application services
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/sidekiq-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Check deployment status
kubectl get pods -n glp1-ecommerce
kubectl get services -n glp1-ecommerce

# Watch pods come up
kubectl get pods -n glp1-ecommerce -w
```

### Database Migration

```bash
# Run migrations in a one-off pod
kubectl run -it --rm migration-job \
  --image=glp1-backend:latest \
  --image-pull-policy=Never \
  --restart=Never \
  --namespace=glp1-ecommerce \
  --env="DATABASE_URL=postgresql://postgres:password@postgres:5432/glp1_ecommerce_production" \
  --env="RAILS_ENV=production" \
  -- rails db:create db:migrate db:seed
```

### Accessing the Application

```bash
# Get service URLs
minikube service backend -n glp1-ecommerce --url
minikube service frontend -n glp1-ecommerce --url

# Or use port forwarding
kubectl port-forward service/backend 3000:3000 -n glp1-ecommerce
kubectl port-forward service/frontend 3001:3000 -n glp1-ecommerce
```

---

## AWS Production Deployment

### Architecture Overview

```
Internet
   ↓
Application Load Balancer
   ↓
EKS Cluster (Kubernetes)
   ├── Backend Pods (GraphQL API)
   ├── Frontend Pods (React)
   └── Sidekiq Pods (Workers)
   
Data Layer:
   ├── RDS PostgreSQL (Multi-AZ)
   ├── ElastiCache Redis (for Sidekiq)
   ├── S3 (for product images)
   └── SQS (optional, for job queue)
```

### Prerequisites

```bash
# Install AWS CLI
brew install awscli

# Configure credentials
aws configure

# Install eksctl
brew install eksctl

# Install Helm
brew install helm
```

### Creating EKS Cluster

```bash
# Create EKS cluster (takes ~15 minutes)
eksctl create cluster \
  --name glp1-ecommerce-prod \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 5 \
  --managed

# Verify cluster
kubectl get nodes
```

### Setting Up RDS PostgreSQL

```bash
# Create RDS instance via AWS CLI
aws rds create-db-instance \
  --db-instance-identifier glp1-ecommerce-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.3 \
  --master-username postgres \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name your-subnet-group \
  --backup-retention-period 7 \
  --multi-az \
  --publicly-accessible false

# Get RDS endpoint
aws rds describe-db-instances \
  --db-instance-identifier glp1-ecommerce-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

### Setting Up ElastiCache Redis

```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id glp1-ecommerce-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --cache-subnet-group-name your-subnet-group \
  --security-group-ids sg-xxxxx
```

### Setting Up S3

```bash
# Create S3 bucket
aws s3 mb s3://glp1-ecommerce-media

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket glp1-ecommerce-media \
  --versioning-configuration Status=Enabled

# Set CORS policy
aws s3api put-bucket-cors \
  --bucket glp1-ecommerce-media \
  --cors-configuration file://s3-cors.json
```

`s3-cors.json`:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://yourdomain.com"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### Kubernetes Secrets

```bash
# Create secrets for sensitive data
kubectl create secret generic database-credentials \
  --from-literal=url='postgresql://postgres:password@your-rds-endpoint:5432/glp1_ecommerce_production' \
  --namespace=glp1-ecommerce

kubectl create secret generic redis-credentials \
  --from-literal=url='redis://your-elasticache-endpoint:6379/0' \
  --namespace=glp1-ecommerce

kubectl create secret generic rails-secrets \
  --from-literal=secret-key-base='your_generated_secret_key' \
  --namespace=glp1-ecommerce

kubectl create secret generic stripe-keys \
  --from-literal=secret-key='sk_live_your_key' \
  --from-literal=publishable-key='pk_live_your_key' \
  --namespace=glp1-ecommerce
```

### Production Deployment

Update deployments to use secrets:

```yaml
# backend-deployment.yaml (production)
env:
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: database-credentials
      key: url
- name: REDIS_URL
  valueFrom:
    secretKeyRef:
      name: redis-credentials
      key: url
- name: SECRET_KEY_BASE
  valueFrom:
    secretKeyRef:
      name: rails-secrets
      key: secret-key-base
```

Deploy to production:

```bash
# Apply all configurations
kubectl apply -f k8s/production/

# Run migrations
kubectl run -it --rm migration-job \
  --image=your-ecr-repo/glp1-backend:latest \
  --restart=Never \
  --namespace=glp1-ecommerce \
  --overrides='
  {
    "spec": {
      "containers": [{
        "name": "migration",
        "image": "your-ecr-repo/glp1-backend:latest",
        "command": ["rails", "db:migrate"],
        "env": [{
          "name": "DATABASE_URL",
          "valueFrom": {
            "secretKeyRef": {
              "name": "database-credentials",
              "key": "url"
            }
          }
        }]
      }]
    }
  }'
```

### Setting Up Load Balancer

```bash
# Install AWS Load Balancer Controller
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=glp1-ecommerce-prod

# Create Ingress
kubectl apply -f k8s/ingress.yaml
```

`k8s/ingress.yaml`:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: glp1-ingress
  namespace: glp1-ecommerce
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
spec:
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 3000
  - host: www.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 3000
```

---

## Scaling Strategies

### Horizontal Pod Autoscaling

`k8s/backend-hpa.yaml`:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: glp1-ecommerce
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

```bash
# Apply HPA
kubectl apply -f k8s/backend-hpa.yaml

# Check HPA status
kubectl get hpa -n glp1-ecommerce
```

### Sidekiq Autoscaling

Scale Sidekiq workers based on queue depth:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: sidekiq-hpa
  namespace: glp1-ecommerce
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: sidekiq
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: External
    external:
      metric:
        name: redis_queue_length
      target:
        type: AverageValue
        averageValue: "30"
```

### Database Scaling

```bash
# Scale RDS instance vertically
aws rds modify-db-instance \
  --db-instance-identifier glp1-ecommerce-db \
  --db-instance-class db.t3.small \
  --apply-immediately

# Add read replicas
aws rds create-db-instance-read-replica \
  --db-instance-identifier glp1-ecommerce-db-read \
  --source-db-instance-identifier glp1-ecommerce-db
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check pod health
kubectl get pods -n glp1-ecommerce

# Check pod logs
kubectl logs -f deployment/backend -n glp1-ecommerce

# Check resource usage
kubectl top pods -n glp1-ecommerce
kubectl top nodes
```

### Database Backups

```bash
# Manual RDS snapshot
aws rds create-db-snapshot \
  --db-instance-identifier glp1-ecommerce-db \
  --db-snapshot-identifier manual-backup-$(date +%Y%m%d)

# Automated backups are enabled by default with retention period
```

### Rollback Strategy

```bash
# View rollout history
kubectl rollout history deployment/backend -n glp1-ecommerce

# Rollback to previous version
kubectl rollout undo deployment/backend -n glp1-ecommerce

# Rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=2 -n glp1-ecommerce
```

---

## Troubleshooting

### Pod Not Starting

```bash
# Describe pod for events
kubectl describe pod <pod-name> -n glp1-ecommerce

# Check logs
kubectl logs <pod-name> -n glp1-ecommerce

# Common issues:
# - Image pull errors: Check imagePullPolicy
# - CrashLoopBackOff: Check application logs
# - Pending: Check resource constraints
```

### Database Connection Issues

```bash
# Test connection from pod
kubectl run -it --rm debug \
  --image=postgres:15 \
  --restart=Never \
  --namespace=glp1-ecommerce \
  -- psql -h postgres -U postgres -d glp1_ecommerce_production

# Check security groups allow traffic from EKS nodes
```

### Performance Issues

```bash
# Check resource usage
kubectl top pods -n glp1-ecommerce

# View metrics
kubectl get --raw /apis/metrics.k8s.io/v1beta1/namespaces/glp1-ecommerce/pods

# Check database slow queries
# Connect to RDS and run:
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
```

---

## Continuous Deployment

### GitHub Actions Workflow

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to EKS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build and push backend image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: glp1-backend
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./backend
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
    
    - name: Update kubeconfig
      run: aws eks update-kubeconfig --name glp1-ecommerce-prod --region us-east-1
    
    - name: Deploy to EKS
      run: |
        kubectl set image deployment/backend backend=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG -n glp1-ecommerce
        kubectl rollout status deployment/backend -n glp1-ecommerce
```

---

## Cost Optimization

### AWS Free Tier Usage

| Service | Free Tier | Estimated Cost After |
|---------|-----------|---------------------|
| RDS t3.micro | 750 hrs/month | $0.017/hr (~$12/month) |
| ElastiCache t3.micro | Not free | $0.017/hr (~$12/month) |
| S3 | 5GB free | $0.023/GB/month |
| EKS Control Plane | $0.10/hr | $73/month |
| EC2 (EKS nodes) 3x t3.medium | Not free | ~$90/month |

**Total Monthly Cost (Minimal Setup):** ~$190/month

### Cost Reduction Strategies

1. Use Fargate for EKS (pay per pod)
2. Use Aurora Serverless for database
3. Implement CloudFront CDN for static assets
4. Use Spot Instances for non-critical workloads
5. Set up auto-scaling to reduce idle resources

---

This deployment guide provides multiple deployment options from local development to production AWS infrastructure. Choose the approach that best fits your current needs and budget constraints.
