import React, { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../store/auth';

const AddEmployeeForm = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    employee_id: '',
    tracker_device_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Use the hook at the top level of the component
  const { access } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await api.post('/employees/', formData, {
  headers: {
    Authorization: `Bearer ${access}`,  // <-- use access token from useAuth()
    'Content-Type': 'application/json'
  }
});

      setMessage('Employee added successfully!');
      setFormData({
        full_name: '',
        employee_id: '',
        tracker_device_id: ''
      });
    } catch (error) {
      setMessage('Error adding employee: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Add New Employee</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Full Name *</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
            placeholder="Enter full name"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Employee ID *</label>
          <input
            type="text"
            name="employee_id"
            value={formData.employee_id}
            onChange={handleChange}
            required
            placeholder="Unique employee ID"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Tracker Device ID (Optional)</label>
          <input
            type="text"
            name="tracker_device_id"
            value={formData.tracker_device_id}
            onChange={handleChange}
            placeholder="GPS tracker device ID"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add Employee'}
        </button>

        {message && (
          <div className={`text-center mt-3 ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default AddEmployeeForm;
