import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';

export default function AdminCategories() {
  const { success, error } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState('');
  const [newParentId, setNewParentId] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());

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

  // Build hierarchical structure
  const buildHierarchy = () => {
    const parentCategories = categories.filter(c => !c.parent_id);
    const childrenMap = {};

    categories.forEach(c => {
      if (c.parent_id) {
        if (!childrenMap[c.parent_id]) {
          childrenMap[c.parent_id] = [];
        }
        childrenMap[c.parent_id].push(c);
      }
    });

    return { parentCategories, childrenMap };
  };

  const toggleExpand = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newName,
          parent_id: newParentId ? parseInt(newParentId) : null
        })
      });
      if (response.ok) {
        success('Category created');
        setNewName('');
        setNewParentId('');
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
      const data = await response.json();
      if (response.ok) {
        success('Category deleted');
        fetchCategories();
      } else {
        error(data.error?.message || 'Failed to delete category');
      }
    } catch (err) {
      error('Failed to delete category');
    }
  };

  const { parentCategories, childrenMap } = buildHierarchy();

  const renderCategory = (category, isChild = false) => {
    const children = childrenMap[category.id] || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id}>
        <div className={`flex items-center justify-between p-4 ${isChild ? 'pl-12 bg-muted/30' : ''}`}>
          <div className="flex items-center gap-2">
            {!isChild && hasChildren && (
              <button
                onClick={() => toggleExpand(category.id)}
                className="p-1 hover:bg-accent rounded"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            {!isChild && !hasChildren && <div className="w-6" />}
            {isChild && (
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18" />
              </svg>
            )}
            {editingId === category.id ? (
              <input
                type="text"
                defaultValue={category.name}
                maxLength={100}
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
                {hasChildren && (
                  <p className="text-xs text-muted-foreground">
                    {children.length} subcategor{children.length === 1 ? 'y' : 'ies'}
                  </p>
                )}
              </div>
            )}
          </div>
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
        {/* Render children if expanded */}
        {isExpanded && children.map(child => renderCategory(child, true))}
      </div>
    );
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
      <div className="flex flex-wrap gap-2 mb-6">
        <input
          type="text"
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={100}
          className="flex-1 min-w-[200px] max-w-md px-4 py-2 border rounded-lg"
          onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
        />
        <select
          value={newParentId}
          onChange={(e) => setNewParentId(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-background"
        >
          <option value="">No Parent (Top Level)</option>
          {parentCategories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Add Category
        </button>
      </div>

      {/* Categories List */}
      <div className="border rounded-lg divide-y">
        {parentCategories.length > 0 ? (
          parentCategories.map(category => renderCategory(category))
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No categories yet. Add one above!
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Tip: Select a parent category to create a subcategory. Click the arrow to expand/collapse subcategories.
      </p>
    </div>
  );
}
