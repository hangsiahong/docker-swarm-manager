import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { serviceApi } from '../services/serviceService';
import { networkApi } from '../services/networkService';
import type { CreateServiceRequest } from '../types';

interface EnvironmentVariable {
  key: string;
  value: string;
}

interface Mount {
  type: 'bind' | 'volume' | 'tmpfs';
  source: string;
  target: string;
  readonly?: boolean;
}

interface Port {
  targetPort: number;
  publishedPort: number;
  protocol: 'tcp' | 'udp';
}

const CreateService: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stackName = searchParams.get('stack');

  const [formData, setFormData] = useState<{
    name: string;
    image: string;
    replicas: number;
    environment: EnvironmentVariable[];
    mounts: Mount[];
    ports: Port[];
    networks: string[];
    command: string[];
    args: string[];
    labels: Record<string, string>;
    constraints: string[];
    cpuLimit: string;
    memoryLimit: string;
    cpuReservation: string;
    memoryReservation: string;
  }>({
    name: '',
    image: '',
    replicas: 1,
    environment: [{ key: '', value: '' }],
    mounts: [],
    ports: [],
    networks: [],
    command: [],
    args: [],
    labels: stackName ? { 'com.docker.stack.namespace': stackName } : {},
    constraints: [],
    cpuLimit: '1000000000', // 1 CPU in nanoseconds
    memoryLimit: '2147483648', // 2GB in bytes
    cpuReservation: '500000000', // 0.5 CPU
    memoryReservation: '1073741824', // 1GB
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: networks = [] } = useQuery('networks', networkApi.list);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const envArray = formData.environment
        .filter(env => env.key && env.value)
        .map(env => `${env.key}=${env.value}`);

      const serviceSpec: CreateServiceRequest = {
        name: formData.name,
        image: formData.image,
        replicas: formData.replicas,
        env: envArray.length > 0 ? envArray : undefined,
        labels: Object.keys(formData.labels).length > 0 ? formData.labels : undefined,
        networks: formData.networks.length > 0 ? formData.networks : undefined,
        ports: formData.ports.length > 0 ? formData.ports.map(port => ({
          target: port.targetPort,
          published: port.publishedPort,
          protocol: port.protocol,
        })) : undefined,
      };

      await serviceApi.create(serviceSpec);
      navigate(stackName ? `/stacks/${stackName}` : '/services');
    } catch (error) {
      console.error('Failed to create service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addEnvironmentVariable = () => {
    setFormData(prev => ({
      ...prev,
      environment: [...prev.environment, { key: '', value: '' }],
    }));
  };

  const removeEnvironmentVariable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      environment: prev.environment.filter((_, i) => i !== index),
    }));
  };

  const updateEnvironmentVariable = (index: number, field: 'key' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      environment: prev.environment.map((env, i) => 
        i === index ? { ...env, [field]: value } : env
      ),
    }));
  };

  const addMount = () => {
    setFormData(prev => ({
      ...prev,
      mounts: [...prev.mounts, { type: 'volume', source: '', target: '' }],
    }));
  };

  const removeMount = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mounts: prev.mounts.filter((_, i) => i !== index),
    }));
  };

  const updateMount = (index: number, field: keyof Mount, value: any) => {
    setFormData(prev => ({
      ...prev,
      mounts: prev.mounts.map((mount, i) => 
        i === index ? { ...mount, [field]: value } : mount
      ),
    }));
  };

  const addPort = () => {
    setFormData(prev => ({
      ...prev,
      ports: [...prev.ports, { targetPort: 80, publishedPort: 8080, protocol: 'tcp' }],
    }));
  };

  const removePort = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ports: prev.ports.filter((_, i) => i !== index),
    }));
  };

  const updatePort = (index: number, field: keyof Port, value: any) => {
    setFormData(prev => ({
      ...prev,
      ports: prev.ports.map((port, i) => 
        i === index ? { ...port, [field]: value } : port
      ),
    }));
  };

  const addConstraint = () => {
    setFormData(prev => ({
      ...prev,
      constraints: [...prev.constraints, ''],
    }));
  };

  const removeConstraint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      constraints: prev.constraints.filter((_, i) => i !== index),
    }));
  };

  const updateConstraint = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      constraints: prev.constraints.map((constraint, i) => 
        i === index ? value : constraint
      ),
    }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(stackName ? `/stacks/${stackName}` : '/services')}
          className="p-2 hover:bg-gray-100 rounded-lg mr-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Service</h1>
          {stackName && (
            <p className="text-gray-500">Creating service for stack: {stackName}</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="my-service"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Docker Image *
              </label>
              <input
                type="text"
                required
                value={formData.image}
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="nginx:latest"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Replicas
              </label>
              <input
                type="number"
                min="1"
                value={formData.replicas}
                onChange={(e) => setFormData(prev => ({ ...prev, replicas: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Resource Limits */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Limits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPU Limit (nanoseconds)
              </label>
              <input
                type="text"
                value={formData.cpuLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, cpuLimit: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1000000000 (1 CPU)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Memory Limit (bytes)
              </label>
              <input
                type="text"
                value={formData.memoryLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, memoryLimit: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2147483648 (2GB)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPU Reservation (nanoseconds)
              </label>
              <input
                type="text"
                value={formData.cpuReservation}
                onChange={(e) => setFormData(prev => ({ ...prev, cpuReservation: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="500000000 (0.5 CPU)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Memory Reservation (bytes)
              </label>
              <input
                type="text"
                value={formData.memoryReservation}
                onChange={(e) => setFormData(prev => ({ ...prev, memoryReservation: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1073741824 (1GB)"
              />
            </div>
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Environment Variables</h3>
            <button
              type="button"
              onClick={addEnvironmentVariable}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>
          <div className="space-y-3">
            {formData.environment.map((env, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="KEY"
                  value={env.key}
                  onChange={(e) => updateEnvironmentVariable(index, 'key', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span>=</span>
                <input
                  type="text"
                  placeholder="value"
                  value={env.value}
                  onChange={(e) => updateEnvironmentVariable(index, 'value', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => removeEnvironmentVariable(index)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Ports */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Port Mappings</h3>
            <button
              type="button"
              onClick={addPort}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>
          <div className="space-y-3">
            {formData.ports.map((port, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="number"
                  placeholder="Published Port"
                  value={port.publishedPort}
                  onChange={(e) => updatePort(index, 'publishedPort', parseInt(e.target.value))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span>:</span>
                <input
                  type="number"
                  placeholder="Target Port"
                  value={port.targetPort}
                  onChange={(e) => updatePort(index, 'targetPort', parseInt(e.target.value))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={port.protocol}
                  onChange={(e) => updatePort(index, 'protocol', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="tcp">TCP</option>
                  <option value="udp">UDP</option>
                </select>
                <button
                  type="button"
                  onClick={() => removePort(index)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Networks */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Networks</h3>
          <div className="space-y-2">
            {networks.map((network) => (
              <label key={network.Id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.networks.includes(network.Id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({
                        ...prev,
                        networks: [...prev.networks, network.Id],
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        networks: prev.networks.filter(id => id !== network.Id),
                      }));
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm">{network.Name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(stackName ? `/stacks/${stackName}` : '/services')}
            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Service'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateService;
