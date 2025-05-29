import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ArrowsUpDownIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  PlayIcon,
  CubeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { serviceApi } from '../services/serviceService';
import { Service, ServiceTask } from '../types';

const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [scaleReplicas, setScaleReplicas] = useState(1);
  const [updateImage, setUpdateImage] = useState('');
  const [logs, setLogs] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);

  const { data: service, isLoading } = useQuery(
    ['service', id],
    () => serviceApi.get(id!),
    { enabled: !!id }
  );

  const { data: tasks } = useQuery(
    ['service-tasks', id],
    () => serviceApi.getTasks(id!),
    { enabled: !!id, refetchInterval: 5000 }
  );

  const { data: replicas } = useQuery(
    ['service-replicas', id],
    () => serviceApi.getReplicas(id!),
    { enabled: !!id, refetchInterval: 5000 }
  );

  const deleteServiceMutation = useMutation(serviceApi.delete, {
    onSuccess: () => {
      toast.success('Service deleted successfully');
      navigate('/services');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete service');
    },
  });

  const scaleServiceMutation = useMutation(
    (replicas: number) => serviceApi.scale(id!, replicas),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['service', id]);
        queryClient.invalidateQueries(['service-tasks', id]);
        queryClient.invalidateQueries(['service-replicas', id]);
        setShowScaleModal(false);
        toast.success('Service scaled successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to scale service');
      },
    }
  );

  const rollingUpdateMutation = useMutation(
    (image: string) => serviceApi.rollingUpdate(id!, { 
      image,
      updateConfig: {
        parallelism: 1,
        delay: "10s",
        failureAction: "rollback",
        order: "start-first"
      }
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['service', id]);
        setShowUpdateModal(false);
        toast.success('Rolling update started');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to start rolling update');
      },
    }
  );

  const handleDeleteService = () => {
    if (window.confirm(`Are you sure you want to delete service "${service?.Spec?.Name}"?`)) {
      deleteServiceMutation.mutate(id!);
    }
  };

  const handleScaleService = () => {
    scaleServiceMutation.mutate(scaleReplicas);
  };

  const handleRollingUpdate = () => {
    if (updateImage.trim()) {
      rollingUpdateMutation.mutate(updateImage.trim());
    }
  };

  const handleShowLogs = async () => {
    setShowLogsModal(true);
    setLogsLoading(true);
    try {
      const response = await serviceApi.getLogs(id!, { tail: 100, timestamps: true });
      console.log('Logs response:', response);
      console.log('Logs type:', typeof response.logs);
      console.log('Logs content:', response.logs);
      
      // Ensure logs is a string
      const logsString = typeof response.logs === 'string' 
        ? response.logs 
        : JSON.stringify(response.logs);
      
      setLogs(logsString);
    } catch (error: any) {
      toast.error('Failed to fetch logs');
      setLogs('Failed to fetch logs');
    } finally {
      setLogsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Service not found</p>
        </div>
      </div>
    );
  }

  const replicas_count = service.Spec?.Mode?.Replicated?.Replicas || 0;
  const runningTasks = tasks?.filter(task => task.Status?.State === 'running').length || 0;
  const totalCpu = replicas_count;
  const totalMemory = replicas_count * 2;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link to="/services" className="text-gray-400 hover:text-gray-600">
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{service.Spec?.Name}</h1>
            <p className="text-gray-600">{service.ID}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setScaleReplicas(replicas_count);
              setShowScaleModal(true);
            }}
            className="btn btn-secondary"
          >
            <ArrowsUpDownIcon className="h-4 w-4 mr-2" />
            Scale
          </button>
          <button
            onClick={() => {
              setUpdateImage(service.Spec?.TaskTemplate?.ContainerSpec?.Image || '');
              setShowUpdateModal(true);
            }}
            className="btn btn-warning"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Update
          </button>
          <button onClick={handleShowLogs} className="btn btn-secondary">
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Logs
          </button>
          <button
            onClick={handleDeleteService}
            className="btn btn-error"
            disabled={deleteServiceMutation.isLoading}
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <p className="mt-1 text-sm text-gray-900">{service.Spec?.Name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Image</label>
                <p className="mt-1 text-sm text-gray-900">{service.Spec?.TaskTemplate?.ContainerSpec?.Image}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Created</label>
                <p className="mt-1 text-sm text-gray-900">
                  {format(new Date(service.CreatedAt), 'MMM dd, yyyy HH:mm:ss')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Updated</label>
                <p className="mt-1 text-sm text-gray-900">
                  {format(new Date(service.UpdatedAt), 'MMM dd, yyyy HH:mm:ss')}
                </p>
              </div>
            </div>
          </div>

          {/* Environment Variables */}
          {service.Spec?.TaskTemplate?.ContainerSpec?.Env && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Environment Variables</h3>
              <div className="space-y-2">
                {service.Spec.TaskTemplate.ContainerSpec.Env.map((env, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-md">
                    <code className="text-sm text-gray-800">{env}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tasks ({runningTasks}/{replicas_count} running)
            </h3>
            {tasks && tasks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Task ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Node</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr key={task.ID}>
                        <td className="px-4 py-2 text-sm text-gray-900">{task.ID.slice(0, 12)}...</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{task.NodeID.slice(0, 12)}...</td>
                        <td className="px-4 py-2">
                          <span className={`badge ${
                            task.Status?.State === 'running' ? 'badge-success' : 
                            task.Status?.State === 'failed' ? 'badge-error' : 'badge-warning'
                          }`}>
                            {task.Status?.State}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {format(new Date(task.CreatedAt), 'MMM dd, HH:mm')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No tasks found</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`badge ${runningTasks > 0 ? 'badge-success' : 'badge-warning'}`}>
                  {runningTasks > 0 ? 'Running' : 'Stopped'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Replicas</span>
                <span className="text-sm font-medium text-gray-900">{runningTasks}/{replicas_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Mode</span>
                <span className="text-sm font-medium text-gray-900">
                  {service.Spec?.Mode?.Replicated ? 'Replicated' : 'Global'}
                </span>
              </div>
            </div>
          </div>

          {/* Resource Usage */}
          <div className="card bg-primary-50 border-primary-200">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">Resource Usage</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-primary-700">CPU</span>
                <span className="text-sm font-medium text-primary-900">{totalCpu} cores</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-primary-700">Memory</span>
                <span className="text-sm font-medium text-primary-900">{totalMemory}GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-primary-700">Per Container</span>
                <span className="text-sm font-medium text-primary-900">1 CPU, 2GB</span>
              </div>
            </div>
          </div>

          {/* Ports */}
          {service.Spec?.EndpointSpec?.Ports && service.Spec.EndpointSpec.Ports.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Published Ports</h3>
              <div className="space-y-2">
                {service.Spec.EndpointSpec.Ports.map((port, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{port.PublishedPort}</span>
                    <span className="text-gray-900">→ {port.TargetPort}/{port.Protocol}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scale Modal */}
      {showScaleModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Scale Service</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Replicas</label>
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
              <button onClick={() => setShowScaleModal(false)} className="btn btn-secondary">
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
      )}

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Rolling Update</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">New Image</label>
              <input
                type="text"
                value={updateImage}
                onChange={(e) => setUpdateImage(e.target.value)}
                className="input"
                placeholder="nginx:latest"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowUpdateModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleRollingUpdate}
                disabled={rollingUpdateMutation.isLoading || !updateImage.trim()}
                className="btn btn-warning"
              >
                {rollingUpdateMutation.isLoading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-3/4 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Service Logs</h3>
              <button onClick={() => setShowLogsModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="bg-black text-green-400 p-4 rounded-md h-96 overflow-y-auto font-mono text-sm">
              {logsLoading ? (
                <div className="text-center">Loading logs...</div>
              ) : (
                <pre className="whitespace-pre-wrap">{logs || 'No logs available'}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDetail;
