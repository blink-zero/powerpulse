import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiServer, FiAlertCircle, FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';

const NUTServersPage = () => {
  const [nutServers, setNutServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentServer, setCurrentServer] = useState(null);
  const [testingServer, setTestingServer] = useState(null);
  const [testResult, setTestResult] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    host: '',
    port: 3493,
    username: '',
    password: ''
  });

  useEffect(() => {
    fetchNutServers();
  }, []);

  const fetchNutServers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/nut/servers');
      setNutServers(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch NUT servers. Please try again later.');
      console.error('Error fetching NUT servers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'port' ? parseInt(value, 10) || '' : value
    });
  };

  const openAddModal = () => {
    setFormData({
      host: '',
      port: 3493,
      username: '',
      password: ''
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (server) => {
    setCurrentServer(server);
    setFormData({
      host: server.host,
      port: server.port || 3493,
      username: server.username || '',
      password: '' // Don't populate password for security reasons
    });
    setIsEditModalOpen(true);
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setCurrentServer(null);
    setTestResult(null);
  };

  const handleAddServer = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/nut/servers', formData);
      fetchNutServers();
      closeModals();
    } catch (err) {
      setError('Failed to add NUT server. Please try again.');
      console.error('Error adding NUT server:', err);
    }
  };

  const handleUpdateServer = async (e) => {
    e.preventDefault();
    try {
      // Only send password if it was changed (not empty)
      const dataToSend = { ...formData };
      if (!dataToSend.password) {
        delete dataToSend.password;
      }
      
      await axios.put(`/api/nut/servers/${currentServer.id}`, dataToSend);
      fetchNutServers();
      closeModals();
    } catch (err) {
      setError('Failed to update NUT server. Please try again.');
      console.error('Error updating NUT server:', err);
    }
  };

  const handleDeleteServer = async (serverId) => {
    if (window.confirm('Are you sure you want to delete this NUT server?')) {
      try {
        await axios.delete(`/api/nut/servers/${serverId}`);
        fetchNutServers();
      } catch (err) {
        setError('Failed to delete NUT server. Please try again.');
        console.error('Error deleting NUT server:', err);
      }
    }
  };

  const testServerConnection = async (server) => {
    setTestingServer(server.id);
    setTestResult(null);
    
    try {
      const response = await axios.post(`/api/nut/servers/${server.id}/test`);
      setTestResult({
        success: true,
        message: response.data.message || 'Connection successful',
        upsList: response.data.upsList || []
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || 'Connection failed'
      });
    } finally {
      setTestingServer(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading NUT servers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">NUT Servers</h1>
        <button
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <FiPlus className="mr-2 -ml-1 h-5 w-5" />
          Add NUT Server
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {nutServers.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 shadow rounded-lg">
          <FiServer className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No NUT Servers</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by adding a new NUT server.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FiPlus className="mr-2 -ml-1 h-5 w-5" />
              Add NUT Server
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Host
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Port
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Authentication
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {nutServers.map((server) => (
                <tr key={server.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiServer className="h-5 w-5 text-primary-600 mr-2" />
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {server.host}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {server.port || 3493}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      server.username ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {server.username ? 'Enabled' : 'None'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => testServerConnection(server)}
                      disabled={testingServer === server.id}
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 dark:text-primary-100 dark:bg-primary-900/30 dark:hover:bg-primary-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      {testingServer === server.id ? (
                        <>
                          <div className="animate-spin h-4 w-4 mr-1 border-t-2 border-b-2 border-primary-600 rounded-full"></div>
                          Testing...
                        </>
                      ) : (
                        'Test Connection'
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(server)}
                      className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400 mr-3"
                    >
                      <FiEdit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteServer(server.id)}
                      className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {testResult && (
        <div className={`rounded-md ${testResult.success ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'} p-4 mt-4`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className={`h-5 w-5 ${testResult.success ? 'text-green-400' : 'text-red-400'}`} />
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${testResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                {testResult.success ? 'Connection Successful' : 'Connection Failed'}
              </h3>
              <div className={`mt-2 text-sm ${testResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                <p>{testResult.message}</p>
                {testResult.upsList && testResult.upsList.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">UPS Systems Found:</p>
                    <ul className="list-disc pl-5 mt-1">
                      {testResult.upsList.map((ups, index) => (
                        <li key={index}>{ups}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add NUT Server Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Add NUT Server</h3>
                    <div className="mt-4">
                      <form onSubmit={handleAddServer}>
                        <div className="mb-4">
                          <label htmlFor="host" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Host
                          </label>
                          <input
                            type="text"
                            name="host"
                            id="host"
                            value={formData.host}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            placeholder="e.g. 192.168.1.100"
                          />
                        </div>
                        <div className="mb-4">
                          <label htmlFor="port" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Port
                          </label>
                          <input
                            type="number"
                            name="port"
                            id="port"
                            value={formData.port}
                            onChange={handleInputChange}
                            required
                            min="1"
                            max="65535"
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div className="mb-4">
                          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Username (Optional)
                          </label>
                          <input
                            type="text"
                            name="username"
                            id="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div className="mb-4">
                          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password (Optional)
                          </label>
                          <input
                            type="password"
                            name="password"
                            id="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleAddServer}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <FiCheck className="mr-2 h-5 w-5" />
                  Add
                </button>
                <button
                  type="button"
                  onClick={closeModals}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <FiX className="mr-2 h-5 w-5" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit NUT Server Modal */}
      {isEditModalOpen && currentServer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Edit NUT Server</h3>
                    <div className="mt-4">
                      <form onSubmit={handleUpdateServer}>
                        <div className="mb-4">
                          <label htmlFor="host" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Host
                          </label>
                          <input
                            type="text"
                            name="host"
                            id="host"
                            value={formData.host}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            placeholder="e.g. 192.168.1.100"
                          />
                        </div>
                        <div className="mb-4">
                          <label htmlFor="port" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Port
                          </label>
                          <input
                            type="number"
                            name="port"
                            id="port"
                            value={formData.port}
                            onChange={handleInputChange}
                            required
                            min="1"
                            max="65535"
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div className="mb-4">
                          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Username (Optional)
                          </label>
                          <input
                            type="text"
                            name="username"
                            id="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div className="mb-4">
                          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password (Leave blank to keep current)
                          </label>
                          <input
                            type="password"
                            name="password"
                            id="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            placeholder="••••••••"
                          />
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleUpdateServer}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <FiCheck className="mr-2 h-5 w-5" />
                  Update
                </button>
                <button
                  type="button"
                  onClick={closeModals}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <FiX className="mr-2 h-5 w-5" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NUTServersPage;
