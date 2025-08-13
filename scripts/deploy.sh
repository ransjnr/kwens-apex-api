#!/bin/bash

# Unified Payments API Deployment Script
# This script automates the deployment process for production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="unified-payments-api"
DOCKER_IMAGE="unified-payments-api:latest"
CONTAINER_NAME="unified-payments-api-prod"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    log_success "Docker is running"
}

# Build Docker image
build_image() {
    log_info "Building Docker image..."
    docker build -t $DOCKER_IMAGE .
    log_success "Docker image built successfully"
}

# Stop and remove existing container
cleanup_container() {
    if docker ps -a --format "table {{.Names}}" | grep -q $CONTAINER_NAME; then
        log_info "Stopping existing container..."
        docker stop $CONTAINER_NAME || true
        docker rm $CONTAINER_NAME || true
        log_success "Existing container cleaned up"
    fi
}

# Deploy new container
deploy_container() {
    log_info "Deploying new container..."
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        log_error ".env file not found. Please create one with your production configuration."
        exit 1
    fi
    
    # Run new container
    docker run -d \
        --name $CONTAINER_NAME \
        --restart unless-stopped \
        -p 3001:3001 \
        --env-file .env \
        -v $(pwd)/logs:/app/logs \
        $DOCKER_IMAGE
    
    log_success "Container deployed successfully"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    # Wait for container to start
    sleep 10
    
    # Check if container is running
    if ! docker ps --format "table {{.Names}}" | grep -q $CONTAINER_NAME; then
        log_error "Container is not running"
        docker logs $CONTAINER_NAME
        exit 1
    fi
    
    # Check API health endpoint
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3001/api/health/live > /dev/null 2>&1; then
            log_success "API health check passed"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "API health check failed after $max_attempts attempts"
            docker logs $CONTAINER_NAME
            exit 1
        fi
        
        log_info "Health check attempt $attempt/$max_attempts failed, retrying in 5 seconds..."
        sleep 5
        attempt=$((attempt + 1))
    done
}

# Show deployment status
show_status() {
    log_info "Deployment Status:"
    echo "=================="
    docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    
    log_info "Container Logs (last 10 lines):"
    echo "=================================="
    docker logs --tail 10 $CONTAINER_NAME
    echo ""
    
    log_info "API Endpoints:"
    echo "================"
    echo "Health Check: http://localhost:3001/api/health"
    echo "API Info: http://localhost:3001/api"
    echo "Gateway Info: http://localhost:3001/api/payments/gateways"
}

# Main deployment process
main() {
    log_info "Starting deployment of $APP_NAME..."
    echo "=========================================="
    
    check_docker
    build_image
    cleanup_container
    deploy_container
    health_check
    show_status
    
    log_success "Deployment completed successfully!"
    log_info "Your Unified Payments API is now running on port 3001"
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    
    # Stop current container
    docker stop $CONTAINER_NAME || true
    docker rm $CONTAINER_NAME || true
    
    # Check if previous image exists
    if docker images | grep -q "$DOCKER_IMAGE"; then
        log_info "Removing current image..."
        docker rmi $DOCKER_IMAGE
    fi
    
    log_info "Rollback completed. Please check your configuration and try again."
}

# Parse command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "status")
        if docker ps --format "table {{.Names}}" | grep -q $CONTAINER_NAME; then
            show_status
        else
            log_warning "No running container found"
        fi
        ;;
    "logs")
        if docker ps --format "table {{.Names}}" | grep -q $CONTAINER_NAME; then
            docker logs -f $CONTAINER_NAME
        else
            log_warning "No running container found"
        fi
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy the application (default)"
        echo "  rollback - Rollback the deployment"
        echo "  status   - Show deployment status"
        echo "  logs     - Show container logs"
        echo "  help     - Show this help message"
        ;;
    *)
        log_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac 