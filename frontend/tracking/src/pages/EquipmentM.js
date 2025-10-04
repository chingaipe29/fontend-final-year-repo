import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { fetchEquipment, createEquipment, updateEquipment, deleteEquipment } from "../api";
// Icons
const EquipmentIcon = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
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

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center w-full max-w-xs p-4 mb-4 rounded-lg shadow-lg ${
      type === "success" ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"
    }`}>
      <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg ${
        type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
      }`}>
        {type === "success" ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        )}
      </div>
      <div className="ml-3 text-sm font-normal">{message}</div>
      <button type="button" className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 hover:bg-gray-100" onClick={onClose}>
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
        </svg>
      </button>
    </div>
  );
};

// Delete Modal
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, equipment }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <span className="font-semibold">{equipment?.name}</span>? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={() => onConfirm(equipment.id)} className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
};

// Equipment Form Modal aligned with backend
const EquipmentFormModal = ({ isOpen, onClose, equipment, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    device_id: "",
    category: "tractor", // default
  });

  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name || "",
        device_id: equipment.device_id || "",
        category: equipment.category || "tractor",
      });
    }
  }, [equipment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, equipment?.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">{equipment ? "Edit Equipment" : "Add Equipment"}</h2>
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

          {/* Category */}
          <div>
            <label className="block text-sm font-medium">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="tractor">Tractor</option>
              <option value="vehicle">Vehicle</option>
              <option value="livestock">Livestock</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Buttons */}
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
              {equipment ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Equipment Card
const EquipmentCard = ({ equipment, onEdit, onDelete }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 relative group">
    <div className="flex items-start space-x-4">
      <div className="p-3 rounded-xl bg-blue-100">
        <EquipmentIcon className="w-6 h-6 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 truncate">{equipment.name}</h3>
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(equipment)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit equipment"><EditIcon /></button>
            <button onClick={() => onDelete(equipment)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete equipment"><TrashIcon /></button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium w-20">ID:</span>
            <span>{equipment.device_id}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium w-20">Category:</span>
            <span className="capitalize">{equipment.category}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function EquipmentManagement() {
  const [equipments, setEquipments] = useState([]);
  const [filteredEquipments, setFilteredEquipments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, equipment: null });
  const [formModal, setFormModal] = useState({ isOpen: false, equipment: null });

  /// Load Equipments - FIX RESPONSE HANDLING
// Load Equipments
useEffect(() => {
  const loadEquipments = async () => {
    try {
      setLoading(true);
      const response = await fetchEquipment(); // ✅ call the imported function directly
      setEquipments(response.data);
    } catch (error) {
      setToasts(prev => [...prev, { id: Date.now(), message: "Failed to load equipments", type: "error" }]);
    } finally {
      setLoading(false);
    }
  };
  loadEquipments();
}, []);


// Save Equipment - FIX RESPONSE HANDLING
const handleSaveEquipment = async (data, id) => {
  try {
    let saved;

    if (id) {
  saved = await updateEquipment(id, data);
  setEquipments(prev => prev.map(e => (e.id === id ? saved.data : e)));
} else {
  saved = await createEquipment(data);
  setEquipments(prev => [...prev, saved.data]);
}

    setToasts(prev => [
      ...prev,
      { id: Date.now(), message: `${saved.data.name} saved successfully`, type: "success" },
    ]);
  } catch (error) {
    // Log full error to console for debugging
    console.error("Error saving equipment:", error);

    // Try to get server-provided error message
    let message = "Error saving equipment";
    if (error.response && error.response.data) {
      // Django REST Framework often returns an object with field errors
      const errData = error.response.data;
      if (typeof errData === "string") {
        message = errData;
      } else if (typeof errData === "object") {
        // Combine field errors into a single string
        message = Object.entries(errData)
          .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
          .join(" | ");
      }
    }

    setToasts(prev => [
      ...prev,
      { id: Date.now(), message, type: "error" },
    ]);
  }
};

  // Filter
  useEffect(() => {
    const filtered = equipments.filter(eq =>
      (eq.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (eq.device_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (eq.category || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEquipments(filtered);
  }, [equipments, searchTerm]);

const handleDeleteEquipment = async (id) => {
  console.log("🔍 Deleting equipment with ID:", id);

  try {
    // Use direct API call instead of imported function
    const response = await api.delete(`/equipment/delete/${id}/`);
    console.log("✅ Delete API response:", response);

    setEquipments(prev => prev.filter(e => e.id !== id));

    setToasts(prev => [
      ...prev,
      { id: Date.now(), message: "Equipment deleted successfully", type: "success" }
    ]);

    setDeleteModal({ isOpen: false, equipment: null });
  } catch (error) {
    console.error("❌ Error deleting equipment:", error.response || error.message || error);

    setToasts(prev => [
      ...prev,
      { id: Date.now(), message: "Failed to delete equipment", type: "error" }
    ]);
  }
};

  if (loading) return (
    <div className="flex h-screen bg-gray-50 items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading equipments...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))} />)}
      </div>

      {/* Modals */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, equipment: null })}
        onConfirm={handleDeleteEquipment}
        equipment={deleteModal.equipment}
      />
      <EquipmentFormModal
        isOpen={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false, equipment: null })}
        equipment={formModal.equipment}
        onSave={handleSaveEquipment}
      />

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeftIcon /></Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Equipment Management</h1>
              <p className="text-sm text-gray-500">Manage your farm equipments</p>
            </div>
          </div>
          <button onClick={() => setFormModal({ isOpen: true, equipment: null })} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <PlusIcon className="mr-2"/> Add Equipment
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Equipment Directory</h2>
              <p className="text-sm text-gray-500">Manage and track your farm equipments</p>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search equipments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Equipment Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {searchTerm && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">{filteredEquipments.length} result{filteredEquipments.length !== 1 ? 's' : ''} found for "{searchTerm}"</p>
            </div>
          )}
          {filteredEquipments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredEquipments.map(eq => (
                <EquipmentCard
                  key={eq.id}
                  equipment={eq}
                  onEdit={e => setFormModal({ isOpen: true, equipment: e })}
                  onDelete={e => setDeleteModal({ isOpen: true, equipment: e })}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <EquipmentIcon className="w-12 h-12 text-gray-400"/>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{searchTerm ? `No equipments found for "${searchTerm}"` : 'No equipments registered'}</h3>
              <p className="text-gray-500 mb-6">{searchTerm ? 'Try searching with different terms or clear the search' : 'Start by adding new equipment to your farm directory'}</p>
              {!searchTerm && <button onClick={() => setFormModal({ isOpen: true, equipment: null })} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Add Equipment</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}