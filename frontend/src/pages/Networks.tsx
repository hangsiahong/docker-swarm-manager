import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  TrashIcon, 
  GlobeAltIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { networkApi } from '../services/networkService';
import type { Network } from '../types';

interface DeleteModalProps {
  network: Network;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ network, isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Network</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete network "{network.Name}"? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

interface NetworkDetailModalProps {
  network: Network;
  isOpen: boolean;
  onClose: () => void;
}

const NetworkDetailModal: React.FC<NetworkDetailModalProps> = ({ network, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-2/3 max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Network Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {network.Name}</div>
              <div><span className="font-medium">ID:</span> {network.Id}</div>
              <div><span className="font-medium">Driver:</span> {network.Driver}</div>
              <div><span className="font-medium">Scope:</span> {network.Scope}</div>
              <div><span className="font-medium">Created:</span> {new Date(network.Created).toLocaleString()}</div>
              <div><span className="font-medium">Attachable:</span> {network.Attachable ? 'Yes' : 'No'}</div>
              <div><span className="font-medium">Ingress:</span> {network.Ingress ? 'Yes' : 'No'}</div>
              <div><span className="font-medium">Internal:</span> {network.Internal ? 'Yes' : 'No'}</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">IPAM Configuration</h4>
            {network.IPAM?.Config && network.IPAM.Config.length > 0 ? (
              <div className="space-y-2 text-sm">
                {network.IPAM.Config.map((config, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded">
                    {config.Subnet && <div><span className="font-medium">Subnet:</span> {config.Subnet}</div>}
                    {config.Gateway && <div><span className="font-medium">Gateway:</span> {config.Gateway}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No IPAM configuration</p>
            )}
          </div>
        </div>

        {network.Options && Object.keys(network.Options).length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Options</h4>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <pre className="whitespace-pre-wrap">{JSON.stringify(network.Options, null, 2)}</pre>
            </div>
          </div>
        )}

        {network.Labels && Object.keys(network.Labels).length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Labels</h4>
            <div className="space-y-1 text-sm">
              {Object.entries(network.Labels).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-2 rounded">
                  <span className="font-medium">{key}:</span> {String(value)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Networks: React.FC = () => {
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; network: Network | null }>({
    isOpen: false,
    network: null,
  });
  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; network: Network | null }>({
    isOpen: false,
    network: null,
  });

  const { data: networks = [], isLoading, error, refetch } = useQuery(
    'networks',
    networkApi.list,
    {
      refetchInterval: 10000, // Less frequent than services
    }
  );

  const handleDeleteNetwork = async () => {
    if (!deleteModal.network) return;

    try {
      await networkApi.delete(deleteModal.network.Id);
      setDeleteModal({ isOpen: false, network: null });
      refetch();
    } catch (error) {
      console.error('Failed to delete network:', error);
    }
  };

  const getNetworkType = (network: Network) => {
    if (network.Ingress) return { type: 'Ingress', color: 'bg-purple-100 text-purple-800' };
    if (network.Internal) return { type: 'Internal', color: 'bg-yellow-100 text-yellow-800' };
    if (network.Attachable) return { type: 'Attachable', color: 'bg-green-100 text-green-800' };
    return { type: 'Standard', color: 'bg-gray-100 text-gray-800' };
  };

  const canDelete = (network: Network) => {
    // Don't allow deletion of system networks
    const systemNetworks = ['bridge', 'host', 'none', 'ingress'];
    return !systemNetworks.includes(network.Name) && network.Scope !== 'swarm';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Failed to load networks. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Docker Networks</h1>
        <Link
          to="/networks/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Create Network</span>
        </Link>
      </div>

      {networks.length === 0 ? (
        <div className="text-center py-12">
          <GlobeAltIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No networks found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first Docker network.</p>
          <Link
            to="/networks/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Create Network</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scope
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subnet
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {networks.map((network) => {
                const { type, color } = getNetworkType(network);
                const subnet = network.IPAM?.Config?.[0]?.Subnet || 'N/A';
                
                return (
                  <tr key={network.Id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{network.Name}</div>
                          <div className="text-sm text-gray-500 font-mono">
                            {network.Id.substring(0, 12)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {network.Driver}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {network.Scope}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${color}`}>
                        {type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {subnet}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setDetailModal({ isOpen: true, network })}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <InformationCircleIcon className="h-4 w-4" />
                        </button>
                        {canDelete(network) && (
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, network })}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete Network"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <DeleteModal
        network={deleteModal.network!}
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, network: null })}
        onConfirm={handleDeleteNetwork}
      />

      <NetworkDetailModal
        network={detailModal.network!}
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, network: null })}
      />
    </div>
  );
};

export default Networks;
