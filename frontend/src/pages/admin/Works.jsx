import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';

// Work Form Modal Component
function WorkFormModal({ work, onClose, onSave }) {
  const { success, error } = useToast();
  const [categories, setCategories] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [tags, setTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTagToggle = (tagId) => {
    setFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter(id => id !== tagId)
        : [...prev.selectedTags, tagId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Enter work title"
            />
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
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="author@example.com"
              />
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
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Google Drive file ID"
            />
            <p className="text-xs text-muted-foreground mt-1">
              The file ID from Google Drive URL (e.g., from https://drive.google.com/file/d/FILE_ID/view)
            </p>
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
              onClick={onClose}
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
    if (!deleteConfirm) return;
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
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
