import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';

// Work Form Modal Component
function WorkFormModal({ work, onClose, onSave }) {
  const { success, error } = useToast();
  const [categories, setCategories] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [tags, setTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const initialFormData = useRef({
    title: work?.title || '',
    description: work?.description || '',
    author_name: work?.author_name || '',
    author_email: work?.author_email || '',
    academic_year: work?.academic_year || new Date().getFullYear().toString(),
    category_id: work?.category_id || '',
    work_type_id: work?.work_type_id || '',
    google_file_id: work?.google_file_id || '',
    file_url: work?.file_url || '',
    is_public: work?.is_public ?? true,
    selectedTags: work?.tags?.map(t => t.id) || []
  });
  const [formData, setFormData] = useState(initialFormData.current);

  // Check if form has unsaved changes
  const checkIsDirty = useCallback((data) => {
    return JSON.stringify(data) !== JSON.stringify(initialFormData.current);
  }, []);

  // Handle close with unsaved changes warning
  const handleClose = useCallback(() => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  // Handle reset to defaults
  const handleReset = useCallback(() => {
    setFormData(initialFormData.current);
    setErrors({});
    setIsDirty(false);
  }, []);

  // Add beforeunload listener to warn about unsaved changes on page refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    fetchCategories();
    fetchWorkTypes();
    fetchTags();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) setCategories(data.data || []);
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchWorkTypes = async () => {
    try {
      const response = await fetch('/api/work-types');
      const data = await response.json();
      if (data.success) setWorkTypes(data.data || []);
    } catch (err) {
      console.error('Failed to fetch work types');
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      const data = await response.json();
      if (data.success) setTags(data.data || []);
    } catch (err) {
      console.error('Failed to fetch tags');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      setIsDirty(checkIsDirty(newData));
      return newData;
    });
  };

  const handleTagToggle = (tagId) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        selectedTags: prev.selectedTags.includes(tagId)
          ? prev.selectedTags.filter(id => id !== tagId)
          : [...prev.selectedTags, tagId]
      };
      setIsDirty(checkIsDirty(newData));
      return newData;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.google_file_id.trim()) {
      newErrors.google_file_id = 'Google Drive File ID is required';
    } else {
      // Validate Google Drive File ID format (typically 33+ alphanumeric characters with - and _)
      const fileId = formData.google_file_id.trim();
      // Check if user accidentally pasted full URL instead of just the ID
      if (fileId.includes('drive.google.com') || fileId.includes('docs.google.com')) {
        newErrors.google_file_id = 'Please enter only the File ID, not the full URL. Extract the ID from the URL.';
      } else if (fileId.length < 10) {
        newErrors.google_file_id = 'Invalid File ID. Google Drive File IDs are typically longer than 10 characters.';
      } else if (!/^[a-zA-Z0-9_-]+$/.test(fileId)) {
        newErrors.google_file_id = 'Invalid File ID format. File IDs should only contain letters, numbers, hyphens, and underscores.';
      }
    }
    if (formData.author_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.author_email)) {
      newErrors.author_email = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const url = work
        ? `/api/admin/works/${work.id}`
        : '/api/admin/works';
      const method = work ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          tags: formData.selectedTags
        })
      });

      const data = await response.json();
      if (data.success) {
        success(work ? 'Work updated successfully' : 'Work created successfully');
        onSave();
      } else {
        error(data.error?.message || 'Failed to save work');
      }
    } catch (err) {
      error('Failed to save work');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {work ? 'Edit Work' : 'Add Work'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${errors.title ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              placeholder="Enter work title"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
              placeholder="Enter work description"
            />
          </div>

          {/* Author Name & Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Author Name</label>
              <input
                type="text"
                name="author_name"
                value={formData.author_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Author name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Author Email</label>
              <input
                type="email"
                name="author_email"
                value={formData.author_email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${errors.author_email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="author@example.com"
              />
              {errors.author_email && (
                <p className="text-red-500 text-sm mt-1">{errors.author_email}</p>
              )}
            </div>
          </div>

          {/* Category & Work Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Work Type</label>
              <select
                name="work_type_id"
                value={formData.work_type_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Select type</option>
                {workTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-sm font-medium mb-1">Academic Year</label>
            <input
              type="text"
              name="academic_year"
              value={formData.academic_year}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="2024"
            />
          </div>

          {/* Google File ID */}
          <div>
            <label className="block text-sm font-medium mb-1">Google Drive File ID *</label>
            <input
              type="text"
              name="google_file_id"
              value={formData.google_file_id}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${errors.google_file_id ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              placeholder="Google Drive file ID"
            />
            {errors.google_file_id ? (
              <p className="text-red-500 text-sm mt-1">{errors.google_file_id}</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                The file ID from Google Drive URL (e.g., from https://drive.google.com/file/d/FILE_ID/view)
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.id)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    formData.selectedTags.includes(tag.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-accent border-border'
                  }`}
                  style={formData.selectedTags.includes(tag.id) ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
                >
                  {tag.name}
                </button>
              ))}
              {tags.length === 0 && (
                <p className="text-sm text-muted-foreground">No tags available</p>
              )}
            </div>
          </div>

          {/* Is Public */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_public"
              id="is_public"
              checked={formData.is_public}
              onChange={handleChange}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label htmlFor="is_public" className="text-sm font-medium">
              Make this work publicly visible
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={handleReset}
              disabled={!isDirty}
              className="px-4 py-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border rounded-lg hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminWorks() {
  const { success, error } = useToast();
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWork, setEditingWork] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // Work to delete
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchWorks();
  }, []);

  const fetchWorks = async () => {
    try {
      const response = await fetch('/api/works?all=true', { credentials: 'include' });
      const data = await response.json();
      if (data.success) setWorks(data.data);
    } catch (err) {
      error('Failed to fetch works');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (work) => {
    setDeleteConfirm(work);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm || deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/works/${deleteConfirm.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        success('Work deleted successfully');
        fetchWorks();
      }
    } catch (err) {
      error('Failed to delete work');
    } finally {
      setDeleteConfirm(null);
      setDeleting(false);
    }
  };

  const handleFeature = async (id) => {
    try {
      const response = await fetch(`/api/admin/works/${id}/feature`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        success('Work featured status updated');
        fetchWorks();
      }
    } catch (err) {
      error('Failed to update featured status');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/admin/export/csv', { credentials: 'include' });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'works-export.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        success('Export downloaded!');
      } else {
        error('Failed to export works');
      }
    } catch (err) {
      error('Failed to export works');
    }
  };

  const filteredWorks = works.filter(work =>
    work.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    work.author_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Works</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Add Work
          </button>
          <button className="px-4 py-2 border rounded-lg hover:bg-accent">
            Import from Drive
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 border rounded-lg hover:bg-accent"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="search"
          placeholder="Search works..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-4 py-2 border rounded-lg"
        />
      </div>

      {/* Works Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium">Author</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">Views</th>
              <th className="text-left px-4 py-3 font-medium">Featured</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorks.length > 0 ? (
              filteredWorks.map(work => (
                <tr key={work.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium line-clamp-1">{work.title}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{work.author_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{work.category_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{work.view_count}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleFeature(work.id)}
                      className={`px-2 py-1 rounded text-xs ${work.is_featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {work.is_featured ? 'Featured' : 'Not Featured'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingWork(work)}
                        className="px-2 py-1 text-sm border rounded hover:bg-accent"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(work)}
                        className="px-2 py-1 text-sm border border-red-200 text-red-600 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No works found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Form Modal */}
      {(showForm || editingWork) && (
        <WorkFormModal
          work={editingWork}
          onClose={() => { setShowForm(false); setEditingWork(null); }}
          onSave={() => { setShowForm(false); setEditingWork(null); fetchWorks(); }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-2">Delete Work</h2>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete "<span className="font-medium text-foreground">{deleteConfirm.title}</span>"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 border rounded-lg hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
