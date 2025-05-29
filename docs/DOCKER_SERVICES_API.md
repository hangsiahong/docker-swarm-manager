# Docker Services API Documentation

## Overview

The Docker Services API provides comprehensive management of Docker Swarm services, including creation, updates, scaling, and monitoring. This API abstracts Docker service management into RESTful endpoints with advanced features like network isolation, zero-downtime updates, and environment management.

## Base URL

```
http://192.168.1.101:3456/api/services
```

## Authentication

Currently, no authentication is required. This should be implemented for production use.

---

## Endpoints

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

#### Response

```json
{
  "ID": "ej4o28j1hrgyk9tixckexick2",
  "Spec": {
    "Name": "my-web-service",
    "TaskTemplate": {
      "ContainerSpec": {
        "Image": "nginx:latest",
        "Env": ["NODE_ENV=production", "PORT=80"]
      }
    }
  }
}
```

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

**Basic Web Service with Published Ports:**

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

**Internal Service (No Published Ports):**

```bash
curl -X POST http://192.168.1.101:3456/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "database",
    "image": "postgres:13",
    "replicas": 1,
    "env": [
      "POSTGRES_DB=myapp",
      "POSTGRES_USER=admin",
      "POSTGRES_PASSWORD=secret123"
    ]
  }'
```

**Service with Custom Network (Auto-created):**

```bash
curl -X POST http://192.168.1.101:3456/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "api-service",
    "image": "node:16-alpine",
    "replicas": 3,
    "ports": [{"target": 3000, "published": 4000}],
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

**Multi-Network Service:**

```bash
curl -X POST http://192.168.1.101:3456/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "fullstack-app",
    "image": "myapp:latest",
    "replicas": 2,
    "ports": [{"target": 3000, "published": 5000}],
    "env": ["NODE_ENV=production"],
    "networkIds": ["frontend-net", "backend-net"],
    "networkOptions": {
      "frontend-net": {
        "aliases": ["web", "frontend"]
      },
      "backend-net": {
        "aliases": ["api", "backend"]
      }
    }
  }'
```

---

### 4. Update Service

**PUT** `/api/services/{id}`

Updates an existing service. Supports updating image, replicas, environment variables, and more.

#### Parameters

- `id` (path): Service ID or name

#### Request Body

```json
{
  "image": "string",
  "replicas": "number",
  "env": ["string"],
  "labels": {
    "key": "value"
  },
  "ports": [
    {
      "target": "number",
      "published": "number"
    }
  ]
}
```

#### Examples

**Update Replicas and Environment:**

```bash
curl -X PUT http://192.168.1.101:3456/api/services/ej4o28j1hrgyk9tixckexick2 \
  -H "Content-Type: application/json" \
  -d '{
    "replicas": 5,
    "env": [
      "NODE_ENV=production",
      "DEBUG=true",
      "LOG_LEVEL=info",
      "DATABASE_URL=postgresql://user:pass@db:5432/myapp"
    ]
  }'
```

**Update Image Only:**

```bash
curl -X PUT http://192.168.1.101:3456/api/services/ej4o28j1hrgyk9tixckexick2 \
  -H "Content-Type: application/json" \
  -d '{
    "image": "nginx:alpine"
  }'
```

---

### 5. Scale Service

**POST** `/api/services/{id}/scale`

Scales a service to the specified number of replicas.

#### Parameters

- `id` (path): Service ID or name

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

Performs a rolling update with configurable parameters for zero-downtime deployments.

#### Parameters

- `id` (path): Service ID or name

#### Request Body

```json
{
  "image": "string (required)",
  "updateConfig": {
    "parallelism": "number (default: 1)",
    "delay": "string (default: 10s)",
    "failureAction": "string (default: rollback)",
    "monitor": "string (default: 5s)",
    "maxFailureRatio": "number (default: 0)",
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
      "failureAction": "rollback",
      "order": "start-first"
    }
  }'
```

---

### 7. Update Environment Variables

**PUT** `/api/services/{id}/environment`

Updates only the environment variables of a service.

#### Parameters

- `id` (path): Service ID or name

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
    "env": [
      "NODE_ENV=staging",
      "DEBUG=true",
      "API_KEY=new-secret-key",
      "DATABASE_URL=postgresql://user:pass@staging-db:5432/myapp"
    ]
  }'
```

---

### 8. Get Service Tasks

**GET** `/api/services/{id}/tasks`

Retrieves all tasks (containers) for a specific service.

#### Parameters

- `id` (path): Service ID or name

#### Response

```json
[
  {
    "ID": "task-id-1",
    "ServiceID": "ej4o28j1hrgyk9tixckexick2",
    "NodeID": "node-id-1",
    "Status": {
      "State": "running",
      "Timestamp": "2025-05-29T10:00:00Z"
    },
    "DesiredState": "running"
  }
]
```

#### Example

```bash
curl -X GET http://192.168.1.101:3456/api/services/ej4o28j1hrgyk9tixckexick2/tasks
```

