import React, { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../store/auth';

const AddEquipmentForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    device_id: '',
    category: 'tractor'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Get the access token from Zustand
  const { access } = useAuth();

  const categories = [
    { value: 'tractor', label: 'Tractor' },
    { value: 'vehicle', label: 'Vehicle' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await api.post('/equipment/', formData, {
        headers: {
          Authorization: `Bearer ${access}`, // Use JWT here
          'Content-Type': 'application/json'
        }
      });

      setMessage('Equipment added successfully!');
      setFormData({
        name: '',
        device_id: '',
        category: 'tractor'
      });
    } catch (error) {
      setMessage('Error adding equipment: ' + (error.response?.data?.message || error.message));
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Add New Equipment</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Equipment Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter equipment name"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Device ID *</label>
          <input
            type="text"
            name="device_id"
            value={formData.device_id}
            onChange={handleChange}
            required
            placeholder="ESP32 device ID"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add Equipment'}
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

export default AddEquipmentForm;
