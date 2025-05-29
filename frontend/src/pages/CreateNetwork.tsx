import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { networkApi } from '../services/networkService';
import type { NetworkCreateSpec } from '../types';

interface IPAMConfig {
  subnet: string;
  gateway: string;
  ipRange: string;
}

const CreateNetwork: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<{
    name: string;
    driver: string;
    internal: boolean;
    attachable: boolean;
    ingress: boolean;
    scope: string;
    ipamConfigs: IPAMConfig[];
    options: Record<string, string>;
    labels: Record<string, string>;
  }>({
    name: '',
    driver: 'overlay',
    internal: false,
    attachable: true,
    ingress: false,
    scope: 'swarm',
    ipamConfigs: [{ subnet: '', gateway: '', ipRange: '' }],
    options: {},
    labels: {},
  });

  const [optionEntries, setOptionEntries] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' }
  ]);

  const [labelEntries, setLabelEntries] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare IPAM configuration
      const ipamConfig = formData.ipamConfigs
        .filter(config => config.subnet)
        .map(config => ({
          subnet: config.subnet,
          gateway: config.gateway || undefined,
          ipRange: config.ipRange || undefined,
        }));

      // Prepare options
      const options = optionEntries
        .filter(entry => entry.key && entry.value)
        .reduce((acc, entry) => {
          acc[entry.key] = entry.value;
          return acc;
        }, {} as Record<string, string>);

      // Prepare labels
      const labels = labelEntries
        .filter(entry => entry.key && entry.value)
        .reduce((acc, entry) => {
          acc[entry.key] = entry.value;
          return acc;
        }, {} as Record<string, string>);

      const networkSpec: NetworkCreateSpec = {
        name: formData.name,
        driver: formData.driver,
        internal: formData.internal,
        attachable: formData.attachable,
        ingress: formData.ingress,
        scope: formData.scope,
        ipam: ipamConfig.length > 0 ? {
          driver: 'default',
          config: ipamConfig,
        } : undefined,
        options: Object.keys(options).length > 0 ? options : undefined,
        labels: Object.keys(labels).length > 0 ? labels : undefined,
      };

      await networkApi.create(networkSpec);
      navigate('/networks');
    } catch (error) {
      console.error('Failed to create network:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addIPAMConfig = () => {
    setFormData(prev => ({
      ...prev,
      ipamConfigs: [...prev.ipamConfigs, { subnet: '', gateway: '', ipRange: '' }],
    }));
  };

  const removeIPAMConfig = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ipamConfigs: prev.ipamConfigs.filter((_, i) => i !== index),
    }));
  };

  const updateIPAMConfig = (index: number, field: keyof IPAMConfig, value: string) => {
    setFormData(prev => ({
      ...prev,
      ipamConfigs: prev.ipamConfigs.map((config, i) => 
        i === index ? { ...config, [field]: value } : config
      ),
    }));
  };

  const addOption = () => {
    setOptionEntries(prev => [...prev, { key: '', value: '' }]);
  };

  const removeOption = (index: number) => {
    setOptionEntries(prev => prev.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: 'key' | 'value', value: string) => {
    setOptionEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const addLabel = () => {
    setLabelEntries(prev => [...prev, { key: '', value: '' }]);
  };

  const removeLabel = (index: number) => {
    setLabelEntries(prev => prev.filter((_, i) => i !== index));
  };

  const updateLabel = (index: number, field: 'key' | 'value', value: string) => {
    setLabelEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/networks')}
          className="p-2 hover:bg-gray-100 rounded-lg mr-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Network</h1>
          <p className="text-gray-500">Create a new Docker network for your services</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Network Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="my-network"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver
              </label>
              <select
                value={formData.driver}
                onChange={(e) => setFormData(prev => ({ ...prev, driver: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="overlay">overlay</option>
                <option value="bridge">bridge</option>
                <option value="host">host</option>
                <option value="none">none</option>
                <option value="macvlan">macvlan</option>
                <option value="ipvlan">ipvlan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Network Options */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Options</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="attachable"
                checked={formData.attachable}
                onChange={(e) => setFormData(prev => ({ ...prev, attachable: e.target.checked }))}
                className="mr-3"
              />
              <label htmlFor="attachable" className="text-sm font-medium text-gray-700">
                Attachable
              </label>
              <span className="text-sm text-gray-500 ml-2">
                (Allow manual container attachment)
              </span>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="internal"
                checked={formData.internal}
                onChange={(e) => setFormData(prev => ({ ...prev, internal: e.target.checked }))}
                className="mr-3"
              />
              <label htmlFor="internal" className="text-sm font-medium text-gray-700">
                Internal
              </label>
              <span className="text-sm text-gray-500 ml-2">
                (Restrict external access)
              </span>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="ingress"
                checked={formData.ingress}
                onChange={(e) => setFormData(prev => ({ ...prev, ingress: e.target.checked }))}
                className="mr-3"
              />
              <label htmlFor="ingress" className="text-sm font-medium text-gray-700">
                Ingress
              </label>
              <span className="text-sm text-gray-500 ml-2">
                (Load balancer network)
              </span>
            </div>
          </div>
        </div>

        {/* IPAM Configuration */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">IPAM Configuration</h3>
            <button
              type="button"
              onClick={addIPAMConfig}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add Config</span>
            </button>
          </div>
          <div className="space-y-4">
            {formData.ipamConfigs.map((config, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">IPAM Config {index + 1}</h4>
                  {formData.ipamConfigs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIPAMConfig(index)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subnet
                    </label>
                    <input
                      type="text"
                      placeholder="10.0.0.0/24"
                      value={config.subnet}
                      onChange={(e) => updateIPAMConfig(index, 'subnet', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gateway
                    </label>
                    <input
                      type="text"
                      placeholder="10.0.0.1"
                      value={config.gateway}
                      onChange={(e) => updateIPAMConfig(index, 'gateway', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IP Range
                    </label>
                    <input
                      type="text"
                      placeholder="10.0.0.0/28"
                      value={config.ipRange}
                      onChange={(e) => updateIPAMConfig(index, 'ipRange', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Driver Options */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Driver Options</h3>
            <button
              type="button"
              onClick={addOption}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add Option</span>
            </button>
          </div>
          <div className="space-y-3">
            {optionEntries.map((option, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="option-key"
                  value={option.key}
                  onChange={(e) => updateOption(index, 'key', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span>=</span>
                <input
                  type="text"
                  placeholder="option-value"
                  value={option.value}
                  onChange={(e) => updateOption(index, 'value', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Labels */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Labels</h3>
            <button
              type="button"
              onClick={addLabel}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add Label</span>
            </button>
          </div>
          <div className="space-y-3">
            {labelEntries.map((label, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="label-key"
                  value={label.key}
                  onChange={(e) => updateLabel(index, 'key', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span>=</span>
                <input
                  type="text"
                  placeholder="label-value"
                  value={label.value}
                  onChange={(e) => updateLabel(index, 'value', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => removeLabel(index)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/networks')}
            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Network'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateNetwork;
