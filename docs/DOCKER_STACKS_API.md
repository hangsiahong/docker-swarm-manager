# Docker Stacks API Documentation

## Overview

The Docker Stacks API provides comprehensive management of Docker Stacks, which are multi-service applications defined in Docker Compose files and deployed to Docker Swarm. This API enables you to deploy, update, scale, and manage entire application stacks with multiple interconnected services.

**⚠️ RESOURCE LIMITATION POLICY:**
All services in every stack are subject to **fixed resource limits**:

- **CPU**: 1.0 CPU per container (non-configurable)
- **Memory**: 2GB RAM per container (non-configurable)
- **CPU Reservation**: 0.25 CPU minimum per container
- **Memory Reservation**: 512MB minimum per container

**Scaling Strategy**: Users must scale horizontally by increasing replica count, not by increasing CPU/RAM per container. This ensures standardized resource allocation across all services in the cluster.

## Base URL

```
http://192.168.1.101:3456/api/stacks
```

## Authentication

Currently, no authentication is required. This should be implemented for production use.

---

## Resource Management Policy

### Fixed Resource Limits

Every service container deployed through this API is automatically limited to:

| Resource Type  | Limit         | Reservation | Notes                       |
| -------------- | ------------- | ----------- | --------------------------- |
| CPU            | 1.0 CPU       | 0.25 CPU    | Fixed, non-configurable     |
| Memory         | 2GB           | 512MB       | Fixed, non-configurable     |
| Scaling Method | Replicas only | N/A         | Horizontal scaling enforced |

### Why Fixed Resources?

1. **Standardization**: Ensures consistent performance expectations across all services
2. **Resource Planning**: Simplifies capacity planning and resource allocation
3. **Fairness**: Prevents any single service from monopolizing cluster resources
4. **Scaling Best Practices**: Encourages proper microservices scaling patterns

### How to Scale

❌ **Don't do this** (not possible):

```json
{
  "resources": {
    "limits": {
      "cpus": "2.0", // ← Will be ignored/overridden
      "memory": "4G" // ← Will be ignored/overridden
    }
  }
}
```

✅ **Do this instead**:

```json
{
  "deploy": {
    "replicas": 4 // ← Scale with more replicas
  }
}
```

---

## What are Docker Stacks?

Docker Stacks are a collection of services that make up an application in a distributed system. They are defined using Docker Compose files (typically `docker-compose.yml`) and deployed to Docker Swarm clusters. Stacks provide:

- **Multi-service orchestration**: Deploy multiple services as a single unit
- **Service dependencies**: Define startup order and dependencies between services
- **Network isolation**: Automatic network creation and service discovery
- **Volume management**: Shared storage across services
- **Configuration management**: Environment variables, secrets, and configs
- **Load balancing**: Built-in load balancing across service replicas
- **Fixed Resource Allocation**: Standardized 1 CPU, 2GB RAM per container

---

