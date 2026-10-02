import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Star,
  Upload,
  Eye,
  EyeOff,
  RotateCcw,
  Search,
  Sparkles,
  Building,
  User,
  Quote,
  Loader2,
  X,
  Check,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';
import GlassCard from '../ui/GlassCard';
import LoadingSpinner from '../ui/LoadingSpinner';

const COMPANY_PRESETS = [
  { name: 'Google', color: '#4285F4' },
  { name: 'Amazon', color: '#FF9900' },
  { name: 'Meta', color: '#0668E1' },
  { name: 'Microsoft', color: '#00A4EF' },
  { name: 'Apple', color: '#A2AAAD' },
  { name: 'Netflix', color: '#E50914' },
  { name: 'Uber', color: '#10b981' },
  { name: 'Adobe', color: '#FF0000' },
  { name: 'Flipkart', color: '#2874F0' },
  { name: 'Atlassian', color: '#0052CC' },
  { name: 'Bloomberg', color: '#2800D7' },
  { name: 'Salesforce', color: '#00A1E0' },
];

const AdminTestimonialsTab = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'hidden'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    company: 'Google',
    companyColor: '#4285F4',
    avatarUrl: '',
    avatarInitials: '',
    quote: '',
    rating: 5,
    isVerified: true,
    verifiedLabel: 'Verified Industry Engineer',
    userTag: 'TrackAsap User',
    spotlightColor: 'rgba(66, 133, 244, 0.18)',
    order: 0,
    isActive: true,
  });

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAdminTestimonials();
      setTestimonials(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load testimonials:', err);
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      role: '',
      company: 'Google',
      companyColor: '#4285F4',
      avatarUrl: '',
      avatarInitials: '',
      quote: '',
      rating: 5,
      isVerified: true,
      verifiedLabel: 'Verified Industry Engineer',
      userTag: 'TrackAsap User',
      spotlightColor: 'rgba(66, 133, 244, 0.18)',
      order: testimonials.length,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      role: item.role || '',
      company: item.company || '',
      companyColor: item.companyColor || '#4285F4',
      avatarUrl: item.avatarUrl || '',
      avatarInitials: item.avatarInitials || '',
      quote: item.quote || '',
      rating: item.rating || 5,
      isVerified: item.isVerified !== false,
      verifiedLabel: item.verifiedLabel || 'Verified Industry Engineer',
      userTag: item.userTag || 'TrackAsap User',
      spotlightColor: item.spotlightColor || 'rgba(66, 133, 244, 0.18)',
      order: item.order ?? 0,
      isActive: item.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleCompanySelect = (preset) => {
    setFormData((prev) => ({
      ...prev,
      company: preset.name,
      companyColor: preset.color,
      spotlightColor: `${preset.color}2e`,
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB');
      return;
    }

    try {
      setIsUploading(true);
      const data = new FormData();
      data.append('image', file);
      const res = await adminService.uploadTestimonialAvatar(data);
      if (res?.url) {
        setFormData((prev) => ({ ...prev, avatarUrl: res.url }));
        toast.success('Avatar uploaded successfully!');
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      toast.error(err.response?.data?.message || 'Failed to upload avatar image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.role.trim() || !formData.company.trim() || !formData.quote.trim()) {
      toast.error('Please fill in Name, Role, Company, and Quote');
      return;
    }

    try {
      setIsSaving(true);
      if (editingItem) {
        await adminService.updateTestimonial(editingItem._id, formData);
        toast.success('Testimonial updated successfully!');
      } else {
        await adminService.createTestimonial(formData);
        toast.success('Testimonial created successfully!');
      }
      setIsModalOpen(false);
      fetchTestimonials();
    } catch (err) {
      console.error('Failed to save testimonial:', err);
      toast.error(err.response?.data?.message || 'Failed to save testimonial');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      await adminService.toggleTestimonial(item._id);
      setTestimonials((prev) =>
        prev.map((t) => (t._id === item._id ? { ...t, isActive: !t.isActive } : t))
      );
      toast.success(item.isActive ? 'Testimonial hidden' : 'Testimonial published to Landing Page');
    } catch (err) {
      console.error('Failed to toggle testimonial:', err);
      toast.error('Failed to toggle status');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await adminService.deleteTestimonial(itemToDelete._id);
      setTestimonials((prev) => prev.filter((t) => t._id !== itemToDelete._id));
      toast.success('Testimonial deleted');
      setItemToDelete(null);
    } catch (err) {
      console.error('Failed to delete testimonial:', err);
      toast.error('Failed to delete testimonial');
    }
  };

  const handleRestoreDefaults = async () => {
    if (!window.confirm('Reset all testimonials to the 6 authentic default tech company testimonials? This will replace any custom testimonials.')) {
      return;
    }

    try {
      setLoading(true);
      const res = await adminService.seedTestimonials();
      toast.success(res.message || 'Default testimonials restored!');
      fetchTestimonials();
    } catch (err) {
      console.error('Failed to restore defaults:', err);
      toast.error('Failed to restore defaults');
    } finally {
      setLoading(false);
    }
  };

  const filteredTestimonials = testimonials.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.company?.toLowerCase().includes(search.toLowerCase()) ||
      item.role?.toLowerCase().includes(search.toLowerCase()) ||
      item.quote?.toLowerCase().includes(search.toLowerCase());

    if (statusFilter === 'active') return matchesSearch && item.isActive;
    if (statusFilter === 'hidden') return matchesSearch && !item.isActive;
    return matchesSearch;
  });

  const activeCount = testimonials.filter((t) => t.isActive).length;
  const hiddenCount = testimonials.filter((t) => !t.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-dark-900/90 via-dark-900/60 to-dark-800/80 border border-white/10 backdrop-blur-xl shadow-xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-md">
              <Heart className="w-5 h-5 fill-rose-500/30 text-rose-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Wall of Love & Reviews Manager
              </h2>
              <p className="text-xs text-gray-400">
                Manage landing page engineer testimonials, avatar photos, company badges, quotes, ratings, and display order.
              </p>
            </div>
          </div>

          {/* Quick Counters */}
          <div className="flex items-center gap-3 mt-3 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300">
              Total: <strong className="text-white">{testimonials.length}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Active on Landing Page: <strong className="text-emerald-300">{activeCount}</strong>
            </span>
            {hiddenCount > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                Hidden / Drafts: <strong className="text-amber-300">{hiddenCount}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleRestoreDefaults}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all shadow-sm"
            title="Restore initial 6 authentic tech company testimonials"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
            <span>Restore Defaults</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-neon-green text-dark-950 hover:bg-neon-green/90 active:scale-95 transition-all shadow-lg shadow-neon-green/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Testimonial</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-dark-900/60 border border-white/10">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, company, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          <span className="text-xs text-gray-400 mr-1 hidden md:inline">Status:</span>
          {['all', 'active', 'hidden'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === status
                  ? 'bg-neon-green/15 text-neon-green border border-neon-green/30'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="p-12 text-center">
          <LoadingSpinner />
        </div>
      ) : filteredTestimonials.length === 0 ? (
        <GlassCard className="p-12 text-center max-w-md mx-auto">
          <Heart className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Testimonials Found</h3>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            {search ? 'Try adjusting your search criteria.' : 'Add your first engineer review or restore defaults.'}
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-neon-green text-dark-950 hover:bg-neon-green/90 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Testimonial</span>
          </button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTestimonials.map((item) => {
            const cardColor = item.companyColor || '#4285F4';
            const initials =
              item.avatarInitials ||
              (item.name ? item.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'AS');

            return (
              <div
                key={item._id}
                className={`relative rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden p-5 ${
                  item.isActive
                    ? 'bg-dark-900/80 border-white/10 hover:border-white/25 shadow-lg'
                    : 'bg-dark-950/60 border-dashed border-white/10 opacity-75'
                }`}
              >
                {/* Top Action Bar */}
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(item)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                        item.isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                      }`}
                      title={item.isActive ? 'Click to hide from Landing Page' : 'Click to publish on Landing Page'}
                    >
                      {item.isActive ? (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>Active on Landing Page</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Hidden / Draft</span>
                        </>
                      )}
                    </button>
                    <span className="text-[10px] font-mono text-gray-500">#{item.order ?? 0}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                      title="Edit testimonial"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setItemToDelete(item)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                      title="Delete testimonial"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Main Header: Avatar, Name, Company */}
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.avatarUrl ? (
                        <img
                          src={item.avatarUrl}
                          alt={item.name}
                          className="w-11 h-11 rounded-full object-cover border border-white/20 shadow-md shrink-0"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const next = e.target.nextSibling;
                            if (next) next.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-md shrink-0 border border-white/20 ${
                          item.avatarUrl ? 'hidden' : 'flex'
                        }`}
                        style={{ backgroundColor: cardColor }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{item.name}</h3>
                        <p className="text-xs text-gray-400 truncate">{item.role}</p>
                      </div>
                    </div>

                    {/* Company Badge */}
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-sm shrink-0 ml-2"
                      style={{ backgroundColor: cardColor }}
                    >
                      <span>{item.company}</span>
                    </div>
                  </div>

                  {/* Verified Badge */}
                  {item.isVerified !== false && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-[10px] font-semibold text-cyan-400 mb-3">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{item.verifiedLabel || 'Verified Industry Engineer'}</span>
                    </div>
                  )}

                  {/* Quote Message */}
                  <p className="text-xs text-gray-300 leading-relaxed italic line-clamp-4">
                    “{item.quote}”
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-500 font-mono">
                  <span>{item.userTag || 'TrackAsap User'}</span>
                  <div className="flex items-center gap-0.5 text-yellow-400">
                    {Array.from({ length: item.rating || 5 }).map((_, sIdx) => (
                      <Star key={sIdx} size={11} fill="currentColor" />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Testimonial Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-dark-900/95 p-6 shadow-2xl my-8"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center text-neon-green">
                    <Heart className="w-4 h-4 fill-neon-green/30 text-neon-green" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {editingItem ? 'Edit Testimonial' : 'Add New Testimonial'}
                    </h3>
                    <p className="text-xs text-gray-400">
                      Customise card photo, quote message, company badge, and ratings.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Role / Designation <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Software Engineer II"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50"
                    />
                  </div>
                </div>

                {/* Company & Brand Color */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Company Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Google, Amazon, Microsoft"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50 mb-2"
                    />

                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {COMPANY_PRESETS.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => handleCompanySelect(p)}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                            formData.company.toLowerCase() === p.name.toLowerCase()
                              ? 'bg-white/20 border-white/40 text-white font-bold'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Company Brand Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.companyColor}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            companyColor: e.target.value,
                            spotlightColor: `${e.target.value}2e`,
                          })
                        }
                        className="w-9 h-9 rounded-lg bg-transparent border border-white/20 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={formData.companyColor}
                        onChange={(e) => setFormData({ ...formData, companyColor: e.target.value })}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-neon-green/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Avatar / Photo Management */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Engineer Avatar / Photo</span>
                    </label>
                    <span className="text-[10px] text-gray-400">Upload image, link URL, or use initials</span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Live Avatar Preview */}
                    <div className="relative shrink-0">
                      {formData.avatarUrl ? (
                        <img
                          src={formData.avatarUrl}
                          alt="Avatar Preview"
                          className="w-14 h-14 rounded-full object-cover border-2 border-neon-green/40 shadow-lg"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-lg border-2 border-white/20"
                          style={{ backgroundColor: formData.companyColor || '#4285F4' }}
                        >
                          {formData.avatarInitials ||
                            (formData.name
                              ? formData.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                              : 'TA')}
                        </div>
                      )}

                      {formData.avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, avatarUrl: '' })}
                          className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all shadow"
                          title="Remove image and use initials"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-all disabled:opacity-50"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3" />
                              <span>Upload Photo</span>
                            </>
                          )}
                        </button>

                        <span className="text-[10px] text-gray-500">or enter URL below</span>
                      </div>

                      <input
                        type="url"
                        placeholder="Direct image URL (https://...)"
                        value={formData.avatarUrl}
                        onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Quote / Testimonial Message */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Testimonial Message / Quote <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Write what the engineer loved about TrackAsap..."
                    value={formData.quote}
                    onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50 leading-relaxed"
                  />
                </div>

                {/* Star Rating & Verified Switch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Rating */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Rating (Stars)
                    </label>
                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className="p-0.5 hover:scale-110 transition-transform"
                        >
                          <Star
                            size={18}
                            className={star <= formData.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-xs font-bold text-yellow-400">
                        {formData.rating} / 5 Stars
                      </span>
                    </div>
                  </div>

                  {/* Display Order */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Display Order (0 = First)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-green/50 font-mono"
                    />
                  </div>
                </div>

                {/* Badges & Visibility Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Verified Badge */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <div className="text-xs font-bold text-white">Verified Engineer Badge</div>
                      <div className="text-[10px] text-gray-400">Displays cyan verification pill</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isVerified: !formData.isVerified })}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        formData.isVerified ? 'bg-cyan-500' : 'bg-white/10'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          formData.isVerified ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Active Visibility Switch */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <div className="text-xs font-bold text-white">Published on Landing Page</div>
                      <div className="text-[10px] text-gray-400">Show in Wall of Love grid</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        formData.isActive ? 'bg-neon-green' : 'bg-white/10'
                      }`}
                    >
                      <div
                        className={`bg-dark-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          formData.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-neon-green text-dark-950 hover:bg-neon-green/90 transition-all disabled:opacity-50 shadow-lg shadow-neon-green/20"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingItem ? 'Update Testimonial' : 'Create Testimonial'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-2xl border border-red-500/30 bg-dark-900/95 p-6 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-center text-lg font-bold text-white">Delete Testimonial</h3>
              <p className="text-center text-xs text-gray-400 mt-1 mb-6">
                Are you sure you want to delete the review by <strong className="text-white">{itemToDelete.name}</strong> ({itemToDelete.company})? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-500/20"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminTestimonialsTab;
