import React, { useState } from 'react';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import Card from './Card';
import Button from './Button';
import FormField from './FormField';
import Modal from './Modal';
import { useForm } from '../hooks/useForm';
import { useApi } from '../hooks/useApi';
import { useToast } from './ToastContainer';
import { isValidHost, isValidPort } from '../utils/validationUtils';
import { formatErrorMessage } from '../utils/errorUtils';
import { getNutServers, addNutServer, deleteNutServer } from '../services/nutService';

/**
 * Example component demonstrating the use of custom hooks and components
 * This is a simplified version of a NUT server management component
 */
const ExampleComponent = () => {
  // State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [serverToDelete, setServerToDelete] = useState(null);

  // Toast notifications
  const toast = useToast();

  // Fetch NUT servers using the useApi hook
  const { 
    data: nutServers, 
    loading, 
    error, 
    execute: fetchNutServers 
  } = useApi(getNutServers);

  // Form validation rules
  const validationRules = {
    host: {
      required: true,
      requiredMessage: 'Server host is required',
      validator: isValidHost,
      message: 'Please enter a valid hostname or IP address'
    },
    port: {
      required: true,
      requiredMessage: 'Port is required',
      validator: isValidPort,
      message: 'Port must be a number between 1 and 65535'
    }
  };

  // Form handling with useForm hook
  const { 
    values, 
    errors, 
    touched, 
    isSubmitting,
    handleChange, 
    handleBlur, 
    handleSubmit,
    resetForm
  } = useForm(
    { host: '', port: 3493, username: '', password: '' },
    validationRules,
    onAddServer
  );

  // Add server handler
  async function onAddServer(formData) {
    try {
      await addNutServer(formData);
      toast.success('NUT server added successfully');
      setIsAddModalOpen(false);
      resetForm();
      fetchNutServers();
    } catch (err) {
      toast.error(formatErrorMessage(err));
    }
  }

  // Delete server handler
  async function handleDeleteServer() {
    if (!serverToDelete) return;
    
    try {
      await deleteNutServer(serverToDelete.id);
      toast.success('NUT server deleted successfully');
      setServerToDelete(null);
      fetchNutServers();
    } catch (err) {
      toast.error(formatErrorMessage(err));
    }
  }

  // Render loading state
  if (loading && !nutServers) {
    return (
      <Card className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
        <div className="text-red-800 dark:text-red-200">
          <h3 className="text-lg font-medium">Error loading NUT servers</h3>
          <p className="mt-1">{error}</p>
          <Button 
            variant="primary" 
            className="mt-4" 
            onClick={fetchNutServers}
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card
        title="NUT Servers"
        titleIcon={<FiServer className="h-5 w-5 text-primary-500" />}
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<FiPlus />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Server
          </Button>
        }
      >
        {nutServers?.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No NUT servers found. Add a server to get started.</p>
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {nutServers?.map(server => (
              <div key={server.id} className="py-4 flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    {server.host}:{server.port}
                  </h4>
                  {server.username && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Authentication: Enabled
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="light"
                    size="sm"
                    icon={<FiEdit className="h-4 w-4" />}
                    onClick={() => toast.info('Edit functionality would go here')}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<FiTrash2 className="h-4 w-4" />}
                    onClick={() => setServerToDelete(server)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Server Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add NUT Server"
        footer={
          <Modal.Footer
            onCancel={() => setIsAddModalOpen(false)}
            onConfirm={handleSubmit}
            confirmText="Add Server"
            loading={isSubmitting}
          />
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            id="host"
            name="host"
            label="Host"
            type="text"
            placeholder="e.g. 192.168.1.100"
            value={values.host}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.host}
            touched={touched.host}
            required
          />
          
          <FormField
            id="port"
            name="port"
            label="Port"
            type="number"
            value={values.port}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.port}
            touched={touched.port}
            required
            inputProps={{ min: 1, max: 65535 }}
          />
          
          <FormField
            id="username"
            name="username"
            label="Username (Optional)"
            type="text"
            value={values.username}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          
          <FormField
            id="password"
            name="password"
            label="Password (Optional)"
            type="password"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!serverToDelete}
        onClose={() => setServerToDelete(null)}
        title="Confirm Deletion"
        size="sm"
        footer={
          <Modal.Footer
            onCancel={() => setServerToDelete(null)}
            onConfirm={handleDeleteServer}
            confirmText="Delete"
            danger
          />
        }
      >
        <p>
          Are you sure you want to delete the NUT server{' '}
          <span className="font-medium">
            {serverToDelete?.host}:{serverToDelete?.port}
          </span>
          ? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default ExampleComponent;
