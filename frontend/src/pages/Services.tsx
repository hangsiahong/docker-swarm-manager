import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  EyeIcon,
  TrashIcon,
  ArrowsUpDownIcon,
  PlayIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { serviceApi } from '../services/serviceService';
import { Service } from '../types';

const Services: React.FC = () => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [scaleReplicas, setScaleReplicas] = useState<number>(1);
  const [showScaleModal, setShowScaleModal] = useState(false);

  const queryClient = useQueryClient();
  const { data: services, isLoading, error } = useQuery('services', serviceApi.list);

  const deleteServiceMutation = useMutation(serviceApi.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('services');
      toast.success('Service deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete service');
    },
  });

  const scaleServiceMutation = useMutation(
    ({ id, replicas }: { id: string; replicas: number }) => serviceApi.scale(id, replicas),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('services');
        setShowScaleModal(false);
        setSelectedService(null);
        toast.success('Service scaled successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to scale service');
      },
    }
  );

  const handleDeleteService = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete service "${name}"?`)) {
      deleteServiceMutation.mutate(id);
    }
  };

  const handleScaleService = () => {
    if (selectedService) {
      scaleServiceMutation.mutate({ id: selectedService, replicas: scaleReplicas });
    }
  };

  const openScaleModal = (service: Service) => {
    setSelectedService(service.ID);
    setScaleReplicas(service.Spec?.Mode?.Replicated?.Replicas || 1);
    setShowScaleModal(true);
  };

  const getServiceStatus = (service: Service) => {
    // Simple status based on having replicas
    const replicas = service.Spec?.Mode?.Replicated?.Replicas || 0;
    return replicas > 0 ? 'running' : 'stopped';
  };

  const calculateResources = (replicas: number) => ({
    cpu: `${replicas} CPU`,
    memory: `${replicas * 2}GB`,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load services</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600">Manage your Docker Swarm services</p>
        </div>
        <Link to="/services/create" className="btn btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Service
        </Link>
      </div>

      {/* Resource Info */}
      <div className="card mb-6 bg-primary-50 border-primary-200">
        <p className="text-primary-800">
          <strong>Resource Policy:</strong> Each service container is limited to 1 CPU and 2GB RAM. 
          Scale horizontally by increasing replicas.
        </p>
      </div>

      {/* Services Table */}
      <div className="card">
        {services && services.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Replicas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resources
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service) => {
                  const replicas = service.Spec?.Mode?.Replicated?.Replicas || 0;
                  const resources = calculateResources(replicas);
                  const status = getServiceStatus(service);
                  
                  return (
                    <tr key={service.ID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {service.Spec?.Name}
                          </div>
                          <div className="text-sm text-gray-500">{service.ID.slice(0, 12)}...</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {service.Spec?.TaskTemplate?.ContainerSpec?.Image}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="badge badge-gray">{replicas}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>CPU: {resources.cpu}</div>
                          <div>Memory: {resources.memory}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${
                          status === 'running' ? 'badge-success' : 'badge-warning'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(service.CreatedAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`/services/${service.ID}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => openScaleModal(service)}
                            className="text-warning-600 hover:text-warning-900"
                          >
                            <ArrowsUpDownIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.ID, service.Spec?.Name || 'Unknown')}
                            className="text-error-600 hover:text-error-900"
                            disabled={deleteServiceMutation.isLoading}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <PlayIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No services</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new service.</p>
            <div className="mt-6">
              <Link to="/services/create" className="btn btn-primary">
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Service
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Scale Modal */}
      {showScaleModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Scale Service</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Replicas
                </label>
                <input
                  type="number"
                  min="0"
                  value={scaleReplicas}
                  onChange={(e) => setScaleReplicas(parseInt(e.target.value) || 0)}
                  className="input"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Resources: {scaleReplicas} CPU, {scaleReplicas * 2}GB memory
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowScaleModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScaleService}
                  disabled={scaleServiceMutation.isLoading}
                  className="btn btn-primary"
                >
                  {scaleServiceMutation.isLoading ? 'Scaling...' : 'Scale'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
