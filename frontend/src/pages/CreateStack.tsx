import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { stackApi } from '../services/stackService';

const CreateStack: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    composeFile: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultComposeFile = `version: '3.8'

services:
  web:
    image: nginx:latest
    ports:
      - "8080:80"
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G
      restart_policy:
        condition: on-failure
    networks:
      - web-network

  app:
    image: node:16-alpine
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G
    networks:
      - web-network
      - app-network

networks:
  web-network:
    driver: overlay
    attachable: true
  app-network:
    driver: overlay
    internal: true

volumes:
  app-data:
    driver: local
`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // For now, create a simple stack structure
      // In a real implementation, you'd parse the compose file
      const stackData = {
        name: formData.name,
        services: {
          main: {
            name: 'main',
            image: 'nginx:latest', // Default for demo
            replicas: 1,
            ports: [{ target: 80, published: 80 }]
          }
        }
      };
      
      await stackApi.create(stackData);
      navigate('/stacks');
    } catch (error) {
      console.error('Failed to create stack:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadExample = () => {
    setFormData(prev => ({
      ...prev,
      composeFile: defaultComposeFile,
    }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/stacks')}
          className="p-2 hover:bg-gray-100 rounded-lg mr-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Stack</h1>
          <p className="text-gray-500">Deploy a new Docker stack using a Compose file</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Stack Name */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stack Configuration</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stack Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="my-stack"
              pattern="[a-zA-Z0-9][a-zA-Z0-9_.-]*"
              title="Stack name must start with alphanumeric character and can contain letters, numbers, underscores, periods, and hyphens"
            />
            <p className="text-sm text-gray-500 mt-1">
              Must start with alphanumeric character and can contain letters, numbers, underscores, periods, and hyphens
            </p>
          </div>
        </div>

        {/* Compose File */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Docker Compose File</h3>
            <button
              type="button"
              onClick={loadExample}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm"
            >
              Load Example
            </button>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compose Content *
            </label>
            <textarea
              required
              value={formData.composeFile}
              onChange={(e) => setFormData(prev => ({ ...prev, composeFile: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              rows={20}
              placeholder="version: '3.8'&#10;&#10;services:&#10;  web:&#10;    image: nginx:latest&#10;    ports:&#10;      - '80:80'&#10;    deploy:&#10;      replicas: 2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter your Docker Compose file content. Must include version and services sections.
            </p>
          </div>

          {/* Compose File Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Docker Compose Guidelines for Swarm</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use version 3.0 or higher for swarm mode support</li>
              <li>• Include <code className="bg-blue-100 px-1 rounded">deploy</code> sections for service configuration</li>
              <li>• Specify resource limits and reservations</li>
              <li>• Use overlay networks for multi-host communication</li>
              <li>• Consider placement constraints for specific node requirements</li>
              <li>• Set restart policies for service resilience</li>
            </ul>
          </div>
        </div>

        {/* Resource Information */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-yellow-900 mb-2">Resource Policy</h4>
          <p className="text-sm text-yellow-800">
            Services in this stack will be subject to the cluster resource policy:
            <strong> 1 CPU core and 2GB RAM maximum per container</strong>.
            Ensure your compose file respects these limits.
          </p>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/stacks')}
            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Deploying...' : 'Deploy Stack'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateStack;
