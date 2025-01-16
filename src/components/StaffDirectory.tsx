import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ArrowUpDown, Search, RotateCcw, Mail, Phone, MapPin, Clock, User, X } from 'lucide-react';
import { StaffMember, SortField, SortDirection } from '../types';
import { fetchStaffData, initializeGoogleSheetsAPI } from '../utils/googleSheets';

const transitionConfig = {
  type: "spring",
  duration: 0.5,
  bounce: 0.1
};

const renderProfileImage = (member: StaffMember, isExpanded: boolean) => {
  const size = isExpanded ? 'h-32 w-32' : 'h-20 w-20';
  
  if (!member.photoUrl) {
    return (
      <motion.div 
        layout="position"
        className={`${size} rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0`}
      >
        <User className="text-blue-600" size={isExpanded ? 40 : 28} />
      </motion.div>
    );
  }

  return (
    <motion.div
      layout="position"
      className={`${size} rounded-lg overflow-hidden flex-shrink-0 bg-gray-100`}
    >
      <motion.img
        layout="position"
        src={member.photoUrl}
        alt={`${member.name}'s profile`}
        className="w-full h-full object-cover"
        style={{ 
          willChange: 'transform',
          backfaceVisibility: 'hidden'
        }}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = '';
          member.photoUrl = '';
        }}
      />
    </motion.div>
  );
};

export default function StaffDirectory() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  
  const mainContentRef = useRef<HTMLDivElement>(null);

  const loadStaffData = useCallback(async () => {
    try {
      await initializeGoogleSheetsAPI();
      const data = await fetchStaffData();
      setStaff(data);
      setFilteredStaff(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load staff directory');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaffData();
    const interval = setInterval(loadStaffData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadStaffData]);

  const handleSort = (field: SortField) => {
    setSortDirection(prev => 
      sortField === field ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'
    );
    setSortField(field);
    setExpandedId(null);
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setExpandedId(null);
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setSearchTerm('');
    setSortField('name');
    setSortDirection('asc');
    setDepartmentFilter('');
    setExpandedId(null);
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    let result = [...staff];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(member =>
        Object.values(member).some(value =>
          String(value).toLowerCase().includes(searchLower)
        )
      );
    }

    if (departmentFilter) {
      result = result.filter(member => 
        member.department === departmentFilter
      );
    }

    result.sort((a, b) => {
      const aValue = a[sortField].toLowerCase();
      const bValue = b[sortField].toLowerCase();
      const modifier = sortDirection === 'asc' ? 1 : -1;
      return aValue.localeCompare(bValue) * modifier;
    });

    setFilteredStaff(result);
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [staff, searchTerm, sortField, sortDirection, departmentFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center p-4">
        {error}
      </div>
    );
  }

  const departments = Array.from(new Set(staff.map(member => member.department))).filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-diagonal">
      {/* Left Sidebar */}
      <div className="fixed top-0 left-0 w-[480px] h-full bg-white/90 backdrop-blur-sm p-6 border-r border-white/10 overflow-y-auto z-10">
        <div className="space-y-6">
          {/* Search */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Search</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              <input
                type="text"
                placeholder="Search staff directory..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-3 w-full rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Sort Buttons */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Sort by</h2>
            <div className="grid grid-cols-1 gap-2">
              {(['name', 'department'] as SortField[]).map((field) => (
                <button
                  key={field}
                  onClick={() => handleSort(field)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-colors ${
                    sortField === field
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="capitalize">{field}</span>
                  <ArrowUpDown
                    size={20}
                    className={`transform transition-transform ${
                      sortField === field && sortDirection === 'desc' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Department Filter */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Department</h2>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setDepartmentFilter('')}
                className={`px-4 py-3 rounded-lg border text-left transition-colors ${
                  departmentFilter === ''
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                All Departments
              </button>
              {departments.map(dept => (
                <button
                  key={dept}
                  onClick={() => setDepartmentFilter(dept)}
                  className={`px-4 py-3 rounded-lg border text-left transition-colors ${
                    departmentFilter === dept
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 font-medium"
          >
            <RotateCcw size={20} />
            Reset Filters
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div ref={mainContentRef} className="ml-[480px] p-8 h-screen overflow-y-auto">
        <LayoutGroup>
          <motion.div 
            layout
            transition={transitionConfig}
            className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 auto-rows-max"
          >
            <AnimatePresence mode="popLayout">
              {filteredStaff.map((member) => (
                <motion.div
                  layout
                  layoutId={`card-${member.id}`}
                  key={member.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={transitionConfig}
                  onClick={() => setSelectedMember(member)}
                  className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden cursor-pointer"
                >
                  <motion.div 
                    className="flex gap-6 p-6"
                    layoutId={`content-${member.id}`}
                  >
                    <motion.div layoutId={`image-container-${member.id}`}>
                      {renderProfileImage(member, false)}
                    </motion.div>
                    <div className="flex-1">
                      <motion.h3 
                        layoutId={`name-${member.id}`}
                        className="text-xl font-semibold text-gray-900"
                      >
                        {member.name}
                      </motion.h3>
                      <motion.p 
                        layoutId={`position-${member.id}`}
                        className="text-gray-600"
                      >
                        {member.position}
                      </motion.p>
                      <motion.p 
                        layoutId={`department-${member.id}`}
                        className="text-gray-500"
                      >
                        {member.department}
                      </motion.p>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedMember && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMember(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <motion.div
                layoutId={`card-${selectedMember.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transitionConfig}
                className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden"
                style={{
                  maxHeight: 'calc(100vh - 4rem)'
                }}
              >
                <motion.div 
                  className="flex gap-6 p-6"
                  layoutId={`content-${selectedMember.id}`}
                >
                  <motion.div layoutId={`image-container-${selectedMember.id}`}>
                    {renderProfileImage(selectedMember, true)}
                  </motion.div>
                  <div className="flex-1">
                    <motion.h3 
                      layoutId={`name-${selectedMember.id}`}
                      className="text-2xl font-semibold text-gray-900"
                    >
                      {selectedMember.name}
                    </motion.h3>
                    <motion.p 
                      layoutId={`position-${selectedMember.id}`}
                      className="text-gray-600"
                    >
                      {selectedMember.position}
                    </motion.p>
                    <motion.p 
                      layoutId={`department-${selectedMember.id}`}
                      className="text-gray-500"
                    >
                      {selectedMember.department}
                    </motion.p>
                  </div>
                </motion.div>

                <div className="p-6 bg-gray-50/80 border-t border-gray-100">
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    {selectedMember.bio}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={18} />
                      <span>{selectedMember.officeHours}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail size={18} />
                      <a href={`mailto:${selectedMember.email}`} className="hover:text-blue-500">
                        {selectedMember.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={18} />
                      <a href={`tel:${selectedMember.phone}`} className="hover:text-blue-500">
                        {selectedMember.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={18} />
                      <span>{selectedMember.location}</span>
                    </div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-center"
                  >
                    <button
                      onClick={() => setSelectedMember(null)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 font-medium group"
                    >
                      <X size={20} className="transition-transform group-hover:rotate-90" />
                      Close
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}