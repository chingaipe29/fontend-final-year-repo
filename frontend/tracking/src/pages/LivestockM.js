import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
// Icons
const LivestockIcon = ({ className = "w-6 h-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 8c-1-2 1-4 3-3l1 1 4 0 1-1c2-1 4 1 3 3" />
    <circle cx="9" cy="13" r="1" />
    <circle cx="15" cy="13" r="1" />
    <path d="M8 16c2 2 6 2 8 0" />
    <path d="M5 10c-2 1-2 4 0 5" />
    <path d="M19 10c2 1 2 4 0 5" />
  </svg>
);


const EditIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6"/>
    <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1 2-2h4a2,2 0 0,1 2,2v2"/>
  </svg>
);

const PlusIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const ArrowLeftIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H6m6-7l-7 7 7 7"/>
  </svg>
);

const LocationIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

// Toast Component
const Toast = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center w-full max-w-xs p-4 mb-4 rounded-lg shadow-lg transition-opacity duration-300 ${
      type === 'success' 
        ? 'bg-green-100 text-green-700 border border-green-200' 
        : 'bg-red-100 text-red-700 border border-red-200'
    }`}>
      <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg ${
        type === 'success' 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}>
        {type === 'success' ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <div className="ml-3 text-sm font-normal">{message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex h-8 w-8 hover:bg-gray-100 transition-colors"
        onClick={onClose}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

// Confirmation Modal
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, livestock }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <span className="font-semibold">{livestock?.name}</span>? This action cannot be undone.
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(livestock.id)}
            className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// livestock Form Modal
const LivestockFormModal = ({ isOpen, onClose, livestock, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    device_id: "",
    animal_type: "cow",
    breed: "",
    age: "",
    notes: "",
  });

  // Populate form when editing existing livestock
  useEffect(() => {
    if (livestock) {
      setFormData({
        name: livestock.name || "",
        device_id: livestock.device_id || "",
        animal_type: livestock.animal_type || "cow",
        breed: livestock.breed || "",
        age: livestock.age || "",
        notes: livestock.notes || "",
      });
    }
  }, [livestock]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, livestock?.id); // send data and id to parent
    onClose();        // close modal
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">
          {livestock ? "Edit Livestock" : "Add Livestock"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          {/* Device ID */}
          <div>
            <label className="block text-sm font-medium">Device ID</label>
            <input
              type="text"
              name="device_id"
              value={formData.device_id}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          {/* Animal Type */}
          <div>
            <label className="block text-sm font-medium">Animal Type</label>
            <select
              name="animal_type"
              value={formData.animal_type}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="cow">Cow</option>
              <option value="sheep">Sheep</option>
              <option value="goat">Goat</option>
              <option value="chicken">Chicken</option>
              <option value="pig">Pig</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Breed */}
          <div>
            <label className="block text-sm font-medium">Breed</label>
            <input
              type="text"
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium">Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              min="0"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              rows="3"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              {livestock ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
// livestock Card Component
const LivestockCard = ({ livestock, onEdit, onDelete, onViewLocation }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 relative group">
      <div className="flex items-start space-x-4">
        <div className="p-3 rounded-xl bg-blue-100">
          <LivestockIcon className="w-6 h-6 text-blue-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 truncate">{livestock.name}</h3>
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(livestock)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit livestock"
              >
                <EditIcon />
              </button>
              <button
                onClick={() => onDelete(livestock)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete livestock"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium w-20">Device ID:</span>
              <span>{livestock.device_id}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium w-20">Type:</span>
              <span className="capitalize">{livestock.animal_type}</span>
            </div>
            
            {livestock.breed && (
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium w-20">Breed:</span>
                <span className="capitalize">{livestock.breed}</span>
              </div>
            )}
            
            {livestock.age && (
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium w-20">Age:</span>
                <span>{livestock.age} years</span>
              </div>
            )}
          </div>
          
          {livestock.device_id && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => onViewLocation(livestock)}
                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                <LocationIcon className="w-4 h-4 mr-1" />
                View Location
              </button>
            </div>
          )}
          
          <div className="mt-3 text-xs text-gray-500">
            Registered: {new Date(livestock.registered_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main livestock Management Component
export default function LivestockManagement() {
  const [livestocks, setlivestocks] = useState([]);
  const [filteredlivestocks, setFilteredlivestocks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, livestock: null });
  const [formModal, setFormModal] = useState({ isOpen: false, livestock: null });
  const navigate = useNavigate();

  // Fetch livestocks from API


const fetchlivestocks = async () => {
  try {
    const response = await api.get("/livestock/"); // no need for API_BASE
    return response.data;
  } catch (error) {
    console.error("Failed to fetch livestocks:", error);
    throw error;
  }
};


const savelivestock = async (data, id) => {
  try {
    const url = id ? `/livestock/${id}/` : `/livestock/`;
    const method = id ? "put" : "post";

    const response = await api[method](url, data);  // use axios instance

    const saved = response.data;

    if (id) {
      setlivestocks((prev) =>
        prev.map((emp) => (emp.id === id ? saved : emp))
      );
      showToast(`${saved.name} updated successfully`, "success");
    } else {
      setlivestocks((prev) => [...prev, saved]);
      showToast(`${saved.name} added successfully`, "success");
    }
  } catch (error) {
    console.error("Failed to save livestock:", error);
    showToast("Error saving livestock", "error");
  }
};

const deletelivestock = async (id) => {
  try {
    await api.delete(`/livestock/delete/${id}/`);  // ✅ Use correct delete endpoint
    // update state after successful deletion
    setlivestocks((prev) => prev.filter((emp) => emp.id !== id));
    showToast("livestock deleted successfully", "success");
    setDeleteModal({ isOpen: false, livestock: null });
  } catch (error) {
    console.error("Failed to delete livestock:", error);
    showToast("Failed to delete livestock", "error");
  }
};

  const showToast = (message, type) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchlivestocks();
      setlivestocks(data);
    } catch (error) {
      showToast("Failed to load livestocks", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

 useEffect(() => {
  const filtered = livestocks.filter(livestock =>
    (livestock.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (livestock.device_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (livestock.animal_type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (livestock.breed || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
  setFilteredlivestocks(filtered);
}, [livestocks, searchTerm]);


  const handleViewLocation = (livestock) => {
    if (livestock.device_id) {
      navigate(`/track/${livestock.device_id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading livestocks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* Modals */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, livestock: null })}
        onConfirm={deletelivestock}
        livestock={deleteModal.livestock}
      />

      <LivestockFormModal
        isOpen={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false, livestock: null })}
        livestock={formModal.livestock}
        onSave={savelivestock}
      />

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">livestock Management</h1>
                <p className="text-sm text-gray-500">Manage your farm staff and workers</p>
              </div>
            </div>
            
            <button
              onClick={() => setFormModal({ isOpen: true, livestock: null })}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="mr-2" />
              Add livestock
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Stats */}
        <div className="mb-8 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total livestocks</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{livestocks.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50">
                  <LivestockIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">With Trackers</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {livestocks.filter(emp => emp.tracker_device_id).length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-50">
                  <LocationIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Today</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {Math.floor(livestocks.length * 0.8)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50">
                  <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">livestock Directory</h2>
                <p className="text-sm text-gray-500">Manage and track your farm livestocks</p>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search livestocks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* livestock Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            {searchTerm && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  {filteredlivestocks.length} result{filteredlivestocks.length !== 1 ? 's' : ''} found for "{searchTerm}"
                </p>
              </div>
            )}

            {filteredlivestocks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredlivestocks.map((livestock) => (
                  <LivestockCard
                    key={livestock.id}
                    livestock={livestock}
                    onEdit={(emp) => setFormModal({ isOpen: true, livestock: emp })}
                    onDelete={(emp) => setDeleteModal({ isOpen: true, livestock: emp })}
                    onViewLocation={handleViewLocation}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LivestockIcon className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? `No livestocks found for "${searchTerm}"` : 'No livestocks registered'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm 
                    ? 'Try searching with different terms or clear the search'
                    : 'Start by adding your first livestock to track their location and activities'
                  }
                </p>
                {searchTerm ? (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear search
                  </button>
                ) : (
                  <button
                    onClick={() => setFormModal({ isOpen: true, livestock: null })}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add First livestock
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}