---

### 9. Get Service Logs

**GET** `/api/services/{id}/logs`

Retrieves logs from all tasks of a service with enhanced filtering and pagination support for high replica counts.

#### Parameters

- `id` (path): Service ID or name

#### Query Parameters

- `taskId` (string, optional): Get logs from a specific task/container
- `replicaIndex` (number, optional): Get logs from a specific replica (0-based index)
- `tail` (number, optional): Number of lines to show from the end of the logs (max 1000 for performance)
- `since` (string, optional): Show logs since timestamp (e.g., "2025-05-29T10:00:00Z")
- `follow` (boolean, optional): Follow log output (stream logs)
- `timestamps` (boolean, optional): Include timestamps in output (default: true)

#### Response

```json
{
  "logs": "2025-05-29T10:00:00Z service log line 1\n2025-05-29T10:01:00Z service log line 2",
  "metadata": {
    "serviceId": "ej4o28j1hrgyk9tixckexick2",
    "serviceName": "my-web-service",
    "totalReplicas": 20,
    "runningReplicas": 18,
    "options": {
      "tail": 100,
      "note": "High replica count detected. Consider using 'tail' parameter for better performance."
    }
  }
}
```

#### Examples

**Get Recent Logs (Last 100 Lines):**

```bash
curl -X GET "http://192.168.1.101:3456/api/services/ej4o28j1hrgyk9tixckexick2/logs?tail=100"
```

**Get Logs from Specific Replica:**

```bash
curl -X GET "http://192.168.1.101:3456/api/services/ej4o28j1hrgyk9tixckexick2/logs?replicaIndex=0&tail=50"
```

**Get Logs Since Specific Time:**

```bash
curl -X GET "http://192.168.1.101:3456/api/services/ej4o28j1hrgyk9tixckexick2/logs?since=2025-05-29T10:00:00Z&tail=200"
```

**Get Logs from Specific Task:**

```bash
curl -X GET "http://192.168.1.101:3456/api/services/ej4o28j1hrgyk9tixckexick2/logs?taskId=task-id-123"
```

---

### 10. Get Service Replicas

**GET** `/api/services/{id}/replicas`

Retrieves detailed information about all replicas/tasks of a service.

#### Parameters

- `id` (path): Service ID or name

#### Response

```json
{
  "serviceId": "ej4o28j1hrgyk9tixckexick2",
  "serviceName": "my-web-service",
  "totalReplicas": 20,
  "runningReplicas": 18,
  "replicas": [
    {
      "index": 0,
      "taskId": "task-id-1",
      "nodeId": "node-id-1",
      "status": "running",
      "containerId": "container-id-1",
      "createdAt": "2025-05-29T10:00:00Z",
      "updatedAt": "2025-05-29T10:05:00Z",
      "desired": "running",
      "message": null,
      "error": null
    }
  ]
}
```

#### Example

```bash
curl -X GET http://192.168.1.101:3456/api/services/ej4o28j1hrgyk9tixckexick2/replicas
```

---

### 11. Get Bulk Replica Logs

**POST** `/api/services/{id}/bulk-logs`

Retrieves logs from multiple replicas simultaneously with performance optimizations for high replica count services.

#### Parameters

- `id` (path): Service ID or name

#### Request Body

```json
{
  "replicaIndexes": [0, 1, 2],
  "tail": 100,
  "since": "2025-05-29T10:00:00Z",
  "timestamps": true,
  "maxConcurrent": 5
}
```

#### Request Body Parameters

- `replicaIndexes` (array, optional): Array of replica indexes to get logs from (if not specified, logs from first 5 replicas)
- `tail` (number, optional): Number of lines to show from each replica (max 1000)
- `since` (string, optional): Show logs since timestamp
- `timestamps` (boolean, optional): Include timestamps in output
- `maxConcurrent` (number, optional): Maximum concurrent replica log requests (max 10)

#### Response

```json
{
  "serviceId": "ej4o28j1hrgyk9tixckexick2",
  "serviceName": "my-web-service",
  "totalReplicas": 20,
  "requestedReplicas": 3,
  "results": [
    {
      "replicaIndex": 0,
      "taskId": "task-id-1",
      "logs": "replica 0 log content",
      "status": "success"
    },
    {
      "replicaIndex": 1,
      "taskId": "task-id-2",
      "logs": "replica 1 log content",
      "status": "success"
    }
  ],
  "metadata": {
    "maxConcurrent": 5,
    "tailLines": 100,
    "note": "Service has 20 replicas. Bulk log requests are limited to 5 concurrent replicas for performance."
  }
}
```

#### Example

```bash
curl -X POST http://192.168.1.101:3456/api/services/ej4o28j1hrgyk9tixckexick2/bulk-logs \
  -H "Content-Type: application/json" \
  -d '{
    "replicaIndexes": [0, 1, 2, 3, 4],
    "tail": 100,
    "maxConcurrent": 3
  }'
```

---

### 12. Delete Service

**DELETE** `/api/services/{id}`

