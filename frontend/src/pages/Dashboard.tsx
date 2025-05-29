import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  CubeIcon, 
  RectangleStackIcon, 
  GlobeAltIcon,
  PlusIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { serviceApi } from '../services/serviceService';
import { stackApi } from '../services/stackService';
import { networkApi } from '../services/networkService';
import { RESOURCE_LIMITS } from '../config/api';

const Dashboard: React.FC = () => {
  const { data: services, isLoading: servicesLoading } = useQuery('services', serviceApi.list);
  const { data: stacksData, isLoading: stacksLoading } = useQuery('stacks', stackApi.list);
  const { data: networks, isLoading: networksLoading } = useQuery('networks', networkApi.list);

  const stacks = stacksData?.stacks || [];

  // Calculate resource usage
  const totalReplicas = services?.reduce((total, service) => {
    return total + (service.Spec?.Mode?.Replicated?.Replicas || 0);
  }, 0) || 0;

  const totalStackReplicas = stacks.reduce((total, stack) => {
    return total + stack.services;
  }, 0);

  const totalCpuUsage = totalReplicas + totalStackReplicas;
  const totalMemoryUsage = (totalReplicas + totalStackReplicas) * 2; // 2GB per container

  const stats = [
    {
      name: 'Total Services',
      value: services?.length || 0,
      icon: CubeIcon,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      href: '/services',
    },
    {
      name: 'Total Stacks',
      value: stacks.length,
      icon: RectangleStackIcon,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
      href: '/stacks',
    },
    {
      name: 'Total Networks',
      value: networks?.length || 0,
      icon: GlobeAltIcon,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
      href: '/networks',
    },
    {
      name: 'CPU Usage',
      value: `${totalCpuUsage} CPU`,
      icon: ChartBarIcon,
      color: 'text-error-600',
      bgColor: 'bg-error-50',
      href: '#',
    },
  ];

  const quickActions = [
    {
      name: 'Create Service',
      description: 'Deploy a new Docker service',
      href: '/services/create',
      icon: CubeIcon,
      color: 'primary',
    },
    {
      name: 'Create Stack',
      description: 'Deploy a multi-service stack',
      href: '/stacks/create',
      icon: RectangleStackIcon,
      color: 'success',
    },
    {
      name: 'Create Network',
      description: 'Create an overlay network',
      href: '/networks/create',
      icon: GlobeAltIcon,
      color: 'warning',
    },
  ];

  const recentServices = services?.slice(0, 5) || [];
  const recentStacks = stacks.slice(0, 3);

  if (servicesLoading || stacksLoading || networksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Docker Swarm Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage your Docker Swarm cluster with enforced resource limits
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="card hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.name}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Resource Policy Info */}
      <div className="card mb-8 bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
        <div className="flex items-center">
          <ChartBarIcon className="h-8 w-8 text-primary-600 mr-4" />
          <div>
            <h3 className="text-lg font-semibold text-primary-900">Resource Policy</h3>
            <p className="text-primary-700">
              All containers are limited to <strong>{RESOURCE_LIMITS.CPU_PER_CONTAINER}</strong> and{' '}
              <strong>{RESOURCE_LIMITS.MEMORY_PER_CONTAINER}</strong>
            </p>
            <p className="text-sm text-primary-600 mt-1">
              Total allocation: {totalCpuUsage} CPU cores, {totalMemoryUsage}GB memory
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.href}
                  className={`block p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-${action.color}-300 hover:bg-${action.color}-50 transition-colors duration-200`}
                >
                  <div className="flex items-center">
                    <action.icon className={`h-6 w-6 text-${action.color}-600 mr-3`} />
                    <div>
                      <p className="font-medium text-gray-900">{action.name}</p>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                    <PlusIcon className={`h-5 w-5 text-${action.color}-600 ml-auto`} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Services */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Services</h3>
                <Link to="/services" className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentServices.length > 0 ? (
                  recentServices.map((service) => (
                    <Link
                      key={service.ID}
                      to={`/services/${service.ID}`}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{service.Spec?.Name}</p>
                          <p className="text-sm text-gray-600">{service.Spec?.TaskTemplate?.ContainerSpec?.Image}</p>
                        </div>
                        <span className="badge badge-success">
                          {service.Spec?.Mode?.Replicated?.Replicas || 0} replicas
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No services deployed</p>
                )}
              </div>
            </div>

            {/* Recent Stacks */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Stacks</h3>
                <Link to="/stacks" className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentStacks.length > 0 ? (
                  recentStacks.map((stack) => (
                    <Link
                      key={stack.id}
                      to={`/stacks/${stack.name}`}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{stack.name}</p>
                          <p className="text-sm text-gray-600">{stack.services} services</p>
                        </div>
                        <span className={`badge ${
                          stack.status === 'running' ? 'badge-success' : 'badge-warning'
                        }`}>
                          {stack.status}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No stacks deployed</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