## Endpoints

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
    "UpdatedAt": "2025-05-29T10:05:00Z",
    "Status": "running",
    "Networks": ["myapp_frontend", "myapp_backend"],
    "Services": [
      {
        "ID": "myapp_web.1",
        "Name": "myapp_web",
        "Image": "nginx:latest",
        "Replicas": "2/2",
        "Status": "running"
      },
      {
        "ID": "myapp_api.1",
        "Name": "myapp_api",
        "Image": "myapp/api:latest",
        "Replicas": "3/3",
        "Status": "running"
      },
      {
        "ID": "myapp_db.1",
        "Name": "myapp_db",
        "Image": "postgres:13",
        "Replicas": "1/1",
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

#### Parameters

- `name` (path): Stack name

#### Response

```json
{
  "ID": "myapp_default",
  "Name": "myapp",
  "Orchestrator": "swarm",
  "CreatedAt": "2025-05-29T10:00:00Z",
  "UpdatedAt": "2025-05-29T10:05:00Z",
  "Status": "running",
  "ComposeFile": "version: '3.8'\nservices:\n  web:\n    image: nginx:latest\n    ports:\n      - \"80:80\"",
  "Services": [
    {
      "ID": "myapp_web.1",
      "Name": "myapp_web",
      "Image": "nginx:latest",
      "Replicas": "2/2",
      "Ports": ["80:80"],
      "Networks": ["myapp_frontend"],
      "Status": "running"
    }
  ],
  "Networks": [
    {
      "ID": "myapp_frontend",
      "Name": "myapp_frontend",
      "Driver": "overlay",
      "Scope": "swarm"
    }
  ],
  "Volumes": [
    {
      "Name": "myapp_db_data",
      "Driver": "local",
      "Scope": "local"
    }
  ]
}
```

#### Example

```bash
curl -X GET http://192.168.1.101:3456/api/stacks/myapp
```

---

### 3. Deploy Stack

**POST** `/api/stacks`

Deploys a new stack from a Docker Compose configuration with enforced resource limits.

#### ⚠️ Resource Limitation Notice

All services in the stack will automatically receive:

- **1 CPU limit** per container
- **2GB memory limit** per container
- **0.25 CPU reservation** per container
- **512MB memory reservation** per container

Any resource specifications in your compose file will be **ignored and overridden**.

#### Request Body

**Option 1: Multi-Service Definition (Recommended)**

```json
{
  "name": "string (required)",
  "version": "string (default: 3.8)",
  "services": {
    "service-name": {
      "image": "string (required)",
      "ports": ["string"],
      "environment": ["string"],
      "volumes": ["string"],
      "networks": ["string"],
      "deploy": {
        "replicas": "number (scale with this, not resources!)",
        "update_config": {
          "parallelism": "number",
          "delay": "string"
        }
      }
      // NOTE: resources block is ignored - fixed limits applied automatically
    }
  },
  "networks": {
    "network-name": {
      "driver": "string",
      "external": "boolean"
    }
  },
  "volumes": {
    "volume-name": {
      "driver": "string"
    }
  },
  "env": {
    "key": "value"
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
    "composeFile": "version: '\''3.8'\''\nservices:\n  frontend:\n    image: nginx:latest\n    ports:\n      - \"80:80\"\n    networks:\n      - frontend-net\n    deploy:\n      replicas: 2\n  api:\n    image: myapp/api:latest\n    ports:\n      - \"3000:3000\"\n    environment:\n      - NODE_ENV=production\n      - DATABASE_URL=postgresql://user:pass@postgres:5432/ecommerce\n    networks:\n      - frontend-net\n      - backend-net\n    deploy:\n      replicas: 3\n  postgres:\n    image: postgres:13\n    environment:\n      - POSTGRES_DB=ecommerce\n      - POSTGRES_USER=user\n      - POSTGRES_PASSWORD=password\n    volumes:\n      - db-data:/var/lib/postgresql/data\n    networks:\n      - backend-net\n    deploy:\n      replicas: 1\n  redis:\n    image: redis:alpine\n    networks:\n      - backend-net\n    deploy:\n      replicas: 1\nvolumes:\n  db-data:\nnetworks:\n  frontend-net:\n    driver: overlay\n  backend-net:\n    driver: overlay",
    "env": {
      "APP_VERSION": "v1.0.0",
      "DEBUG": "false"
    }
  }'
```

**Deploy Stack with Fixed Resource Limits:**

```bash
curl -X POST http://192.168.1.101:3456/api/stacks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "microservices-demo",
    "version": "3.8",
    "services": {
      "web": {
        "image": "nginx:latest",
        "ports": ["80:80", "443:443"],
        "networks": ["frontend"],
        "deploy": {
          "replicas": 2,
          "update_config": {
            "parallelism": 1,
            "delay": "10s"
          }
        }
        // Resources: Automatically set to 1 CPU, 2GB RAM per container
        // Total resources: 2 CPU, 4GB RAM (2 replicas × 1 CPU, 2GB each)
      },
      "api": {
        "image": "myapp/api:v2.0",
        "ports": ["3000:3000"],
        "environment": [
          "NODE_ENV=production",
          "DATABASE_URL=postgresql://api_user:secret@postgres:5432/appdb"
        ],
        "networks": ["frontend", "backend"],
        "deploy": {
          "replicas": 3  // Scale horizontally, not vertically!
        }
        // Resources: Automatically set to 1 CPU, 2GB RAM per container
        // Total resources: 3 CPU, 6GB RAM (3 replicas × 1 CPU, 2GB each)
      },
      "postgres": {
        "image": "postgres:13",
        "environment": [
          "POSTGRES_DB=appdb",
          "POSTGRES_USER=api_user",
          "POSTGRES_PASSWORD=secret"
        ],
        "volumes": ["db_data:/var/lib/postgresql/data"],
        "networks": ["backend"],
        "deploy": {
          "replicas": 1,
          "placement": {
            "constraints": ["node.role == manager"]
          }
        }
        // Resources: Automatically set to 1 CPU, 2GB RAM (1 replica)
      }
    },
    "networks": {
      "frontend": {
        "driver": "overlay"
      },
      "backend": {
        "driver": "overlay"
      }
    },
    "volumes": {
      "db_data": {
        "driver": "local"
      }
    },
    "env": {
      "STACK_VERSION": "2.0",
      "ENVIRONMENT": "production"
    }
  }'
```

**Deploy Simple WordPress Stack:**

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
          "WORDPRESS_DB_PASSWORD=wordpress123",
          "WORDPRESS_DB_NAME=wordpress"
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

Updates an existing stack with new configuration or service definitions.

#### Parameters

- `name` (path): Stack name

#### Request Body

Same format as creating a stack. Only changed services will be updated.

#### Examples

**Update Service Images:**

```bash
curl -X PUT http://192.168.1.101:3456/api/stacks/ecommerce-app \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ecommerce-app",
    "services": {
      "api": {
        "image": "myapp/api:v2.1.0",
        "deploy": {
          "replicas": 4,
          "update_config": {
            "parallelism": 2,
            "delay": "5s",
            "order": "start-first"
          }
        }
      },
      "frontend": {
        "image": "myapp/frontend:v1.5.0",
        "deploy": {
          "replicas": 3
        }
      }
    },
    "env": {
      "APP_VERSION": "v2.1.0"
    }
  }'
```

**Scale Services:**

```bash
curl -X PUT http://192.168.1.101:3456/api/stacks/microservices-demo \
  -H "Content-Type: application/json" \
  -d '{
    "name": "microservices-demo",
    "services": {
      "web": {
        "deploy": {
          "replicas": 4
        }
      },
      "api": {
        "deploy": {
          "replicas": 6
        }
      }
    }
  }'
```

---

### 5. Remove Stack

**DELETE** `/api/stacks/{name}`

Removes a stack and all its services, networks, and volumes.

#### Parameters

- `name` (path): Stack name

#### Query Parameters

- `volumes` (boolean, optional): Remove associated volumes (default: false)
- `networks` (boolean, optional): Remove associated networks (default: false)

#### Examples

**Remove Stack (keep volumes):**

```bash
curl -X DELETE http://192.168.1.101:3456/api/stacks/ecommerce-app
```

**Remove Stack and Volumes:**

```bash
curl -X DELETE "http://192.168.1.101:3456/api/stacks/ecommerce-app?volumes=true"
```

**Remove Stack, Volumes, and Networks:**

```bash
curl -X DELETE "http://192.168.1.101:3456/api/stacks/ecommerce-app?volumes=true&networks=true"
```

---

### 6. Get Stack Services

**GET** `/api/stacks/{name}/services`

Lists all services within a specific stack.

#### Parameters

- `name` (path): Stack name

#### Response

```json
[
  {
    "ID": "myapp_web.1",
    "Name": "myapp_web",
    "Image": "nginx:latest",
    "Mode": "replicated",
    "Replicas": "2/2",
    "Ports": [
      {
        "Protocol": "tcp",
        "TargetPort": 80,
        "PublishedPort": 8080
      }
    ],
    "Networks": ["myapp_frontend"],
    "UpdateStatus": {
      "State": "completed",
      "StartedAt": "2025-05-29T10:00:00Z",
      "CompletedAt": "2025-05-29T10:02:00Z"
    }
  }
]
```

#### Example

```bash
curl -X GET http://192.168.1.101:3456/api/stacks/ecommerce-app/services
```

---

### 7. Scale Stack Service

**POST** `/api/stacks/{name}/services/{serviceName}/scale`

Scales a specific service within a stack.

#### Parameters

- `name` (path): Stack name
- `serviceName` (path): Service name within the stack

#### Request Body

```json
{
  "replicas": "number (required)"
}
```

#### Example

```bash
curl -X POST http://192.168.1.101:3456/api/stacks/ecommerce-app/services/api/scale \
  -H "Content-Type: application/json" \
  -d '{"replicas": 5}'
```

---

### 8. Get Stack Logs

**GET** `/api/stacks/{name}/logs`

Retrieves logs from all services in a stack with enhanced filtering and pagination support.

#### Parameters

- `name` (path): Stack name

#### Query Parameters

- `service` (string, optional): Filter logs by specific service
- `tail` (number, optional): Number of lines to show from the end of the logs
- `since` (string, optional): Show logs since timestamp (e.g., "2025-05-29T10:00:00Z")
- `timestamps` (boolean, optional): Include timestamps in output (default: true)
- `replicaIndex` (number, optional): Get logs from specific replica (only when service is specified)
- `taskId` (string, optional): Get logs from specific task (only when service is specified)

#### Response

**Stack-wide logs:**

```json
{
  "logs": {
    "stackName": "ecommerce-app",
    "services": {
      "web": {
        "serviceName": "web",
        "logs": "web service logs...",
        "replicas": {
          "total": 3,
          "running": 3
        }
      },
      "api": {
        "serviceName": "api",
        "logs": "api service logs...",
        "replicas": {
          "total": 5,
          "running": 4
        }
      }
    },
    "metadata": {
      "totalServices": 3,
      "note": "Stack-wide logs are limited to improve performance. Use service-specific logs for full output."
    }
  }
}
```

**Service-specific logs:**

```json
{
  "logs": {
    "stackName": "ecommerce-app",
    "serviceName": "api",
    "logs": "api service log content...",
    "metadata": {
      "totalReplicas": 5,
      "runningReplicas": 4,
      "options": {
        "tail": 100
      },
      "note": "High replica count detected. Consider using 'tail' parameter for better performance."
    }
  }
}
```

#### Examples

**Get All Stack Logs (Limited for Performance):**

```bash
curl -X GET http://192.168.1.101:3456/api/stacks/ecommerce-app/logs
```

**Get Logs for Specific Service:**

```bash
curl -X GET "http://192.168.1.101:3456/api/stacks/ecommerce-app/logs?service=api&tail=100"
```

**Get Logs from Specific Replica of a Service:**

```bash
curl -X GET "http://192.168.1.101:3456/api/stacks/ecommerce-app/logs?service=api&replicaIndex=0&tail=50"
```

**Get Recent Logs:**

```bash
curl -X GET "http://192.168.1.101:3456/api/stacks/ecommerce-app/logs?service=api&since=2025-05-29T10:00:00Z&tail=200"
```

---

### 9. Get Stack Service Replicas

**GET** `/api/stacks/{name}/services/{serviceName}/replicas`

Retrieves detailed replica information for a specific service within a stack.

#### Parameters

- `name` (path): Stack name
- `serviceName` (path): Service name within the stack

#### Response

```json
{
  "serviceId": "ecommerce-app_api",
  "serviceName": "api",
  "stackName": "ecommerce-app",
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
curl -X GET http://192.168.1.101:3456/api/stacks/ecommerce-app/services/api/replicas
```

---

### 10. Get Stack Service Bulk Logs

**POST** `/api/stacks/{name}/services/{serviceName}/bulk-logs`

Retrieves logs from multiple replicas of a specific service within a stack.

#### Parameters

- `name` (path): Stack name
- `serviceName` (path): Service name within the stack

#### Request Body

```json
{
  "replicaIndexes": [0, 1, 2, 3, 4],
  "tail": 100,
  "since": "2025-05-29T10:00:00Z",
  "timestamps": true,
  "maxConcurrent": 5
}
```

#### Response

```json
{
  "serviceId": "ecommerce-app_api",
  "serviceName": "api",
  "stackName": "ecommerce-app",
  "totalReplicas": 20,
  "requestedReplicas": 5,
  "results": [
    {
      "replicaIndex": 0,
      "taskId": "task-id-1",
      "logs": "replica 0 logs...",
      "status": "success"
    },
    {
      "replicaIndex": 1,
      "taskId": "task-id-2",
      "logs": "replica 1 logs...",
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
curl -X POST http://192.168.1.101:3456/api/stacks/ecommerce-app/services/api/bulk-logs \
  -H "Content-Type: application/json" \
  -d '{
    "replicaIndexes": [0, 1, 2],
    "tail": 100,
    "maxConcurrent": 3
  }'
```

---

### 11. Get Stack Networks

**GET** `/api/stacks/{name}/networks`

Lists all networks associated with a stack.

#### Parameters

- `name` (path): Stack name

#### Response

```json
[
  {
    "ID": "network_id_123",
    "Name": "ecommerce-app_frontend",
    "Driver": "overlay",
    "Scope": "swarm",
    "Attachable": true,
    "Ingress": false,
    "IPAM": {
      "Driver": "default",
      "Config": [
        {
          "Subnet": "10.0.1.0/24"
        }
      ]
    },
    "Labels": {
      "com.docker.stack.namespace": "ecommerce-app"
    }
  }
]
```

#### Example

```bash
curl -X GET http://192.168.1.101:3456/api/stacks/ecommerce-app/networks
```

---

### 12. Get Stack Volumes

**GET** `/api/stacks/{name}/volumes`

Lists all volumes associated with a stack.

#### Parameters

- `name` (path): Stack name

#### Response

```json
[
  {
    "Name": "ecommerce-app_db_data",
    "Driver": "local",
    "Scope": "local",
    "Mountpoint": "/var/lib/docker/volumes/ecommerce-app_db_data/_data",
    "Labels": {
      "com.docker.stack.namespace": "ecommerce-app"
    },
    "UsageData": {
      "Size": 1073741824,
      "RefCount": 1
    }
  }
]
```

#### Example

```bash
curl -X GET http://192.168.1.101:3456/api/stacks/ecommerce-app/volumes
```

---

### 13. Restart Stack

**POST** `/api/stacks/{name}/restart`

Restarts all services in a stack.

#### Parameters

- `name` (path): Stack name

#### Request Body (Optional)

```json
{
  "services": ["service1", "service2"],
  "forceUpdate": "boolean (default: true)"
}
```

#### Examples

**Restart Entire Stack:**

```bash
curl -X POST http://192.168.1.101:3456/api/stacks/ecommerce-app/restart
```

**Restart Specific Services:**

```bash
curl -X POST http://192.168.1.101:3456/api/stacks/ecommerce-app/restart \
  -H "Content-Type: application/json" \
  -d '{
    "services": ["api", "frontend"],
    "forceUpdate": true
  }'
```

---

## Docker Compose Support

### Supported Compose Features

✅ **Fully Supported:**

- Services with image, ports, environment, volumes, networks
- Deploy configuration (replicas, update_config, placement)
- Networks (overlay, bridge) with custom configuration
- Volumes (named volumes, bind mounts)
- Environment variables and .env files
- Labels and custom metadata
- Health checks
- Resource limits and reservations

⚠️ **Partially Supported:**

- Secrets and configs (planned)
- External networks and volumes
- Build contexts (images must be pre-built)

❌ **Not Supported:**

- Docker Compose profiles
- Dependencies and depends_on (use deploy order)
- Host networking mode

### Example Complete Docker Compose Stack

```yaml
version: "3.8"

services:
  traefik:
    image: traefik:v2.9
    command:
      - "--api.dashboard=true"
      - "--providers.docker.swarmMode=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
    networks:
      - traefik-public
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager

  web:
    image: nginx:alpine
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.web.rule=Host(`example.com`)"
      - "traefik.http.services.web.loadbalancer.server.port=80"
    networks:
      - traefik-public
      - internal
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first

  api:
    image: myapp/api:latest
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://api:secret@postgres:5432/appdb
      - REDIS_URL=redis://redis:6379
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.example.com`)"
      - "traefik.http.services.api.loadbalancer.server.port=3000"
    networks:
      - traefik-public
      - internal
      - database
    deploy:
      replicas: 4
      resources:
        limits:
          cpus: "0.50"
          memory: 512M
        reservations:
          cpus: "0.25"
          memory: 256M

  postgres:
    image: postgres:13
    environment:
      - POSTGRES_DB=appdb
      - POSTGRES_USER=api
      - POSTGRES_PASSWORD=secret
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - database
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.labels.storage == ssd

  redis:
    image: redis:alpine
    networks:
      - internal
    deploy:
      replicas: 1

networks:
  traefik-public:
    driver: overlay
    attachable: true
  internal:
    driver: overlay
  database:
    driver: overlay

volumes:
  postgres_data:
    driver: local
```

---

## Best Practices

### 1. Stack Naming

- Use descriptive names (e.g., `ecommerce-prod`, `blog-staging`)
- Include environment in name for multi-environment deployments
- Use lowercase with hyphens (Docker convention)

### 2. Service Organization

- **Frontend tier**: Web servers, load balancers, reverse proxies
- **Application tier**: APIs, microservices, application servers
- **Data tier**: Databases, caches, message queues

### 3. Network Strategy

- Create separate networks for different tiers
- Use descriptive network names (`frontend-net`, `backend-net`, `db-net`)
- Leverage network aliases for service discovery

### 4. Volume Management

- Use named volumes for persistent data
- Separate application data from logs
- Consider backup strategies for critical volumes

### 5. Environment Configuration

- Use environment variables for configuration
- Store secrets in Docker secrets (when implemented)
- Use different compose files for different environments

### 6. Deployment Strategy

- Start with minimal replicas and scale up
- Use rolling updates for zero-downtime deployments
- Test stack updates in staging first
- Monitor service health during updates

---

## Error Handling

### Common Error Responses

**Invalid Compose File:**

```json
{
  "message": "Invalid Docker Compose format: services.web.image is required"
}
```

**Stack Already Exists:**

```json
{
  "message": "Stack 'myapp' already exists. Use PUT to update."
}
```

**Stack Not Found:**

```json
{
  "message": "Stack 'nonexistent' not found"
}
```

**Resource Constraints:**

```json
{
  "message": "Insufficient resources to deploy stack: Not enough memory available"
}
```

### HTTP Status Codes

- `200`: Success
- `201`: Stack created
- `204`: Stack deleted
- `400`: Bad Request (invalid compose file, validation error)
- `404`: Stack not found
- `409`: Conflict (stack already exists)
- `500`: Internal Server Error

---

## Complete Examples

### Example 1: Full E-commerce Platform

```bash
curl -X POST http://192.168.1.101:3456/api/stacks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ecommerce-platform",
    "services": {
      "nginx": {
        "image": "nginx:alpine",
        "ports": ["80:80", "443:443"],
        "volumes": [
          "./nginx.conf:/etc/nginx/nginx.conf:ro",
          "./ssl:/etc/nginx/ssl:ro"
        ],
        "networks": ["frontend"],
        "deploy": {
          "replicas": 2,
          "update_config": {
            "parallelism": 1,
            "delay": "10s"
          }
        }
      },
      "web-app": {
        "image": "mycompany/ecommerce-web:v2.0",
        "environment": [
          "NODE_ENV=production",
          "API_BASE_URL=http://api-service:3000",
          "REDIS_URL=redis://redis:6379"
        ],
        "networks": ["frontend", "backend"],
        "deploy": {
          "replicas": 4
        }
      },
      "api-service": {
        "image": "mycompany/ecommerce-api:v2.0",
        "environment": [
          "NODE_ENV=production",
          "DATABASE_URL=postgresql://api_user:secret123@postgres:5432/ecommerce",
          "REDIS_URL=redis://redis:6379",
          "JWT_SECRET=your-jwt-secret"
        ],
        "networks": ["backend", "database"],
        "deploy": {
          "replicas": 6,
          "resources": {
            "limits": {
              "cpus": "0.5",
              "memory": "512M"
            }
          }
        }
      },
      "postgres": {
        "image": "postgres:13",
        "environment": [
          "POSTGRES_DB=ecommerce",
          "POSTGRES_USER=api_user",
          "POSTGRES_PASSWORD=secret123"
        ],
        "volumes": ["postgres_data:/var/lib/postgresql/data"],
        "networks": ["database"],
        "deploy": {
          "replicas": 1,
          "placement": {
            "constraints": ["node.labels.storage == ssd"]
          }
        }
      },
      "redis": {
        "image": "redis:alpine",
        "networks": ["backend"],
        "deploy": {
          "replicas": 1
        }
      },
      "elasticsearch": {
        "image": "elasticsearch:7.17.0",
        "environment": [
          "discovery.type=single-node",
          "ES_JAVA_OPTS=-Xms512m -Xmx512m"
        ],
        "volumes": ["elasticsearch_data:/usr/share/elasticsearch/data"],
        "networks": ["backend"],
        "deploy": {
          "replicas": 1,
          "resources": {
            "limits": {
              "memory": "1G"
            }
          }
        }
      }
    },
    "networks": {
      "frontend": {
        "driver": "overlay"
      },
      "backend": {
        "driver": "overlay"
      },
      "database": {
        "driver": "overlay"
      }
    },
    "volumes": {
      "postgres_data": {},
      "elasticsearch_data": {}
    }
  }'
