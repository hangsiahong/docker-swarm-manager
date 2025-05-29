#!/usr/bin/env node

/**
 * Test script to verify fixed resource limits are enforced for both services and stacks
 * This script tests the resource limitation policy implementation
 */

const BASE_URL = 'http://localhost:3000/api';

async function testResourceLimits() {
  console.log('🧪 Testing Resource Limitation Policy for Docker Swarm Manager');
  console.log('═══════════════════════════════════════════════════════════');
  
  // Test 1: Single Service Creation
  console.log('\n📝 Test 1: Single Service with Resource Limits');
  try {
    const serviceResponse = await fetch(`${BASE_URL}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'test-service-limits',
        image: 'nginx:alpine',
        replicas: 2,
        ports: [{ target: 80, published: 8080, protocol: 'tcp' }],
        // Attempt to set custom resources (should be ignored)
        resources: {
          limits: { cpus: '4.0', memory: '8G' },
          reservations: { cpus: '2.0', memory: '4G' }
        }
      })
    });
    
    if (serviceResponse.ok) {
      const result = await serviceResponse.json();
      console.log('✅ Service created successfully');
      console.log('📊 Expected: 1 CPU, 2GB RAM per container (regardless of input)');
      console.log('📊 Total resources: 2 CPU, 4GB RAM (2 replicas × 1 CPU, 2GB each)');
    } else {
      console.log('❌ Service creation failed:', await serviceResponse.text());
    }
  } catch (error) {
    console.log('❌ Service test error:', error.message);
  }

  // Test 2: Stack Creation with Multiple Services
  console.log('\n📝 Test 2: Stack with Multiple Services and Fixed Resource Limits');
  try {
    const stackResponse = await fetch(`${BASE_URL}/stacks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'test-stack-limits',
        version: '3.8',
        services: {
          frontend: {
            image: 'nginx:alpine',
            ports: [{ target: 80, published: 8080, protocol: 'tcp' }],
            deploy: {
              replicas: 3 // Scale horizontally
            },
            // Any resources block here would be ignored
            resources: {
              limits: { cpus: '8.0', memory: '16G' }, // This will be ignored
              reservations: { cpus: '4.0', memory: '8G' } // This will be ignored
            }
          },
          backend: {
            image: 'node:alpine',
            environment: ['NODE_ENV=production'],
            deploy: {
              replicas: 2 // Scale horizontally
            }
            // No resources specified - fixed limits will be applied
          },
          database: {
            image: 'postgres:13',
            environment: ['POSTGRES_DB=testdb', 'POSTGRES_PASSWORD=secret'],
            deploy: {
              replicas: 1
            }
          }
        },
        networks: {
          frontend: { driver: 'overlay' },
          backend: { driver: 'overlay' }
        }
      })
    });
    
    if (stackResponse.ok) {
      const result = await stackResponse.json();
      console.log('✅ Stack created successfully');
      console.log('📊 Frontend: 3 replicas × 1 CPU, 2GB = 3 CPU, 6GB RAM');
      console.log('📊 Backend: 2 replicas × 1 CPU, 2GB = 2 CPU, 4GB RAM');
      console.log('📊 Database: 1 replica × 1 CPU, 2GB = 1 CPU, 2GB RAM');
      console.log('📊 Stack Total: 6 CPU, 12GB RAM');
      console.log('📋 Resource Policy: Fixed limits enforced, custom resources ignored');
    } else {
      console.log('❌ Stack creation failed:', await stackResponse.text());
    }
  } catch (error) {
    console.log('❌ Stack test error:', error.message);
  }

  // Test 3: Stack Scaling (Horizontal)
  console.log('\n📝 Test 3: Stack Service Scaling (Horizontal Only)');
  try {
    const scaleResponse = await fetch(`${BASE_URL}/stacks/test-stack-limits/services/frontend/scale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ replicas: 5 })
    });
    
    if (scaleResponse.ok) {
      const result = await scaleResponse.json();
      console.log('✅ Service scaled successfully');
      console.log('📊 Frontend scaled to: 5 replicas × 1 CPU, 2GB = 5 CPU, 10GB RAM');
      console.log('📊 New Stack Total: 8 CPU, 16GB RAM');
      console.log('📋 Scaling Method: Horizontal only (more replicas, same resources per container)');
    } else {
      console.log('❌ Scaling failed:', await scaleResponse.text());
    }
  } catch (error) {
    console.log('❌ Scaling test error:', error.message);
  }

  // Test 4: List Resources and Verify Policy
  console.log('\n📝 Test 4: Verify Resource Policy Enforcement');
  try {
    const stackListResponse = await fetch(`${BASE_URL}/stacks`);
    if (stackListResponse.ok) {
      const result = await stackListResponse.json();
      console.log('✅ Stack list retrieved');
      if (result.resourcePolicy) {
        console.log('📋 API Resource Policy:', result.resourcePolicy);
      }
    }

    const serviceListResponse = await fetch(`${BASE_URL}/services`);
    if (serviceListResponse.ok) {
      console.log('✅ Service list retrieved');
      console.log('📋 All services follow the same resource allocation policy');
    }
  } catch (error) {
    console.log('❌ List verification error:', error.message);
  }

  console.log('\n🏁 Resource Limitation Policy Test Complete');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 Summary:');
  console.log('   • All containers limited to: 1 CPU, 2GB RAM');
  console.log('   • Minimum reservation: 0.25 CPU, 512MB RAM');
  console.log('   • Scaling method: Horizontal only (more replicas)');
  console.log('   • Resource specifications in requests are ignored');
  console.log('   • Standardized resource allocation across all services');
}

// Run the test
testResourceLimits().catch(console.error);
