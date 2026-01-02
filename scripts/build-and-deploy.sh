#!/bin/bash
set -e

echo "Building Docker images..."

# Point to minikube's Docker daemon
eval $(minikube docker-env)

# Build backend image
echo "Building backend image..."
cd backend
docker build -t glp1-backend:latest .
cd ..

# Build frontend image
echo "Building frontend image..."
cd frontend
docker build -t glp1-frontend:latest .
cd ..

echo "Deploying to Kubernetes..."

# Apply namespace
kubectl apply -f k8s/namespace.yaml

# Deploy infrastructure
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml

# Wait for infrastructure to be ready
echo "Waiting for infrastructure..."
kubectl wait --for=condition=ready pod -l app=postgres -n glp1-ecommerce --timeout=120s
kubectl wait --for=condition=ready pod -l app=redis -n glp1-ecommerce --timeout=120s

# Deploy application
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/sidekiq-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Deploy autoscaling
kubectl apply -f k8s/backend-hpa.yaml

echo "Waiting for application pods..."
kubectl wait --for=condition=ready pod -l app=backend -n glp1-ecommerce --timeout=180s

echo "Running database migrations..."
kubectl run -it --rm migration-job \
  --image=glp1-backend:latest \
  --image-pull-policy=Never \
  --restart=Never \
  --namespace=glp1-ecommerce \
  --env="DATABASE_URL=postgresql://postgres:password@postgres:5432/glp1_ecommerce_production" \
  --env="RAILS_ENV=production" \
  -- rails db:create db:migrate db:seed

echo "Deployment complete!"
echo ""
echo "Access the application:"
echo "Backend: $(minikube service backend -n glp1-ecommerce --url)"
echo "Frontend: $(minikube service frontend -n glp1-ecommerce --url)"