```

### Example 2: Update Stack with New API Version

```bash
curl -X PUT http://192.168.1.101:3456/api/stacks/ecommerce-platform \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ecommerce-platform",
    "services": {
      "api-service": {
        "image": "mycompany/ecommerce-api:v2.1",
        "deploy": {
          "replicas": 8,
          "update_config": {
            "parallelism": 2,
            "delay": "5s",
            "order": "start-first",
            "failure_action": "rollback"
          }
        }
      }
    }
  }'
```

### Example 3: Scale Stack Services

```bash
# Scale web application
curl -X POST http://192.168.1.101:3456/api/stacks/ecommerce-platform/services/web-app/scale \
  -H "Content-Type: application/json" \
  -d '{"replicas": 6}'

# Scale API service
curl -X POST http://192.168.1.101:3456/api/stacks/ecommerce-platform/services/api-service/scale \
  -H "Content-Type: application/json" \
  -d '{"replicas": 10}'
```

### Example 4: Monitor Stack

```bash
# Get stack status
curl -X GET http://192.168.1.101:3456/api/stacks/ecommerce-platform

# Get all services in stack
curl -X GET http://192.168.1.101:3456/api/stacks/ecommerce-platform/services

# Get logs from API service
curl -X GET "http://192.168.1.101:3456/api/stacks/ecommerce-platform/logs?service=api-service&tail=100"

# Get stack networks
curl -X GET http://192.168.1.101:3456/api/stacks/ecommerce-platform/networks
```

This Docker Stacks API provides a powerful way to manage multi-service applications in Docker Swarm, making it easy to deploy, update, and scale complex applications with proper service isolation and orchestration.
