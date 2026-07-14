import React, { useState, useEffect, useRef } from 'react';

// Utility to format minutes from midnight into a readable time string
const formatTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m.toString().padStart(2, '0');
  return `${displayH}:${displayM} ${period}`;
};

// Application Constants
const START_MINS = 8 * 60; // 8:00 AM
const END_MINS = 18 * 60;  // 6:00 PM
const INTERVAL = 15;       // 15-minute intervals
const SLOT_HEIGHT = 64;    // 64px height per 15-min slot (matches Tailwind's h-16)

// Tailwind color palettes for categories
const SAMPLE_COLORS = [
  'bg-blue-100 border-blue-300 text-blue-900',
  'bg-emerald-100 border-emerald-300 text-emerald-900',
  'bg-violet-100 border-violet-300 text-violet-900',
  'bg-amber-100 border-amber-300 text-amber-900',
  'bg-rose-100 border-rose-300 text-rose-900',
  'bg-cyan-100 border-cyan-300 text-cyan-900',
];

// Helper to generate a random ID
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function App() {
  const [categories, setCategories] = useState([
    { id: 'cat_1', name: 'Microbiology', colorIdx: 0 },
    { id: 'cat_2', name: 'Chemistry', colorIdx: 1 },
    { id: 'cat_3', name: 'Urgent Processing', colorIdx: 4 },
  ]);

  const [resources, setResources] = useState([
    { id: 'res_1', name: 'Centrifuge A' },
    { id: 'res_2', name: 'Centrifuge B' },
    { id: 'res_3', name: 'Microscope 1' },
  ]);

  const [unassignedSamples, setUnassignedSamples] = useState([
    { id: generateId(), name: 'Water Quality Test 1', duration: 45, categoryId: 'cat_2' },
    { id: generateId(), name: 'Soil pH Analysis', duration: 30, categoryId: 'cat_2' },
    { id: generateId(), name: 'Bacterial Culture', duration: 60, categoryId: 'cat_1' },
    { id: generateId(), name: 'Toxin Screen', duration: 45, categoryId: 'cat_3' },
  ]);
  const [scheduledSamples, setScheduledSamples] = useState([]);
  
  // Interaction State
  const [draggedId, setDraggedId] = useState(null);
  const [hoveredSlot, setHoveredSlot] = useState(null); // { mins, resourceId }
  const [selectedId, setSelectedId] = useState(null); // For Click-to-Assign fallback
  
  // Resizing State
  const [resizing, setResizing] = useState(null); // { sampleId, startY, startDuration, maxDuration }

  // Form State
  const [newName, setNewName] = useState('');
  const [newDuration, setNewDuration] = useState(15);
  const [newCategoryId, setNewCategoryId] = useState('cat_1');
  const [errorToast, setErrorToast] = useState('');
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [isManagingEquipment, setIsManagingEquipment] = useState(false);

  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => setErrorToast(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  const timeSlots = [];
  for (let m = START_MINS; m < END_MINS; m += INTERVAL) {
    timeSlots.push(m);
  }

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!resizing) return;
      
      const deltaY = e.clientY - resizing.startY;
      const deltaIntervals = Math.round(deltaY / SLOT_HEIGHT);
      const deltaMins = deltaIntervals * INTERVAL;
      
      let proposedDuration = resizing.startDuration + deltaMins;
      
      proposedDuration = Math.max(INTERVAL, proposedDuration);
      proposedDuration = Math.min(proposedDuration, resizing.maxDuration);

      setScheduledSamples(prev => prev.map(s => 
        s.id === resizing.sampleId ? { ...s, duration: proposedDuration } : s
      ));
    };

    const handlePointerUp = () => {
      if (resizing) setResizing(null);
    };

    if (resizing) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [resizing]);

  const handleAddSample = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    const newSample = {
      id: generateId(),
      name: newName.trim(),
      duration: Number(newDuration),
      categoryId: newCategoryId || categories[0]?.id
    };
    
    setUnassignedSamples([...unassignedSamples, newSample]);
    setNewName('');
    setNewDuration(15);
  };

  const addCategory = () => {
    setCategories([...categories, { 
      id: `cat_${generateId()}`, 
      name: 'New Category', 
      colorIdx: categories.length % SAMPLE_COLORS.length 
    }]);
  };

  const updateCategoryName = (id, newName) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
  };

  const cycleCategoryColor = (id) => {
    setCategories(prev => prev.map(c => 
      c.id === id ? { ...c, colorIdx: (c.colorIdx + 1) % SAMPLE_COLORS.length } : c
    ));
  };

  const getCategoryColor = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? SAMPLE_COLORS[cat.colorIdx] : SAMPLE_COLORS[0];
  };

  const addResource = () => {
    setResources([...resources, { id: `res_${generateId()}`, name: 'New Equipment' }]);
  };

  const updateResourceName = (id, newName) => {
    setResources(prev => prev.map(r => r.id === id ? { ...r, name: newName } : r));
  };

  const deleteResource = (id) => {
    if (resources.length <= 1) {
      setErrorToast("You must have at least one equipment column.");
      return;
    }
    const samplesToUnassign = scheduledSamples.filter(s => s.resourceId === id);
    if (samplesToUnassign.length > 0) {
      setUnassignedSamples(prev => [
        ...prev, 
        ...samplesToUnassign.map(s => ({...s, startMins: undefined, resourceId: undefined}))
      ]);
      setScheduledSamples(prev => prev.filter(s => s.resourceId !== id));
    }
    setResources(prev => prev.filter(r => r.id !== id));
  };

  const attemptAssignment = (sampleId, targetMins, targetResourceId) => {
    const sample = unassignedSamples.find(s => s.id === sampleId) || scheduledSamples.find(s => s.id === sampleId);
    if (!sample) return false;

    const endMins = targetMins + sample.duration;
    if (endMins > END_MINS) {
      setErrorToast('Sample duration exceeds schedule end time.');
      return false;
    }

    const overlaps = scheduledSamples.some(s => {
      if (s.id === sampleId) return false; 
      if (s.resourceId !== targetResourceId) return false; 
      const sEnd = s.startMins + s.duration;
      return (targetMins < sEnd && endMins > s.startMins);
    });

    if (overlaps) {
      setErrorToast('Time slot overlaps with an existing sample on this resource.');
      return false;
    }

    setUnassignedSamples(prev => prev.filter(s => s.id !== sampleId));
    setScheduledSamples(prev => {
      const others = prev.filter(s => s.id !== sampleId);
      return [...others, { ...sample, startMins: targetMins, resourceId: targetResourceId }];
    });
    
    return true;
  };

  const handleDragStart = (e, sample) => {
    if (resizing) return; 
    e.dataTransfer.setData('text/plain', sample.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(sample.id);
    setSelectedId(null);
  };

  const handleDrop = (e, targetMins, resourceId) => {
    e.preventDefault();
    setHoveredSlot(null);
    const sampleId = e.dataTransfer.getData('text/plain');
    attemptAssignment(sampleId, targetMins, resourceId);
    setDraggedId(null);
  };

  const handleSlotClick = (targetMins, resourceId) => {
    if (selectedId) {
      if (attemptAssignment(selectedId, targetMins, resourceId)) {
        setSelectedId(null);
      }
    }
  };

  const handleRemoveFromSchedule = (e, sample) => {
    e.stopPropagation(); 
    setScheduledSamples(prev => prev.filter(s => s.id !== sample.id));
    setUnassignedSamples(prev => [...prev, { ...sample, startMins: undefined, resourceId: undefined }]);
    if (selectedId === sample.id) setSelectedId(null);
  };

  const handleDeleteUnassigned = (e, id) => {
    e.stopPropagation(); 
    setUnassignedSamples(prev => prev.filter(s => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleResizeStart = (e, sample) => {
    e.stopPropagation();
    e.preventDefault();
    
    let maxAllowedDuration = END_MINS - sample.startMins;
    const laterSamples = scheduledSamples.filter(s => 
      s.resourceId === sample.resourceId && 
      s.id !== sample.id && 
      s.startMins >= sample.startMins
    );
    
    if (laterSamples.length > 0) {
      laterSamples.sort((a, b) => a.startMins - b.startMins);
      const nextSample = laterSamples[0];
      const timeUntilNext = nextSample.startMins - sample.startMins;
      maxAllowedDuration = Math.min(maxAllowedDuration, timeUntilNext);
    }

    setResizing({
      sampleId: sample.id,
      startY: e.clientY,
      startDuration: sample.duration,
      maxDuration: maxAllowedDuration
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden selection:bg-blue-200">
      
      {errorToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-xl font-medium animate-bounce transition-all">
          {errorToast}
        </div>
      )}

      <div className="w-full md:w-80 flex flex-col border-r border-slate-200 bg-white h-1/3 md:h-full shrink-0 shadow-sm z-10">
        
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Lab Scheduler
          </h1>
          <div className="flex gap-1">
            <button 
              onClick={() => { setIsManagingEquipment(!isManagingEquipment); setIsManagingCategories(false); }}
              className={`p-2 rounded-md transition-colors ${isManagingEquipment ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'}`}
              title="Manage Equipment"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </button>
            <button 
              onClick={() => { setIsManagingCategories(!isManagingCategories); setIsManagingEquipment(false); }}
              className={`p-2 rounded-md transition-colors ${isManagingCategories ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'}`}
              title="Manage Categories"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {isManagingEquipment && (
          <div className="p-4 border-b border-slate-200 bg-slate-100/50 space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
              Equipment
              <button onClick={addResource} className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Add
              </button>
            </h2>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
              {resources.map(res => (
                <div key={res.id} className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={res.name}
                    onChange={(e) => updateResourceName(res.id, e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                  />
                  <button 
                    onClick={() => deleteResource(res.id)} 
                    className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-white/60 transition-colors"
                    title="Delete Equipment"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isManagingCategories && (
          <div className="p-4 border-b border-slate-200 bg-slate-100/50 space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
              Categories
              <button onClick={addCategory} className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Add
              </button>
            </h2>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center gap-2">
                  <button 
                    onClick={() => cycleCategoryColor(cat.id)}
                    className={`w-6 h-6 rounded-full shrink-0 border-2 cursor-pointer shadow-sm ${SAMPLE_COLORS[cat.colorIdx].split(' ')[0]} ${SAMPLE_COLORS[cat.colorIdx].split(' ')[1]}`}
                    title="Click to change color"
                  />
                  <input 
                    type="text" 
                    value={cat.name}
                    onChange={(e) => updateCategoryName(cat.id, e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleAddSample} className="p-4 border-b border-slate-200 bg-white">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">New Sample Name</label>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Acid Test B"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Category</label>
                <select 
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  className="w-full px-2 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Time</label>
                <select 
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="w-full px-2 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="15">15m</option>
                  <option value="30">30m</option>
                  <option value="45">45m</option>
                  <option value="60">1hr</option>
                  <option value="90">1.5h</option>
                </select>
              </div>
            </div>
            <button 
              type="submit"
              className="w-full py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors shadow-sm"
            >
              Add to Queue
            </button>
          </div>
        </form>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          <div className="flex justify-between items-end mb-2">
             <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Queue ({unassignedSamples.length})</h2>
          </div>
          
          {unassignedSamples.length === 0 && (
            <div className="text-sm text-slate-400 text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
              Queue is empty.
            </div>
          )}

          {unassignedSamples.map(sample => {
            const cat = categories.find(c => c.id === sample.categoryId);
            const colorClass = getCategoryColor(sample.categoryId);
            
            return (
              <div
                key={sample.id}
                draggable
                onDragStart={(e) => handleDragStart(e, sample)}
                onClick={() => setSelectedId(prev => prev === sample.id ? null : sample.id)}
                className={`p-3 border rounded-lg shadow-sm cursor-grab active:cursor-grabbing transition-all ${colorClass} 
                  ${selectedId === sample.id ? 'ring-2 ring-blue-600 ring-offset-2 scale-[1.02]' : 'hover:-translate-y-0.5 hover:shadow-md'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-sm pr-2">{sample.name}</div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={(e) => handleDeleteUnassigned(e, sample.id)}
                      className="p-1.5 rounded text-slate-500 hover:text-red-600 hover:bg-white/60 transition-colors"
                      title="Delete permanently"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <svg className="w-4 h-4 opacity-40 cursor-grab" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                   <div className="text-xs font-medium opacity-80 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {sample.duration} min
                  </div>
                  <div className="text-[10px] font-semibold uppercase opacity-70 bg-white/40 px-1.5 py-0.5 rounded">
                    {cat?.name || 'Unknown'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-2/3 md:h-full relative bg-slate-100 overflow-hidden">
        
        <div className="bg-white border-b border-slate-200 z-20 flex shadow-sm">
          <div className="w-20 shrink-0 border-r border-slate-200 p-4 flex flex-col justify-center bg-slate-50">
            <span className="text-xs font-bold text-slate-500 uppercase">Time</span>
          </div>
          <div className="flex-1 flex overflow-x-auto no-scrollbar">
            {resources.map(resource => (
              <div key={resource.id} className="flex-1 min-w-[200px] border-r border-slate-200 p-4 text-center bg-white flex items-center justify-center">
                 {isManagingEquipment ? (
                    <input 
                      type="text"
                      value={resource.name}
                      onChange={(e) => updateResourceName(resource.id, e.target.value)}
                      className="w-full text-center font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded px-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                 ) : (
                    <h3 className="font-semibold text-slate-800 text-sm whitespace-nowrap">{resource.name}</h3>
                 )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-auto relative bg-white">
          <div className="flex min-w-fit">
            
            <div className="w-20 shrink-0 sticky left-0 z-10 bg-slate-50/90 backdrop-blur border-r border-slate-200">
              {timeSlots.map(mins => (
                <div key={mins} className="h-16 flex items-start justify-end pr-3 pt-2 relative">
                  <span className="text-xs font-medium text-slate-400 -translate-y-1/2 bg-slate-50 px-1">
                    {formatTime(mins)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex-1 flex">
              {resources.map(resource => (
                <div key={resource.id} className="flex-1 min-w-[200px] border-r border-slate-100 relative">
                  
                  {timeSlots.map((mins) => {
                    const isHovered = hoveredSlot?.mins === mins && hoveredSlot?.resourceId === resource.id;
                    return (
                      <div 
                        key={mins}
                        onDragOver={(e) => { e.preventDefault(); setHoveredSlot({ mins, resourceId: resource.id }); }}
                        onDragLeave={() => setHoveredSlot(null)}
                        onDrop={(e) => handleDrop(e, mins, resource.id)}
                        onClick={() => handleSlotClick(mins, resource.id)}
                        className={`h-16 border-b border-slate-100 transition-colors box-border
                          ${isHovered ? 'bg-blue-50/80 border-blue-200' : 'hover:bg-slate-50 cursor-pointer'}
                          ${selectedId ? 'hover:bg-blue-50/50' : ''}
                        `}
                      >
                         {isHovered && draggedId && (
                            <div className="w-full h-full border-2 border-dashed border-blue-400 rounded-md pointer-events-none opacity-50 scale-95" />
                         )}
                      </div>
                    );
                  })}

                  {scheduledSamples.filter(s => s.resourceId === resource.id).map(sample => {
                    const topOffset = ((sample.startMins - START_MINS) / INTERVAL) * SLOT_HEIGHT;
                    const height = (sample.duration / INTERVAL) * SLOT_HEIGHT;
                    const colorClass = getCategoryColor(sample.categoryId);
                    const isResizing = resizing?.sampleId === sample.id;
                    
                    return (
                      <div
                        key={sample.id}
                        draggable={!isResizing}
                        onDragStart={(e) => handleDragStart(e, sample)}
                        style={{ top: `${topOffset}px`, height: `${height}px` }}
                        className={`absolute left-2 right-2 rounded-md border p-3 shadow-sm flex flex-col cursor-grab active:cursor-grabbing transition-shadow z-20 group overflow-hidden
                          ${colorClass}
                          ${isResizing ? 'ring-2 ring-blue-500 shadow-xl opacity-90 z-30 cursor-ns-resize' : 'hover:shadow-md hover:z-30'}
                        `}
                      >
                        <div className="flex justify-between items-start w-full">
                          <div className="font-bold text-sm leading-tight pr-6 line-clamp-2">{sample.name}</div>
                          
                          <button 
                            onClick={(e) => handleRemoveFromSchedule(e, sample)}
                            onPointerDown={(e) => e.stopPropagation()} 
                            className="absolute top-2 right-2 p-1 rounded hover:bg-black/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 bg-white/40"
                            title="Unschedule"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                        
                        <div className="text-xs font-medium opacity-80 mt-1 flex-1">
                          {formatTime(sample.startMins)} - {formatTime(sample.startMins + sample.duration)} ({sample.duration}m)
                        </div>

                        <div 
                          className="absolute bottom-0 left-0 right-0 h-4 cursor-ns-resize flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/10 transition-colors bg-gradient-to-t from-black/5 to-transparent"
                          onPointerDown={(e) => handleResizeStart(e, sample)}
                        >
                           <div className="w-8 h-1 rounded-full bg-black/20" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {selectedId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl font-medium flex items-center gap-3 animate-bounce">
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
          Tap any slot in a column to assign
          <button 
            onClick={() => setSelectedId(null)}
            className="ml-2 bg-white/20 hover:bg-white/30 rounded-full p-1"
          >
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}