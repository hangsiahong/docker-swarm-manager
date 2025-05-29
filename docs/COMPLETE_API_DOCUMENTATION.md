# Docker Swarm Manager API Documentation

## Overview

The Docker Swarm Manager provides a comprehensive REST API for managing Docker Swarm clusters, including services, stacks, and networks. This API simplifies Docker Swarm operations and provides advanced features like zero-downtime deployments, auto-scaling, network isolation, and multi-service stack management.

## Base URL

```
http://192.168.1.101:3456/api
```

## Authentication

Currently, no authentication is required. This should be implemented for production use.

---

## Table of Contents

1. [Docker Services API](#docker-services-api)
2. [Docker Stacks API](#docker-stacks-api)
3. [Docker Networks API](#docker-networks-api)
4. [Best Practices](#best-practices)
5. [Error Handling](#error-handling)
6. [Complete Examples](#complete-examples)

---

# Docker Services API

## Overview

The Docker Services API provides comprehensive management of individual Docker Swarm services, including creation, updates, scaling, and monitoring.

## Base URL

```
http://192.168.1.101:3456/api/services
```

---

## Service Endpoints

### 1. List All Services

**GET** `/api/services`

Lists all services in the Docker Swarm.

#### Response

```json
[
  {
    "ID": "ej4o28j1hrgyk9tixckexick2",
    "Version": { "Index": 123456 },
    "CreatedAt": "2025-05-29T10:00:00Z",
    "UpdatedAt": "2025-05-29T10:05:00Z",
    "Spec": {
      "Name": "my-web-service",
      "TaskTemplate": {
        "ContainerSpec": {
          "Image": "nginx:latest",
          "Env": ["NODE_ENV=production"]
        }
      },
      "Mode": {
        "Replicated": { "Replicas": 3 }
      }
    }
  }
]
```

#### Example

```bash
curl -X GET http://192.168.1.101:3456/api/services
```

---

### 2. Get Service by ID

**GET** `/api/services/{id}`

Retrieves detailed information about a specific service.

#### Parameters

- `id` (path): Service ID or name

#### Example

```bash
curl -X GET http://192.168.1.101:3456/api/services/ej4o28j1hrgyk9tixckexick2
```

---

### 3. Create Service

**POST** `/api/services`

Creates a new Docker service with optional network isolation and port publishing.

#### Request Body

```json
{
  "name": "string (required)",
  "image": "string (required)",
  "replicas": "number (default: 1)",
  "ports": [
    {
      "target": "number",
      "published": "number",
      "protocol": "string (default: tcp)",
      "publishMode": "string (default: ingress)"
    }
  ],
  "env": ["string"],
  "labels": {
    "key": "value"
  },
  "networks": ["string"],
  "networkIds": ["string"],
  "networkOptions": {
    "network-name": {
      "driver": "string (default: overlay)",
      "attachable": "boolean (default: true)",
      "aliases": ["string"]
    }
  }
}
```

#### Examples

**Basic Web Service:**

```bash
curl -X POST http://192.168.1.101:3456/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "web-app",
    "image": "nginx:latest",
    "replicas": 2,
    "ports": [{"target": 80, "published": 8080}],
    "env": ["ENV=production"]
  }'
```

**Internal Service with Custom Network:**

```bash
curl -X POST http://192.168.1.101:3456/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "api-service",
    "image": "node:16-alpine",
    "replicas": 3,
    "env": ["NODE_ENV=production"],
    "networkIds": ["backend-network"],
    "networkOptions": {
      "backend-network": {
        "driver": "overlay",
        "attachable": true,
        "aliases": ["api", "backend"]
      }
    }
  }'
```

---

### 4. Update Service

**PUT** `/api/services/{id}`

Updates an existing service.

#### Request Body

```json
{
  "image": "string",
  "replicas": "number",
  "env": ["string"],
  "labels": {
    "key": "value"
  }
}
```

#### Example

```bash
curl -X PUT http://192.168.1.101:3456/api/services/ej4o28j1hrgyk9tixckexick2 \
  -H "Content-Type: application/json" \
  -d '{
    "replicas": 5,
    "env": ["NODE_ENV=production", "DEBUG=true"]
  }'
```

---

### 5. Scale Service

**POST** `/api/services/{id}/scale`

Scales a service to the specified number of replicas.

#### Request Body

```json
{
  "replicas": "number (required)"
}
```

#### Example

```bash
curl -X POST http://192.168.1.101:3456/api/services/ej4o28j1hrgyk9tixckexick2/scale \
  -H "Content-Type: application/json" \
  -d '{"replicas": 10}'
```

---

### 6. Rolling Update

**POST** `/api/services/{id}/rolling-update`

Performs a rolling update with zero-downtime deployment.

#### Request Body

```json
{
  "image": "string (required)",
  "updateConfig": {
    "parallelism": "number (default: 1)",
    "delay": "string (default: 10s)",
    "failureAction": "string (default: rollback)",
    "order": "string (default: start-first)"
  }
}
```

#### Example

```bash
curl -X POST http://192.168.1.101:3456/api/services/ej4o28j1hrgyk9tixckexick2/rolling-update \
  -H "Content-Type: application/json" \
  -d '{
    "image": "myapp:v2.0",
    "updateConfig": {
      "parallelism": 2,
      "delay": "5s",
      "order": "start-first"
    }
  }'
```

---

### 7. Update Environment Variables

**PUT** `/api/services/{id}/environment`

Updates only the environment variables of a service.

#### Request Body

```json
{
  "env": ["string"]
}
```

#### Example

```bash
curl -X PUT http://192.168.1.101:3456/api/services/ej4o28j1hrgyk9tixckexick2/environment \
  -H "Content-Type: application/json" \
  -d '{
    "env": ["NODE_ENV=staging", "DEBUG=true", "API_KEY=new-secret"]
  }'
```

---

### 8. Get Service Tasks

**GET** `/api/services/{id}/tasks`

Retrieves all tasks (containers) for a specific service.

#### Example

```bash
curl -X GET http://192.168.1.101:3456/api/services/ej4o28j1hrgyk9tixckexick2/tasks
```

---

### 9. Get Service Logs

**GET** `/api/services/{id}/logs`

Retrieves logs from all tasks of a service.

#### Example

```bash
curl -X GET http://192.168.1.101:3456/api/services/ej4o28j1hrgyk9tixckexick2/logs
```

---

### 10. Delete Service

**DELETE** `/api/services/{id}`

Removes a service from the swarm.

#### Example

```bash
curl -X DELETE http://192.168.1.101:3456/api/services/ej4o28j1hrgyk9tixckexick2
```

---

# Docker Stacks API

## Overview

The Docker Stacks API provides comprehensive management of Docker Stacks - multi-service applications defined in Docker Compose files and deployed to Docker Swarm.

## Base URL

```
http://192.168.1.101:3456/api/stacks
```

---

## Stack Endpoints

### 1. List All Stacks

**GET** `/api/stacks`

Lists all stacks currently deployed in the Docker Swarm.

#### Response

```json
[
  {
    "ID": "myapp_default",
    "Name": "myapp",
    "Services": 3,
    "Orchestrator": "swarm",
    "CreatedAt": "2025-05-29T10:00:00Z",
    "Status": "running",
    "Services": [
      {
        "ID": "myapp_web.1",
        "Name": "myapp_web",
        "Image": "nginx:latest",
        "Replicas": "2/2",
        "Status": "running"
      }
    ]
  }
]
```

#### Example

```bash
curl -X GET http://192.168.1.101:3456/api/stacks
```

---

### 2. Get Stack by Name

**GET** `/api/stacks/{name}`

Retrieves detailed information about a specific stack.

#### Example

```bash
curl -X GET http://192.168.1.101:3456/api/stacks/myapp
```

---

### 3. Deploy Stack

**POST** `/api/stacks`

Deploys a new stack from a Docker Compose configuration.

#### Request Body Options

**Option 1: Service Definition**

```json
{
  "name": "string (required)",
  "version": "string (default: 3.8)",
  "services": {
    "service-name": {
      "image": "string (required)",
      "ports": ["string"],
      "environment": ["string"],
      "networks": ["string"],
      "deploy": {
        "replicas": "number"
      }
    }
  },
  "networks": {
    "network-name": {
      "driver": "string"
    }
  },
  "volumes": {
    "volume-name": {}
  }
}
```

#### Examples

**Deploy Complete Application Stack:**

```bash
curl -X POST http://192.168.1.101:3456/api/stacks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ecommerce-app",
    "services": {
      "frontend": {
        "image": "nginx:latest",
        "ports": ["80:80"],
        "networks": ["frontend-net"],
        "deploy": {
          "replicas": 2
        }
      },
      "api": {
        "image": "myapp/api:latest",
        "ports": ["3000:3000"],
        "environment": [
          "NODE_ENV=production",
          "DATABASE_URL=postgresql://user:pass@postgres:5432/ecommerce"
        ],
        "networks": ["frontend-net", "backend-net"],
        "deploy": {
          "replicas": 3
        }
      },
      "postgres": {
        "image": "postgres:13",
        "environment": [
          "POSTGRES_DB=ecommerce",
          "POSTGRES_USER=user",
          "POSTGRES_PASSWORD=password"
        ],
        "volumes": ["db-data:/var/lib/postgresql/data"],
        "networks": ["backend-net"],
        "deploy": {
          "replicas": 1
        }
      }
    },
    "volumes": {
      "db-data": {}
    },
    "networks": {
      "frontend-net": {
        "driver": "overlay"
      },
      "backend-net": {
        "driver": "overlay"
      }
    }
  }'
```

**Deploy WordPress Stack:**

```bash
curl -X POST http://192.168.1.101:3456/api/stacks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "wordpress",
    "services": {
      "wordpress": {
        "image": "wordpress:latest",
        "ports": ["8080:80"],
        "environment": [
          "WORDPRESS_DB_HOST=mysql:3306",
          "WORDPRESS_DB_USER=wordpress",
          "WORDPRESS_DB_PASSWORD=wordpress123"
        ],
        "networks": ["wordpress-net"],
        "deploy": {
          "replicas": 2
        }
      },
      "mysql": {
        "image": "mysql:8.0",
        "environment": [
          "MYSQL_DATABASE=wordpress",
          "MYSQL_USER=wordpress",
          "MYSQL_PASSWORD=wordpress123",
          "MYSQL_ROOT_PASSWORD=rootpassword123"
        ],
        "volumes": ["mysql_data:/var/lib/mysql"],
        "networks": ["wordpress-net"],
        "deploy": {
          "replicas": 1
        }
      }
    },
    "networks": {
      "wordpress-net": {
        "driver": "overlay"
      }
    },
    "volumes": {
      "mysql_data": {}
    }
  }'
```

---

### 4. Update Stack

**PUT** `/api/stacks/{name}`

Updates an existing stack with new configuration.

#### Example

```bash
curl -X PUT http://192.168.1.101:3456/api/stacks/ecommerce-app \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ecommerce-app",
    "services": {
      "api": {
        "image": "myapp/api:v2.1.0",
        "deploy": {
          "replicas": 4
        }
      }
    }
  }'
```

---

### 5. Remove Stack

**DELETE** `/api/stacks/{name}`

Removes a stack and all its services.

#### Query Parameters

- `volumes` (boolean): Remove associated volumes (default: false)
- `networks` (boolean): Remove associated networks (default: false)

#### Examples

```bash
# Remove stack (keep volumes)
curl -X DELETE http://192.168.1.101:3456/api/stacks/ecommerce-app

# Remove stack and volumes
curl -X DELETE "http://192.168.1.101:3456/api/stacks/ecommerce-app?volumes=true"
```

---

### 6. Get Stack Services

**GET** `/api/stacks/{name}/services`

Lists all services within a specific stack.

#### Example

```bash
curl -X GET http://192.168.1.101:3456/api/stacks/ecommerce-app/services
```

---

### 7. Scale Stack Service

**POST** `/api/stacks/{name}/services/{serviceName}/scale`

Scales a specific service within a stack.

#### Example

```bash
curl -X POST http://192.168.1.101:3456/api/stacks/ecommerce-app/services/api/scale \
  -H "Content-Type: application/json" \
  -d '{"replicas": 5}'
```

---

### 8. Get Stack Logs

**GET** `/api/stacks/{name}/logs`

Retrieves logs from all services in a stack.

#### Query Parameters

- `service` (string): Filter logs by specific service
- `tail` (number): Number of lines to show

#### Example

```bash
curl -X GET "http://192.168.1.101:3456/api/stacks/ecommerce-app/logs?service=api&tail=100"
```

---

# Docker Networks API

## Overview

The Docker Networks API provides management of Docker overlay networks for service isolation.

## Base URL

```
http://192.168.1.101:3456/api/networks
```

---

## Network Endpoints

### 1. List All Networks

**GET** `/api/networks`

Lists all networks in the Docker Swarm.

#### Example

```bash
curl -X GET http://192.168.1.101:3456/api/networks
```

---

### 2. Create Network

**POST** `/api/networks`

Creates a new overlay network.

#### Request Body

```json
{
  "name": "string (required)",
  "driver": "string (default: overlay)",
  "attachable": "boolean (default: true)",
  "options": {}
}
```

#### Example

```bash
curl -X POST http://192.168.1.101:3456/api/networks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-network",
    "driver": "overlay",
    "attachable": true
  }'
```

---

### 3. Get Network

**GET** `/api/networks/{id}`

Gets detailed information about a network.

#### Example

```bash
curl -X GET http://192.168.1.101:3456/api/networks/my-network
```

---

### 4. Delete Network

**DELETE** `/api/networks/{id}`

Removes a network.

#### Example

```bash
curl -X DELETE http://192.168.1.101:3456/api/networks/my-network
```

---

# Best Practices

## Service Management

1. **Port Publishing**: Only publish ports for services that need external access
2. **Environment Variables**: Use for configuration, not secrets
3. **Scaling**: Start small and scale based on load
4. **Networks**: Create isolated networks for different application tiers

## Stack Management

1. **Naming**: Use descriptive names with environment prefixes
2. **Service Organization**: Separate frontend, backend, and data tiers
3. **Volume Strategy**: Use named volumes for persistent data
4. **Update Strategy**: Use rolling updates for zero-downtime deployments

## Network Strategy

1. **Isolation**: Create separate networks for different security zones
2. **Naming**: Use descriptive names (frontend-net, backend-net, db-net)
3. **Service Discovery**: Leverage network aliases for internal communication

---

# Error Handling

## HTTP Status Codes

- `200`: Success
- `201`: Created
- `204`: Deleted
- `400`: Bad Request (validation error)
- `404`: Resource not found
- `500`: Internal Server Error

## Common Error Responses

```json
{
  "message": "Service not found"
}
```

```json
{
  "message": "Failed to create service: Name and image are required"
}
```

---

# Complete Examples

## Example 1: Microservices E-commerce Platform

### Step 1: Create Database Services

```bash
# PostgreSQL Database
curl -X POST http://192.168.1.101:3456/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "postgres-db",
    "image": "postgres:13",
    "replicas": 1,
    "env": [
      "POSTGRES_DB=ecommerce",
      "POSTGRES_USER=admin",
      "POSTGRES_PASSWORD=secret123"
    ],
    "networkIds": ["database-net"],
    "networkOptions": {
      "database-net": {
        "aliases": ["postgres", "db"]
      }
    }
  }'

# Redis Cache
curl -X POST http://192.168.1.101:3456/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "redis-cache",
    "image": "redis:alpine",
    "replicas": 1,
    "networkIds": ["backend-net"],
    "networkOptions": {
      "backend-net": {
        "aliases": ["redis", "cache"]
      }
    }
  }'
```

### Step 2: Deploy API Services

```bash
curl -X POST http://192.168.1.101:3456/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "user-api",
    "image": "mycompany/user-api:v1.0",
    "replicas": 3,
    "ports": [{"target": 3000, "published": 4000}],
    "env": [
      "NODE_ENV=production",
      "DATABASE_URL=postgresql://admin:secret123@postgres:5432/ecommerce",
      "REDIS_URL=redis://redis:6379"
    ],
    "networkIds": ["backend-net", "database-net"],
    "networkOptions": {
      "backend-net": {
        "aliases": ["user-api", "users"]
      }
    }
  }'

curl -X POST http://192.168.1.101:3456/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "product-api",
    "image": "mycompany/product-api:v1.0",
    "replicas": 4,
    "ports": [{"target": 3000, "published": 4001}],
    "env": [
      "NODE_ENV=production",
      "DATABASE_URL=postgresql://admin:secret123@postgres:5432/ecommerce"
    ],
    "networkIds": ["backend-net", "database-net"],
    "networkOptions": {
      "backend-net": {
        "aliases": ["product-api", "products"]
      }
    }
  }'
```

### Step 3: Deploy Frontend

```bash
curl -X POST http://192.168.1.101:3456/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "web-frontend",
    "image": "mycompany/ecommerce-web:v1.0",
    "replicas": 3,
    "ports": [{"target": 80, "published": 80}],
    "env": [
      "API_BASE_URL=http://api-gateway:3000"
    ],
    "networkIds": ["frontend-net"]
  }'
```

### Step 4: Scale Services Based on Load

```bash
# Scale user API for high traffic
curl -X POST http://192.168.1.101:3456/api/services/user-api/scale \
  -H "Content-Type: application/json" \
  -d '{"replicas": 6}'

# Scale product API
curl -X POST http://192.168.1.101:3456/api/services/product-api/scale \
  -H "Content-Type: application/json" \
  -d '{"replicas": 8}'
```

### Step 5: Update Services

```bash
# Rolling update for user API
curl -X POST http://192.168.1.101:3456/api/services/user-api/rolling-update \
  -H "Content-Type: application/json" \
  -d '{
    "image": "mycompany/user-api:v1.1",
    "updateConfig": {
      "parallelism": 2,
      "delay": "10s",
      "order": "start-first"
    }
  }'
```

## Example 2: Deploy Stack with Dependencies

```bash
curl -X POST http://192.168.1.101:3456/api/stacks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "monitoring-stack",
    "services": {
      "prometheus": {
        "image": "prom/prometheus:latest",
        "ports": ["9090:9090"],
        "volumes": ["prometheus_data:/prometheus"],
        "networks": ["monitoring"],
        "deploy": {
          "replicas": 1
        }
      },
      "grafana": {
        "image": "grafana/grafana:latest",
        "ports": ["3000:3000"],
        "environment": [
          "GF_SECURITY_ADMIN_PASSWORD=admin123"
        ],
        "volumes": ["grafana_data:/var/lib/grafana"],
        "networks": ["monitoring"],
        "deploy": {
          "replicas": 1
        }
      },
      "node-exporter": {
        "image": "prom/node-exporter:latest",
        "volumes": [
          "/proc:/host/proc:ro",
          "/sys:/host/sys:ro",
          "/:/rootfs:ro"
        ],
        "networks": ["monitoring"],
        "deploy": {
          "mode": "global"
        }
      }
    },
    "networks": {
      "monitoring": {
        "driver": "overlay"
      }
    },
    "volumes": {
      "prometheus_data": {},
      "grafana_data": {}
    }
  }'
```

This comprehensive API documentation provides all the necessary information to manage Docker Swarm clusters through a REST API, supporting both individual service management and complex multi-service stack deployments.
