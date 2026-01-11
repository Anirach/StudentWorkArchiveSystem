import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';

export default function AdminCategories() {
  const { success, error } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', { credentials: 'include' });
      const data = await response.json();
      if (data.success) setCategories(data.data);
    } catch (err) {
      error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName })
      });
      if (response.ok) {
        success('Category created');
        setNewName('');
        fetchCategories();
      }
    } catch (err) {
      error('Failed to create category');
    }
  };

  const handleUpdate = async (id, name) => {
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name })
      });
      if (response.ok) {
        success('Category updated');
        setEditingId(null);
        fetchCategories();
      }
    } catch (err) {
      error('Failed to update category');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        success('Category deleted');
        fetchCategories();
      }
    } catch (err) {
      error('Failed to delete category');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Categories</h1>

      {/* Add Category */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 max-w-md px-4 py-2 border rounded-lg"
          onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
        />
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Add Category
        </button>
      </div>

      {/* Categories List */}
      <div className="border rounded-lg divide-y">
        {categories.length > 0 ? (
          categories.map(category => (
            <div key={category.id} className="flex items-center justify-between p-4">
              {editingId === category.id ? (
                <input
                  type="text"
                  defaultValue={category.name}
                  className="flex-1 px-3 py-1 border rounded mr-4"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdate(category.id, e.target.value);
                    }
                  }}
                  onBlur={(e) => handleUpdate(category.id, e.target.value)}
                />
              ) : (
                <div>
                  <p className="font-medium">{category.name}</p>
                  {category.description && (
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingId(editingId === category.id ? null : category.id)}
                  className="px-2 py-1 text-sm border rounded hover:bg-accent"
                >
                  {editingId === category.id ? 'Cancel' : 'Edit'}
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="px-2 py-1 text-sm border border-red-200 text-red-600 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No categories yet. Add one above!
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Tip: You can drag and drop categories to reorder them (feature coming soon).
      </p>
    </div>
  );
}
