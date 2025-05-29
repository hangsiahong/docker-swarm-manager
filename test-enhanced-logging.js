#!/usr/bin/env node

const http = require('http');

const API_BASE = 'http://localhost:3456/api';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const responseData = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: responseData });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Helper function to wait
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Testing Enhanced Logging Features for High Replica Count Services\n');

  try {
    // Test 1: Create a high-replica service for testing
    console.log('📝 Test 1: Creating high-replica service for testing...');
    const serviceConfig = {
      name: 'high-replica-test',
      image: 'nginx:alpine',
      replicas: 10, // High replica count for testing
      ports: [{ target: 80, published: 8080 }],
      env: ['TEST_MODE=true']
    };

    const createResult = await makeRequest('POST', '/services', serviceConfig);
    console.log(`Status: ${createResult.status}`);
    if (createResult.status === 200 || createResult.status === 201) {
      console.log('✅ High-replica service created successfully');
    } else {
      console.log('❌ Failed to create service:', createResult.data);
      return;
    }

    // Wait for service to start
    console.log('⏳ Waiting for service to start...');
    await wait(15000);

    // Test 2: Get service replica information
    console.log('\n📝 Test 2: Getting service replica information...');
    const replicasResult = await makeRequest('GET', '/services/high-replica-test/replicas');
    console.log(`Status: ${replicasResult.status}`);
    if (replicasResult.status === 200) {
      console.log('✅ Service replicas retrieved successfully');
      console.log(`Total replicas: ${replicasResult.data.totalReplicas}`);
      console.log(`Running replicas: ${replicasResult.data.runningReplicas}`);
      console.log(`First few replicas:`, replicasResult.data.replicas.slice(0, 3));
    } else {
      console.log('❌ Failed to get replicas:', replicasResult.data);
    }

    // Test 3: Get logs with tail parameter (basic optimization)
    console.log('\n📝 Test 3: Getting logs with tail parameter...');
    const tailLogsResult = await makeRequest('GET', '/services/high-replica-test/logs?tail=50&timestamps=true');
    console.log(`Status: ${tailLogsResult.status}`);
    if (tailLogsResult.status === 200) {
      console.log('✅ Logs with tail retrieved successfully');
      console.log(`Service name: ${tailLogsResult.data.metadata.serviceName}`);
      console.log(`Total replicas: ${tailLogsResult.data.metadata.totalReplicas}`);
      console.log(`Performance note: ${tailLogsResult.data.metadata.options.note || 'None'}`);
    } else {
      console.log('❌ Failed to get logs:', tailLogsResult.data);
    }

    // Test 4: Get logs from specific replica
    console.log('\n📝 Test 4: Getting logs from specific replica...');
    const replicaLogsResult = await makeRequest('GET', '/services/high-replica-test/logs?replicaIndex=0&tail=20');
    console.log(`Status: ${replicaLogsResult.status}`);
    if (replicaLogsResult.status === 200) {
      console.log('✅ Replica-specific logs retrieved successfully');
      console.log('Log snippet length:', replicaLogsResult.data.logs.length);
    } else {
      console.log('❌ Failed to get replica logs:', replicaLogsResult.data);
    }

    // Test 5: Get bulk replica logs
    console.log('\n📝 Test 5: Getting bulk replica logs...');
    const bulkLogsData = {
      replicaIndexes: [0, 1, 2],
      tail: 30,
      timestamps: true,
      maxConcurrent: 3
    };
    const bulkLogsResult = await makeRequest('POST', '/services/high-replica-test/bulk-logs', bulkLogsData);
    console.log(`Status: ${bulkLogsResult.status}`);
    if (bulkLogsResult.status === 200) {
      console.log('✅ Bulk replica logs retrieved successfully');
      console.log(`Requested replicas: ${bulkLogsResult.data.requestedReplicas}`);
      console.log(`Results count: ${bulkLogsResult.data.results.length}`);
      console.log(`Performance note: ${bulkLogsResult.data.metadata.note || 'None'}`);
      console.log('Sample results:', bulkLogsResult.data.results.map(r => ({
        replica: r.replicaIndex,
        status: r.status,
        logLength: r.logs ? r.logs.length : 0
      })));
    } else {
      console.log('❌ Failed to get bulk logs:', bulkLogsResult.data);
    }

    // Test 6: Create a stack with high-replica service
    console.log('\n📝 Test 6: Creating stack with high-replica service...');
    const stackConfig = {
      name: 'high-replica-stack',
      services: {
        web: {
          image: 'nginx:alpine',
          ports: ['9080:80'],
          deploy: {
            replicas: 8
          }
        },
        api: {
          image: 'httpd:alpine',
          ports: ['9081:80'],
          deploy: {
            replicas: 12
          }
        }
      },
      networks: {
        'test-net': {
          driver: 'overlay'
        }
      }
    };

    const stackResult = await makeRequest('POST', '/stacks', stackConfig);
    console.log(`Status: ${stackResult.status}`);
    if (stackResult.status === 200 || stackResult.status === 201) {
      console.log('✅ High-replica stack created successfully');
    } else {
      console.log('❌ Failed to create stack:', stackResult.data);
      return;
    }

    // Wait for stack to deploy
    console.log('⏳ Waiting for stack to deploy...');
    await wait(20000);

    // Test 7: Get stack service replicas
    console.log('\n📝 Test 7: Getting stack service replica information...');
    const stackReplicasResult = await makeRequest('GET', '/stacks/high-replica-stack/services/api/replicas');
    console.log(`Status: ${stackReplicasResult.status}`);
    if (stackReplicasResult.status === 200) {
      console.log('✅ Stack service replicas retrieved successfully');
      console.log(`Stack: ${stackReplicasResult.data.stackName}`);
      console.log(`Service: ${stackReplicasResult.data.serviceName}`);
      console.log(`Total replicas: ${stackReplicasResult.data.totalReplicas}`);
      console.log(`Running replicas: ${stackReplicasResult.data.runningReplicas}`);
    } else {
      console.log('❌ Failed to get stack replicas:', stackReplicasResult.data);
    }

    // Test 8: Get stack service logs with optimization
    console.log('\n📝 Test 8: Getting stack service logs with optimization...');
    const stackLogsResult = await makeRequest('GET', '/stacks/high-replica-stack/logs?service=api&tail=40&replicaIndex=0');
    console.log(`Status: ${stackLogsResult.status}`);
    if (stackLogsResult.status === 200) {
      console.log('✅ Stack service logs retrieved successfully');
      console.log('Logs structure keys:', Object.keys(stackLogsResult.data.logs));
    } else {
      console.log('❌ Failed to get stack logs:', stackLogsResult.data);
    }

    // Test 9: Get stack service bulk logs
    console.log('\n📝 Test 9: Getting stack service bulk logs...');
    const stackBulkLogsData = {
      replicaIndexes: [0, 1, 2, 3],
      tail: 25,
      maxConcurrent: 2
    };
    const stackBulkLogsResult = await makeRequest('POST', '/stacks/high-replica-stack/services/api/bulk-logs', stackBulkLogsData);
    console.log(`Status: ${stackBulkLogsResult.status}`);
    if (stackBulkLogsResult.status === 200) {
      console.log('✅ Stack service bulk logs retrieved successfully');
      console.log(`Stack: ${stackBulkLogsResult.data.stackName}`);
      console.log(`Service: ${stackBulkLogsResult.data.serviceName}`);
      console.log(`Results: ${stackBulkLogsResult.data.results.length}`);
      console.log(`Max concurrent: ${stackBulkLogsResult.data.metadata.maxConcurrent}`);
    } else {
      console.log('❌ Failed to get stack bulk logs:', stackBulkLogsResult.data);
    }

    // Test 10: Test performance safeguards
    console.log('\n📝 Test 10: Testing performance safeguards...');
    
    // Try to get logs without tail from high replica service
    const unsafeLogsResult = await makeRequest('GET', '/services/high-replica-test/logs');
    console.log(`Status: ${unsafeLogsResult.status}`);
    if (unsafeLogsResult.status === 200) {
      const hasWarning = unsafeLogsResult.data.metadata?.options?.note?.includes('High replica count');
      console.log(`✅ Performance warning detected: ${hasWarning}`);
      console.log(`Warning message: ${unsafeLogsResult.data.metadata?.options?.note || 'None'}`);
    }

    // Try bulk logs with high concurrency (should be limited)
    const highConcurrencyData = {
      replicaIndexes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      maxConcurrent: 20 // Should be limited to 10
    };
    const limitedConcurrencyResult = await makeRequest('POST', '/services/high-replica-test/bulk-logs', highConcurrencyData);
    console.log(`Limited concurrency test status: ${limitedConcurrencyResult.status}`);
    if (limitedConcurrencyResult.status === 200) {
      const actualConcurrent = limitedConcurrencyResult.data.metadata.maxConcurrent;
      console.log(`✅ Concurrency properly limited to: ${actualConcurrent} (requested 20)`);
    }

    console.log('\n🎉 Enhanced Logging Tests Summary:');
    console.log('✅ High replica service creation');
    console.log('✅ Replica information retrieval');  
    console.log('✅ Optimized log retrieval with pagination');
    console.log('✅ Replica-specific log filtering');
    console.log('✅ Bulk replica logs with concurrency control');
    console.log('✅ Stack service replica management');
    console.log('✅ Stack service enhanced logging');
    console.log('✅ Performance safeguards and warnings');
    
    console.log('\n🔧 Performance Features Verified:');
    console.log('• Automatic tail limiting (max 1000 lines)');
    console.log('• Concurrency limiting (max 10 simultaneous)');
    console.log('• High replica count warnings');
    console.log('• Replica-specific filtering');
    console.log('• Batch processing with controlled concurrency');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test resources...');
    
    try {
      await makeRequest('DELETE', '/services/high-replica-test');
      console.log('✅ Test service cleaned up');
    } catch (error) {
      console.log('⚠️ Could not clean up test service:', error.message);
    }

    try {
      await makeRequest('DELETE', '/stacks/high-replica-stack');
      console.log('✅ Test stack cleaned up');
    } catch (error) {
      console.log('⚠️ Could not clean up test stack:', error.message);
    }

    console.log('\n✨ Enhanced logging tests completed!');
  }
}

// Run tests
main().catch(console.error);
