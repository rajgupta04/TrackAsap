import { useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Calendar,
  Save,
  Code2,
  Target,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import GlassCard from '../components/ui/GlassCard';
import NumberInput from '../components/ui/NumberInput';

const Profile = () => {
  const { user, updateUser, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    codeforcesHandle: user?.codeforcesHandle || '',
    codechefHandle: user?.codechefHandle || '',
    leetcodeHandle: user?.leetcodeHandle || '',
    targetWeight: user?.targetWeight || '',
    startDate: user?.startDate
      ? format(new Date(user.startDate), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await updateUser({
      ...formData,
      targetWeight: formData.targetWeight ? Number(formData.targetWeight) : null,
    });

    if (result.success) {
      toast.success('Profile updated successfully!');
    } else {
      toast.error(result.error || 'Failed to update profile');
    }
  };

  // Calculate days since start
  const startDate = new Date(user?.startDate || new Date());
  const today = new Date();
  const currentDay = Math.min(
    75,
    Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-6 px-4 py-4 md:px-6 md:py-6">
      {/* Profile Header */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-2 md:p-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-neon-green/20 to-cyan-500/20 flex items-center justify-center border border-dark-600/50 flex-shrink-0">
            <span className="text-3xl sm:text-4xl font-bold text-neon-green">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white">{user?.name || 'User'}</h2>
            <p className="text-dark-400 text-sm sm:text-base break-all">{user?.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 mt-3">
              <div className="flex items-center gap-2 bg-neon-green/10 px-3 py-1.5 rounded-full">
                <span className="text-xs sm:text-sm text-neon-green font-semibold">Day {currentDay}</span>
                <span className="text-xs text-dark-400">of 75</span>
              </div>
              <div className="flex items-center gap-2 bg-cyan-500/10 px-3 py-1.5 rounded-full">
                <span className="text-xs sm:text-sm text-cyan-400 font-semibold">{75 - currentDay}</span>
                <span className="text-xs text-dark-400">days left</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Profile Form */}
      <form onSubmit={handleSubmit}>
        <GlassCard>
          <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6">Personal Information</h3>

          <div className="space-y-4 md:space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="input-field pl-12"
                  placeholder="Your Name"
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  className="input-field pl-12 opacity-50 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Challenge Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="input-field pl-12"
                />
              </div>
            </div>

            {/* Target Weight */}
            <NumberInput
              label="Target Weight (kg)"
              value={formData.targetWeight}
              onChange={(val) => handleChange('targetWeight', val)}
              min={20}
              max={300}
              step={0.1}
              placeholder="Your goal weight"
            />
          </div>
        </GlassCard>

        {/* Platform Handles */}
        <GlassCard className="mt-4 md:mt-6">
          <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6">Platform Handles</h3>
          <p className="text-dark-400 text-xs md:text-sm mb-4">
            Add your competitive programming handles (optional)
          </p>

          <div className="space-y-4 md:space-y-5">
            {/* LeetCode */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                LeetCode Username
              </label>
              <div className="relative">
                <Code2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FFA116]" />
                <input
                  type="text"
                  value={formData.leetcodeHandle}
                  onChange={(e) => handleChange('leetcodeHandle', e.target.value)}
                  className="input-field pl-12"
                  placeholder="leetcode_username"
                />
              </div>
            </div>

            {/* CodeChef */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                CodeChef Username
              </label>
              <div className="relative">
                <Code2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5B4638]" />
                <input
                  type="text"
                  value={formData.codechefHandle}
                  onChange={(e) => handleChange('codechefHandle', e.target.value)}
                  className="input-field pl-12"
                  placeholder="codechef_username"
                />
              </div>
            </div>

            {/* Codeforces */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Codeforces Handle
              </label>
              <div className="relative">
                <Code2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1F8ACB]" />
                <input
                  type="text"
                  value={formData.codeforcesHandle}
                  onChange={(e) => handleChange('codeforcesHandle', e.target.value)}
                  className="input-field pl-12"
                  placeholder="codeforces_handle"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary w-full mt-4 md:mt-6 flex items-center justify-center gap-2 py-3 md:py-4"
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              <Save size={20} />
              Save Changes
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
};

export default Profile;
