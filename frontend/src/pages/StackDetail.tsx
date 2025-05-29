import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  TrashIcon, 
  ServerIcon, 
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { stackApi } from '../services/stackService';
import type { Stack } from '../types';

const StackDetail: React.FC = () => {
  const { stackName } = useParams<{ stackName: string }>();
  const navigate = useNavigate();
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [deleteModal, setDeleteModal] = useState(false);

  const { data: stackData, isLoading, error } = useQuery(
    ['stack', stackName],
    () => stackApi.get(stackName!),
    {
      enabled: !!stackName,
      refetchInterval: 5000,
    }
  );

  const stack = stackData?.stack;

  const handleDeleteStack = async () => {
    if (!stackName) return;

    try {
      await stackApi.delete(stackName);
      navigate('/stacks');
    } catch (error) {
      console.error('Failed to delete stack:', error);
    }
  };

  const toggleServiceExpanded = (serviceName: string) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceName)) {
      newExpanded.delete(serviceName);
    } else {
      newExpanded.add(serviceName);
    }
    setExpandedServices(newExpanded);
  };

  const getServiceStatus = (service: any) => {
    if (!service.tasks || service.tasks.length === 0) {
      return { status: 'No Tasks', color: 'text-gray-500' };
    }

    const runningTasks = service.tasks.filter((task: any) => task.status?.state === 'running').length;
    const totalTasks = service.tasks.length;

    if (runningTasks === totalTasks) {
      return { status: 'Running', color: 'text-green-600' };
    } else if (runningTasks > 0) {
      return { status: 'Partial', color: 'text-yellow-600' };
    } else {
      return { status: 'Stopped', color: 'text-red-600' };
    }
  };

  const getTaskStatus = (task: any) => {
    const state = task.status?.state || 'unknown';
    switch (state) {
      case 'running':
        return { status: 'Running', color: 'text-green-600' };
      case 'failed':
        return { status: 'Failed', color: 'text-red-600' };
      case 'pending':
        return { status: 'Pending', color: 'text-yellow-600' };
      case 'starting':
        return { status: 'Starting', color: 'text-blue-600' };
      default:
        return { status: state, color: 'text-gray-600' };
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !stack) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Failed to load stack details. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/stacks')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <ServerIcon className="h-8 w-8 text-gray-600 mr-3" />
              {stack.name}
            </h1>
            <p className="text-gray-500">Stack Details</p>
          </div>
        </div>
        <button
          onClick={() => setDeleteModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
        >
          <TrashIcon className="h-4 w-4" />
          <span>Delete Stack</span>
        </button>
      </div>

      {/* Stack Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stack Info</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Name</span>
              <p className="text-sm text-gray-900">{stack.name}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Services</span>
              <p className="text-sm text-gray-900">{stack.services ? Object.keys(stack.services).length : 0}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Created</span>
              <p className="text-sm text-gray-900">
                {stack.createdAt ? new Date(stack.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resources</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Total Replicas</span>
              <p className="text-sm text-gray-900">
                {stack.services ? Object.values(stack.services).reduce((acc, service) => acc + (service.replicas || 0), 0) : 0}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Services Count</span>
              <p className="text-sm text-gray-900">
                {stack.services ? Object.keys(stack.services).length : 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              to={`/services/create?stack=${stack.name}`}
              className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-center"
            >
              Add Service
            </Link>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Services</h3>
        </div>
        
        {!stack.services || Object.keys(stack.services).length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No services in this stack</h3>
            <p className="text-gray-500 mb-4">Add services to get started with this stack.</p>
            <Link
              to={`/services/create?stack=${stack.name}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Service
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {Object.entries(stack.services).map(([serviceName, service]) => {
              const { status, color } = getServiceStatus(service);
              const isExpanded = expandedServices.has(serviceName);
              
              return (
                <div key={serviceName}>
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleServiceExpanded(serviceName)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {isExpanded ? (
                            <ChevronDownIcon className="h-4 w-4" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4" />
                          )}
                        </button>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{service.name}</h4>
                          <p className="text-sm text-gray-500">
                            {service.image || 'No image'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`text-sm font-medium ${color}`}>
                          {status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {service.replicas || 0} replicas
                        </span>
                        <Link
                          to={`/services/${serviceName}`}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>

                    {isExpanded && service.environment && service.environment.length > 0 && (
                      <div className="mt-4 ml-8">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Environment Variables</h5>
                        <div className="space-y-2">
                          {service.environment?.map((env, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded">
                              <p className="text-sm font-mono text-gray-900">{env}</p>
                            </div>
                          )) || (
                            <p className="text-sm text-gray-500">No environment variables configured</p>
                          )}
                        </div>
                        
                        {service.ports && service.ports.length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Ports</h5>
                            <div className="space-y-2">
                              {service.ports.map((port, index) => (
                                <div key={index} className="bg-gray-50 p-3 rounded flex justify-between">
                                  <span className="text-sm font-mono">{port.target}</span>
                                  <span className="text-sm text-gray-500">→ {port.published} ({port.protocol || 'tcp'})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Stack</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete stack "{stack.name}"? This will remove all services in this stack. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStack}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StackDetail;
