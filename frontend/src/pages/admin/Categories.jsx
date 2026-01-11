import { useState, useEffect, useRef } from 'react';
import { useToast } from '../../context/ToastContext';

export default function AdminCategories() {
  const { success, error } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState('');
  const [newParentId, setNewParentId] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [saving, setSaving] = useState(false);

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

  // Drag and drop handlers
  const handleDragStart = (e, category) => {
    setDraggedItem(category);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', category.id.toString());
    // Add a slight delay to show the drag preview
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragOver = (e, category) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedItem && draggedItem.id !== category.id) {
      // Only allow reordering within the same level (both parents or same parent_id)
      if (draggedItem.parent_id === category.parent_id) {
        setDragOverItem(category);
      }
    }
  };

  const handleDragLeave = (e) => {
    setDragOverItem(null);
  };

  const handleDrop = async (e, targetCategory) => {
    e.preventDefault();

    if (!draggedItem || draggedItem.id === targetCategory.id) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    // Only allow reordering within the same level
    if (draggedItem.parent_id !== targetCategory.parent_id) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    // Get categories at the same level
    const sameLevelCategories = categories.filter(c => c.parent_id === draggedItem.parent_id);

    // Find indices
    const draggedIndex = sameLevelCategories.findIndex(c => c.id === draggedItem.id);
    const targetIndex = sameLevelCategories.findIndex(c => c.id === targetCategory.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    // Reorder the array
    const reordered = [...sameLevelCategories];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Create the update payload with new sort_order values
    const updates = reordered.map((cat, index) => ({
      id: cat.id,
      sort_order: index
    }));

    // Optimistically update UI
    const newCategories = categories.map(cat => {
      const update = updates.find(u => u.id === cat.id);
      if (update) {
        return { ...cat, sort_order: update.sort_order };
      }
      return cat;
    });

    // Sort by sort_order
    newCategories.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    setCategories(newCategories);

    setDraggedItem(null);
    setDragOverItem(null);

    // Save to server
    setSaving(true);
    try {
      const response = await fetch('/api/admin/categories/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ categories: updates })
      });

      if (response.ok) {
        success('Categories reordered');
      } else {
        error('Failed to save order');
        fetchCategories(); // Revert on failure
      }
    } catch (err) {
      error('Failed to save order');
      fetchCategories(); // Revert on failure
    } finally {
      setSaving(false);
    }
  };

  const { parentCategories, childrenMap } = buildHierarchy();

  const renderCategory = (category, isChild = false) => {
    const children = childrenMap[category.id] || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isDragOver = dragOverItem && dragOverItem.id === category.id;
    const isDragging = draggedItem && draggedItem.id === category.id;

    return (
      <div key={category.id}>
        <div
          draggable={!editingId}
          onDragStart={(e) => handleDragStart(e, category)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, category)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, category)}
          className={`flex items-center justify-between p-4 transition-all cursor-grab active:cursor-grabbing
            ${isChild ? 'pl-12 bg-muted/30' : ''}
            ${isDragOver ? 'bg-primary/10 border-t-2 border-primary' : ''}
            ${isDragging ? 'opacity-50' : ''}
          `}
        >
          <div className="flex items-center gap-2">
            {/* Drag handle */}
            <div className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manage Categories</h1>
        {saving && (
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
            Saving...
          </span>
        )}
      </div>

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
        Tip: Drag categories to reorder them. Select a parent category to create a subcategory.
      </p>
    </div>
  );
}