Removes a service from the swarm.

#### Parameters

- `id` (path): Service ID or name

#### Example

```bash
curl -X DELETE http://192.168.1.101:3456/api/services/ej4o28j1hrgyk9tixckexick2
```

---

## Performance Considerations for High Replica Count Services

When working with services that have many replicas (20-40+), consider these best practices:

### 1. Use Pagination for Logs

- Always use the `tail` parameter to limit log output
- Default service logs without `tail` can overwhelm the system with high replica counts
- Maximum `tail` value is capped at 1000 lines for performance

### 2. Replica-Specific Logging

- Use `replicaIndex` or `taskId` parameters to get logs from specific replicas
- This is much more efficient than retrieving logs from all replicas

### 3. Bulk Replica Operations

- Use the bulk logs endpoint for getting logs from multiple specific replicas
- The system automatically limits concurrent requests to prevent overload
- Maximum `maxConcurrent` value is capped at 10

### 4. Monitoring Replica Health

- Use the `/replicas` endpoint to monitor replica status before requesting logs
- This helps identify which replicas are running and available for log retrieval

### Example: Safe Logging Strategy for High Replica Services

```bash
# 1. First, check replica status
curl -X GET http://192.168.1.101:3456/api/services/high-replica-service/replicas

# 2. Get logs from first few running replicas only
curl -X POST http://192.168.1.101:3456/api/services/high-replica-service/bulk-logs \
  -H "Content-Type: application/json" \
  -d '{
    "replicaIndexes": [0, 1, 2],
    "tail": 100,
    "maxConcurrent": 3
  }'

# 3. If needed, get logs from specific problematic replica
curl -X GET "http://192.168.1.101:3456/api/services/high-replica-service/logs?replicaIndex=5&tail=200"
```

## Network Management

### Auto-Network Creation

When creating services with `networkIds`, networks are automatically created if they don't exist. This enables:

- **Service Isolation**: Services can only communicate within their designated networks
- **Simplified Deployment**: No need to manually create networks before services
- **Network Aliases**: Services can be accessed by friendly names within networks

### Network Configuration Options

```json
{
  "networkOptions": {
    "my-network": {
      "driver": "overlay",
      "attachable": true,
      "ingress": false,
      "aliases": ["service-alias", "another-alias"],
      "labels": {
        "environment": "production"
      }
    }
  }
}
```

---

## Best Practices

### 1. Port Publishing

- **Don't publish ports** for internal services (databases, caches)
- **Publish ports** only for services that need external access
- Use different published ports to avoid conflicts

### 2. Environment Variables

- Store sensitive data in Docker secrets (not implemented yet)
- Use descriptive environment variable names
- Update environment variables will trigger container restarts

### 3. Scaling

- Start with fewer replicas and scale up based on load
- Use rolling updates for zero-downtime deployments
- Monitor service health during scaling operations

### 4. Networks

- Create isolated networks for different application tiers
- Use meaningful network names (e.g., `frontend-net`, `backend-net`, `database-net`)
- Leverage network aliases for service discovery

---

## Error Handling

### Common Error Responses

```json
{
  "message": "Failed to create service: Name and image are required"
}
```

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `404`: Service not found
- `500`: Internal Server Error

---

## Examples: Complete Microservices Setup

### 1. Create Database Service

```bash
curl -X POST http://192.168.1.101:3456/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "postgres-db",
    "image": "postgres:13",
    "replicas": 1,
    "env": [
      "POSTGRES_DB=myapp",
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
```

### 2. Create Cache Service

```bash
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

### 3. Create API Service

```bash
curl -X POST http://192.168.1.101:3456/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "api-service",
    "image": "myapp/api:latest",
    "replicas": 3,
    "ports": [{"target": 3000, "published": 4000}],
    "env": [
      "NODE_ENV=production",
      "DATABASE_URL=postgresql://admin:secret123@postgres:5432/myapp",
      "REDIS_URL=redis://redis:6379"
    ],
    "networkIds": ["backend-net", "database-net"],
    "networkOptions": {
      "backend-net": {
        "aliases": ["api", "backend"]
      },
      "database-net": {
        "aliases": ["api-service"]
      }
    }
  }'
```

### 4. Scale API Service

```bash
curl -X POST http://192.168.1.101:3456/api/services/api-service/scale \
  -H "Content-Type: application/json" \
  -d '{"replicas": 5}'
```

### 5. Update Environment Variables

```bash
curl -X PUT http://192.168.1.101:3456/api/services/api-service/environment \
  -H "Content-Type: application/json" \
  -d '{
    "env": [
      "NODE_ENV=production",
      "DEBUG=false",
      "LOG_LEVEL=warn",
      "DATABASE_URL=postgresql://admin:newsecret@postgres:5432/myapp",
      "REDIS_URL=redis://redis:6379",
      "API_RATE_LIMIT=1000"
    ]
  }'
```

This API provides a powerful and flexible way to manage Docker Swarm services with advanced features for production deployments.
