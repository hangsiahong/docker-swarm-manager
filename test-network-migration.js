#!/usr/bin/env node

/**
 * Test script to reproduce and fix Docker Swarm network migration error
 * "networks must be migrated to TaskSpec before being changed"
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3456/api';

async function testNetworkMigration() {
  console.log('🧪 Testing Docker Swarm Network Migration Fix...\n');

  try {
    // Step 1: Create a test network
    console.log('1. Creating test network...');
    const networkResponse = await axios.post(`${BASE_URL}/networks`, {
      name: 'test-migration-network',
      driver: 'overlay',
      attachable: true
    });
    console.log('✅ Network created:', networkResponse.data.id);

    // Step 2: Create a service with the network
    console.log('\n2. Creating service with network...');
    const serviceResponse = await axios.post(`${BASE_URL}/services`, {
      name: 'test-migration-service',
      image: 'nginx:alpine',
      replicas: 1,
      networkIds: ['test-migration-network'],
      ports: [
        {
          target: 80,
          published: 8080,
          protocol: 'tcp'
        }
      ]
    });
    console.log('✅ Service created:', serviceResponse.data.ID);
    const serviceId = serviceResponse.data.ID;

    // Wait for service to be ready
    console.log('\n3. Waiting for service to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 3: Try to update the service image (this should trigger the network migration issue)
    console.log('\n4. Attempting service update (testing network migration fix)...');
    try {
      const updateResponse = await axios.put(`${BASE_URL}/services/${serviceId}`, {
        image: 'nginx:latest'
      });
      console.log('✅ Service update successful!');
      console.log('Network migration issue has been FIXED! 🎉');
    } catch (updateError) {
      console.log('❌ Service update failed:', updateError.response?.data?.error || updateError.message);
      
      if (updateError.response?.data?.error?.includes('networks must be migrated to TaskSpec')) {
        console.log('🚨 Network migration error still occurring!');
      }
    }

    // Step 4: Test rolling update as well
    console.log('\n5. Testing rolling update...');
    try {
      const rollingUpdateResponse = await axios.post(`${BASE_URL}/services/${serviceId}/rolling-update`, {
        image: 'nginx:1.21-alpine',
        updateConfig: {
          parallelism: 1,
          delay: '5s'
        }
      });
      console.log('✅ Rolling update successful!');
    } catch (rollingError) {
      console.log('❌ Rolling update failed:', rollingError.response?.data?.error || rollingError.message);
    }

    // Step 5: Test environment update
    console.log('\n6. Testing environment update...');
    try {
      const envUpdateResponse = await axios.put(`${BASE_URL}/services/${serviceId}/environment`, {
        envVars: ['TEST_VAR=migration_test']
      });
      console.log('✅ Environment update successful!');
    } catch (envError) {
      console.log('❌ Environment update failed:', envError.response?.data?.error || envError.message);
    }

    // Step 6: Check service status
    console.log('\n7. Checking final service status...');
    const finalStatusResponse = await axios.get(`${BASE_URL}/services/${serviceId}`);
    const service = finalStatusResponse.data;
    console.log('📊 Final service info:');
    console.log('- Name:', service.Spec?.Name);
    console.log('- Image:', service.Spec?.TaskTemplate?.ContainerSpec?.Image);
    console.log('- Networks:', service.Spec?.TaskTemplate?.Networks?.length || 0);
    console.log('- Resource Limits:', {
      CPU: service.Spec?.TaskTemplate?.Resources?.Limits?.NanoCPUs / 1000000000 + ' CPU',
      Memory: (service.Spec?.TaskTemplate?.Resources?.Limits?.MemoryBytes / 1024 / 1024 / 1024).toFixed(1) + ' GB'
    });

    // Cleanup
    console.log('\n8. Cleaning up...');
    await axios.delete(`${BASE_URL}/services/${serviceId}`);
    console.log('✅ Service deleted');
    
    // Wait a bit before deleting network
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      await axios.delete(`${BASE_URL}/networks/test-migration-network`);
      console.log('✅ Network deleted');
    } catch (networkError) {
      console.log('⚠️  Network cleanup warning:', networkError.response?.data?.error || networkError.message);
    }

    console.log('\n🎯 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.error || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testNetworkMigration();
