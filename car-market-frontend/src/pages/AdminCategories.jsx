import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { categoriesAPI } from '../services/api';

const emptyForm = {
  name: '',
  image: '',
  description: '',
  file: null,
};

const AdminCategories = ({ showToast }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language?.startsWith('ar');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingCategory, setEditingCategory] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoriesAPI.getAll();
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      showToast?.('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categories;

    return categories.filter(category =>
      category.name?.toLowerCase().includes(term) ||
      category.slug?.toLowerCase().includes(term)
    );
  }, [categories, search]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name || '',
      image: category.image || category.cover_image || '',
      description: category.description || '',
      file: null,
    });
    setModalOpen(true);
  };

  const buildPayload = () => {
    if (form.file) {
      const data = new FormData();
      data.append('name', form.name);
      data.append('description', form.description || '');
      data.append('image', form.file);
      return data;
    }

    return {
      name: form.name,
      description: form.description,
      image: form.image,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      showToast?.('Category name is required', 'error');
      return;
    }

    try {
      setSaving(true);
      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, buildPayload());
        showToast?.('Category updated successfully');
      } else {
        await categoriesAPI.create(buildPayload());
        showToast?.('Category created successfully');
      }

      setModalOpen(false);
      setForm(emptyForm);
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
      const message = error.response?.data?.message || 'Failed to save category';
      showToast?.(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete "${category.name}"? Cars in this category will be uncategorized.`)) {
      return;
    }

    try {
      await categoriesAPI.delete(category.id);
      showToast?.('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      const message = error.response?.data?.message || 'Failed to delete category';
      showToast?.(message, 'error');
    }
  };

  const totalCars = categories.reduce((sum, category) => sum + Number(category.cars_count || 0), 0);

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {t('admin.cat_title') || 'Vehicle Categories'}
          </h1>
          <p className="text-slate-500 mt-2">
            {t('admin.cat_subtitle') || 'Manage showcase categories and inventory folders.'}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-700"
        >
          {t('admin.cat_create') || 'Create Category'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/5 bg-[#111827] p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Categories</p>
          <p className="mt-3 text-3xl font-black text-white">{categories.length}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#111827] p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Attached Cars</p>
          <p className="mt-3 text-3xl font-black text-white">{totalCars}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#111827] p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Visible Rows</p>
          <p className="mt-3 text-3xl font-black text-white">{filteredCategories.length}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/5 bg-[#111827] shadow-xl">
        <div className="border-b border-white/5 p-6">
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search categories..."
            className="w-full rounded-2xl border border-white/5 bg-[#0B0F19] px-5 py-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-red-500/40"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Category</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Slug</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Cars</th>
                <th className="px-8 py-5 text-right text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(5).fill(0).map((_, index) => (
                  <tr key={index}>
                    <td colSpan="4" className="px-8 py-5">
                      <div className="h-14 animate-pulse rounded-xl bg-white/5" />
                    </td>
                  </tr>
                ))
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center font-semibold text-slate-500">
                    No categories found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map(category => (
                  <tr key={category.id} className="group transition hover:bg-white/[0.02]">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-20 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                          {category.image_url ? (
                            <img
                              src={category.image_url}
                              alt={category.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-lg font-black text-slate-600">
                              {category.name?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-red-500">{category.name}</p>
                          <p className="mt-1 max-w-sm truncate text-xs text-slate-600">{category.description || 'No description'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 font-mono text-xs font-bold text-slate-500">{category.slug}</td>
                    <td className="px-8 py-5">
                      <span className="rounded-lg bg-red-600/10 px-3 py-1 text-xs font-bold text-red-500">
                        {Number(category.cars_count || 0).toLocaleString()} cars
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(category)}
                          className="rounded-xl bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="rounded-xl bg-red-600/10 px-4 py-2 text-xs font-bold text-red-500 transition hover:bg-red-600 hover:text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#111827] p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">Changes are saved to the database and reflected immediately.</p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl bg-white/5 px-3 py-2 text-sm font-bold text-slate-400 hover:text-white">
                Close
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                  {t('admin.cat_name') || 'Category Name'}
                </span>
                <input
                  value={form.name}
                  onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-xl border border-white/5 bg-[#0B0F19] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-red-500/40"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                  {t('admin.cat_cover') || 'Category Cover Image'}
                </span>
                <input
                  value={form.image}
                  onChange={event => setForm(prev => ({ ...prev, image: event.target.value, file: null }))}
                  placeholder="/category/suv.jpg or https://..."
                  className="w-full rounded-xl border border-white/5 bg-[#0B0F19] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-red-500/40"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={event => setForm(prev => ({ ...prev, file: event.target.files?.[0] || null }))}
                  className="w-full rounded-xl border border-white/5 bg-[#0B0F19] px-4 py-3 text-sm font-semibold text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-red-600 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Description</span>
                <textarea
                  value={form.description}
                  onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/5 bg-[#0B0F19] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-red-500/40"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl bg-white/5 px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10">
                Cancel
              </button>
              <button disabled={saving} className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;


