import React, { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../store/auth';

const AddLivestockForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    device_id: '',
    animal_type: '',
    breed: '',
    age: '',
    health_status: 'healthy'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { token } = useAuth();

  const healthStatuses = [
    { value: 'healthy', label: 'Healthy' },
    { value: 'sick', label: 'Sick' },
    { value: 'injured', label: 'Injured' },
    { value: 'pregnant', label: 'Pregnant' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const equipmentData = {
        name: formData.name,
        device_id: formData.device_id,
        category: 'livestock',
        metadata: {
          animal_type: formData.animal_type,
          breed: formData.breed,
          age: formData.age,
          health_status: formData.health_status
        }
      };

      await api.post('/equipment/', equipmentData, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      setMessage('Livestock added successfully!');
      setFormData({
        name: '',
        device_id: '',
        animal_type: '',
        breed: '',
        age: '',
        health_status: 'healthy'
      });
    } catch (error) {
      setMessage('Error adding livestock: ' + (error.response?.data?.message || error.message));
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Add New Livestock</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Animal Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g., Daisy the Cow"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Tracker Device ID *</label>
          <input
            type="text"
            name="device_id"
            value={formData.device_id}
            onChange={handleChange}
            required
            placeholder="GPS collar device ID"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Animal Type *</label>
          <input
            type="text"
            name="animal_type"
            value={formData.animal_type}
            onChange={handleChange}
            required
            placeholder="e.g., Cow, Sheep, Goat"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Breed</label>
          <input
            type="text"
            name="breed"
            value={formData.breed}
            onChange={handleChange}
            placeholder="e.g., Holstein, Merino"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Age</label>
          <input
            type="text"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="e.g., 2 years, 6 months"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Health Status</label>
          <select
            name="health_status"
            value={formData.health_status}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {healthStatuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add Livestock'}
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

export default AddLivestockForm;
