import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { PlusIcon, EyeIcon, TrashIcon, ServerIcon } from '@heroicons/react/24/outline';
import { stackApi as stackService } from '../services/stackService';
import type { Stack, StackListItem } from '../types';

interface DeleteModalProps {
  stack: StackListItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ stack, isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Stack</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete stack "{stack.name}"? This action cannot be undone.
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

const Stacks: React.FC = () => {
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; stack: StackListItem | null }>({
    isOpen: false,
    stack: null,
  });

  const { data: stacksData, isLoading, error, refetch } = useQuery(
    'stacks',
    stackService.list,
    {
      refetchInterval: 5000,
    }
  );

  const stacks = stacksData?.stacks || [];

  const handleDeleteStack = async () => {
    if (!deleteModal.stack) return;

    try {
      await stackService.delete(deleteModal.stack.name);
      setDeleteModal({ isOpen: false, stack: null });
      refetch();
    } catch (error) {
      console.error('Failed to delete stack:', error);
    }
  };

  const getStackServices = (stack: StackListItem) => {
    return stack.services; // services is already a number for list items
  };

  const getStackStatus = (stack: StackListItem) => {
    if (!stack.services || stack.services === 0) {
      return { status: 'Empty', color: 'text-gray-500' };
    }

    // For list view, we don't have detailed service info, so use simple logic
    if (stack.status === 'active') {
      return { status: 'Running', color: 'text-green-600' };
    } else if (stack.status === 'partial') {
      return { status: 'Partial', color: 'text-yellow-600' };
    } else {
      return { status: 'Stopped', color: 'text-red-600' };
    }
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
          Failed to load stacks. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Docker Stacks</h1>
        <Link
          to="/stacks/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Create Stack</span>
        </Link>
      </div>

      {stacks.length === 0 ? (
        <div className="text-center py-12">
          <ServerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No stacks found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first Docker stack.</p>
          <Link
            to="/stacks/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Create Stack</span>
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
                  Services
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stacks.map((stack) => {
                const { status, color } = getStackStatus(stack);
                return (
                  <tr key={stack.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ServerIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{stack.name}</div>
                          <div className="text-sm text-gray-500">
                            {stack.services} service{stack.services !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getStackServices(stack)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${color}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stack.createdAt ? new Date(stack.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/stacks/${stack.name}`}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, stack })}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Stack"
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
      )}

      <DeleteModal
        stack={deleteModal.stack!}
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, stack: null })}
        onConfirm={handleDeleteStack}
      />
    </div>
  );
};

export default Stacks;
