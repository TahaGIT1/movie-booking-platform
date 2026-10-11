import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Tv2, 
  Plus, 
  Trash2, 
  Armchair, 
  Accessibility, 
  AlertTriangle, 
  Check, 
  X, 
  Sparkles, 
  Sliders, 
  Volume2, 
  Save, 
  RefreshCw,
  Footprints,
  LayoutGrid,
  Route,
  CheckSquare,
  Square,
  HelpCircle
} from 'lucide-react';
import { api } from '../../services/api.service';

export const ManagerScreens = () => {
  const { theatre } = useOutletContext();
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Screen Modal
  const [isAddScreenModalOpen, setIsAddScreenModalOpen] = useState(false);
  const [newScreen, setNewScreen] = useState({
    screenNumber: '',
    name: '',
    soundSystem: 'Dolby Atmos 7.1',
    supportedFormats: ['TWO_D'],
    rows: 8,
    cols: 12
  });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // Matrix Editor Modal state
  const [activeScreenForMatrix, setActiveScreenForMatrix] = useState(null);
  const [savingMatrix, setSavingMatrix] = useState(false);
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'generator'

  // Grid Matrix State: array of cell objects
  const [gridCells, setGridCells] = useState([]);
  const [gridDimensions, setGridDimensions] = useState({ numRows: 8, numCols: 12 });
  
  // Selection & Dragging state
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [activeToolTier, setActiveToolTier] = useState('NORMAL');

  // Custom Generator Form State
  const [genRows, setGenRows] = useState(8);
  const [genCols, setGenCols] = useState(14);
  const [genAisles, setGenAisles] = useState('7'); // comma separated col numbers, e.g. "7"
  const [genTierNormalRows, setGenTierNormalRows] = useState(4); // first 4 rows
  const [genTierPremiumRows, setGenTierPremiumRows] = useState(2); // next 2 rows
  const [genTierReclinerRows, setGenTierReclinerRows] = useState(2); // last 2 rows

  // Mouse up listener for dragging release
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  useEffect(() => {
    fetchScreens();
  }, []);

  const fetchScreens = async () => {
    try {
      setLoading(true);
      const data = await api.getScreens();
      setScreens(data);
    } catch (err) {
      console.error('Error fetching screens:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScreen = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);

    try {
      await api.createScreen({
        screenNumber: newScreen.screenNumber,
        name: newScreen.name,
        soundSystem: newScreen.soundSystem,
        supportedFormats: newScreen.supportedFormats,
        totalCapacity: Number(newScreen.rows) * Number(newScreen.cols),
        rows: Number(newScreen.rows),
        cols: Number(newScreen.cols)
      });
      setIsAddScreenModalOpen(false);
      setNewScreen({
        screenNumber: '',
        name: '',
        soundSystem: 'Dolby Atmos 7.1',
        supportedFormats: ['TWO_D'],
        rows: 8,
        cols: 12
      });
      fetchScreens();
    } catch (err) {
      setCreateError(err.message || 'Failed to create screen');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteScreen = async (id, screenName) => {
    if (!window.confirm(`Are you sure you want to delete ${screenName}? This will remove its seat layout.`)) return;
    try {
      await api.deleteScreen(id);
      fetchScreens();
    } catch (err) {
      alert(err.message || 'Failed to delete screen');
    }
  };

  // Re-index seat numbers within each row sequentially, skipping pathways
  const reindexGridCells = (cells) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const byRow = {};
    cells.forEach(cell => {
      if (!byRow[cell.rowLabel]) byRow[cell.rowLabel] = [];
      byRow[cell.rowLabel].push(cell);
    });

    const updated = [];
    Object.keys(byRow).forEach(rowLabel => {
      const rowCells = byRow[rowLabel].sort((a, b) => a.col - b.col);
      let seatNum = 1;
      rowCells.forEach(c => {
        if (c.isPathway) {
          updated.push({ ...c, seatNumber: 0 });
        } else {
          updated.push({ ...c, seatNumber: seatNum++ });
        }
      });
    });

    return updated;
  };

  // Build grid matrix from screen seat data
  const openMatrixConfigurator = async (screen) => {
    try {
      const detail = await api.getScreen(screen.id);
      setActiveScreenForMatrix(detail);
      setSelectedKeys(new Set());
      setActiveTab('matrix');

      const existingSeats = detail.seats || [];
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

      let maxCols = 12;
      let maxRows = 8;

      if (existingSeats.length > 0) {
        existingSeats.forEach(s => {
          if (s.gridX && s.gridX > maxCols) maxCols = s.gridX;
          if (s.gridY !== undefined && (s.gridY + 1) > maxRows) maxRows = s.gridY + 1;
        });
      }

      setGridDimensions({ numRows: maxRows, numCols: maxCols });

      // Build cell matrix for grid dimensions
      const cells = [];
      for (let r = 0; r < maxRows; r++) {
        const rowLabel = letters[r] || `R${r + 1}`;
        for (let c = 1; c <= maxCols; c++) {
          const match = existingSeats.find(s => 
            (s.gridY === r && s.gridX === c) || 
            (s.rowLabel === rowLabel && s.seatNumber === c && s.gridX === c)
          );

          if (match) {
            cells.push({
              key: `${rowLabel}-${c}`,
              id: match.id,
              rowLabel,
              col: c,
              gridX: c,
              gridY: r,
              seatNumber: match.seatNumber,
              tier: match.tier || 'NORMAL',
              isAccessible: !!match.isAccessible,
              isBroken: !!match.isBroken,
              isPathway: false
            });
          } else {
            // Gap / pathway cell
            cells.push({
              key: `${rowLabel}-${c}`,
              id: `cell-${rowLabel}-${c}`,
              rowLabel,
              col: c,
              gridX: c,
              gridY: r,
              seatNumber: 0,
              tier: 'NORMAL',
              isAccessible: false,
              isBroken: false,
              isPathway: existingSeats.length > 0 ? true : false // if existing seats exist and this is empty, it's a pathway
            });
          }
        }
      }

      setGridCells(reindexGridCells(cells));
    } catch (err) {
      alert('Failed to load screen layout: ' + err.message);
    }
  };

  // Generate a custom grid with defined rows, cols, aisles, and tier distributions
  const handleGenerateCustomGrid = (e) => {
    if (e) e.preventDefault();
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const rows = Number(genRows);
    const cols = Number(genCols);
    const aisles = genAisles.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0 && n <= cols);

    setGridDimensions({ numRows: rows, numCols: cols });

    const cells = [];
    for (let r = 0; r < rows; r++) {
      const rowLabel = letters[r] || `R${r + 1}`;

      // Calculate tier based on row ranges
      let tier = 'NORMAL';
      if (r >= rows - Number(genTierReclinerRows)) {
        tier = 'RECLINER';
      } else if (r >= rows - Number(genTierReclinerRows) - Number(genTierPremiumRows)) {
        tier = 'PREMIUM';
      }

      for (let c = 1; c <= cols; c++) {
        const isPathway = aisles.includes(c);
        cells.push({
          key: `${rowLabel}-${c}`,
          id: `cell-${rowLabel}-${c}`,
          rowLabel,
          col: c,
          gridX: c,
          gridY: r,
          seatNumber: 0,
          tier,
          isAccessible: r === 0 && (c === 1 || c === cols),
          isBroken: false,
          isPathway
        });
      }
    }

    setGridCells(reindexGridCells(cells));
    setSelectedKeys(new Set());
    setActiveTab('matrix');
  };

  // Mouse drag selection handlers
  const handleCellMouseDown = (cell, e) => {
    e.preventDefault();
    setIsDragging(true);

    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      setSelectedKeys(prev => {
        const next = new Set(prev);
        if (next.has(cell.key)) next.delete(cell.key);
        else next.add(cell.key);
        return next;
      });
    } else {
      setSelectedKeys(new Set([cell.key]));
    }
  };

  const handleCellMouseEnter = (cell) => {
    if (isDragging) {
      setSelectedKeys(prev => {
        const next = new Set(prev);
        next.add(cell.key);
        return next;
      });
    }
  };

  // Row header click: select or deselect whole row
  const handleSelectRow = (rowLabel) => {
    const rowKeys = gridCells.filter(c => c.rowLabel === rowLabel).map(c => c.key);
    const allSelected = rowKeys.every(k => selectedKeys.has(k));
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (allSelected) {
        rowKeys.forEach(k => next.delete(k));
      } else {
        rowKeys.forEach(k => next.add(k));
      }
      return next;
    });
  };

  // Column header click: select or deselect whole column
  const handleSelectCol = (colNum) => {
    const colKeys = gridCells.filter(c => c.col === colNum).map(c => c.key);
    const allSelected = colKeys.every(k => selectedKeys.has(k));
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (allSelected) {
        colKeys.forEach(k => next.delete(k));
      } else {
        colKeys.forEach(k => next.add(k));
      }
      return next;
    });
  };

  // Bulk Actions applied to all selected cells
  const handleBulkSetPathway = (isPathway) => {
    if (selectedKeys.size === 0) return;
    setGridCells(prev => {
      const updated = prev.map(c => {
        if (selectedKeys.has(c.key)) {
          return { ...c, isPathway };
        }
        return c;
      });
      return reindexGridCells(updated);
    });
  };

  const handleBulkSetTier = (tier) => {
    if (selectedKeys.size === 0) return;
    setGridCells(prev => {
      const updated = prev.map(c => {
        if (selectedKeys.has(c.key)) {
          return { ...c, tier, isPathway: false }; // turning into a tier implies it's a seat
        }
        return c;
      });
      return reindexGridCells(updated);
    });
  };

  const handleBulkToggleAccessible = () => {
    if (selectedKeys.size === 0) return;
    const selectedList = gridCells.filter(c => selectedKeys.has(c.key));
    const allAccessible = selectedList.every(c => c.isAccessible);
    setGridCells(prev => prev.map(c => {
      if (selectedKeys.has(c.key)) {
        return { ...c, isAccessible: !allAccessible };
      }
      return c;
    }));
  };

  const handleBulkToggleBroken = () => {
    if (selectedKeys.size === 0) return;
    const selectedList = gridCells.filter(c => selectedKeys.has(c.key));
    const allBroken = selectedList.every(c => c.isBroken);
    setGridCells(prev => prev.map(c => {
      if (selectedKeys.has(c.key)) {
        return { ...c, isBroken: !allBroken };
      }
      return c;
    }));
  };

  const handleSelectAll = () => {
    setSelectedKeys(new Set(gridCells.map(c => c.key)));
  };

  const handleDeselectAll = () => {
    setSelectedKeys(new Set());
  };

  // Save matrix to backend
  const handleSaveMatrix = async () => {
    if (!activeScreenForMatrix) return;
    setSavingMatrix(true);

    try {
      // Exclude pathway cells from bookable seats
      const validSeats = gridCells.filter(c => !c.isPathway);
      
      const payload = {
        customLayout: validSeats.map(s => ({
          rowLabel: s.rowLabel,
          seatNumber: s.seatNumber,
          tier: s.tier,
          isAccessible: s.isAccessible,
          isBroken: s.isBroken,
          gridX: s.gridX,
          gridY: s.gridY
        }))
      };

      const res = await api.configureSeats(activeScreenForMatrix.id, payload);
      alert(`Success: ${res.message || 'Seat matrix saved successfully!'}`);
      await fetchScreens();
      await openMatrixConfigurator(activeScreenForMatrix);
    } catch (err) {
      alert('Failed to save seat matrix: ' + err.message);
    } finally {
      setSavingMatrix(false);
    }
  };

  // Group cells by rowLabel for matrix rendering
  const rowsGrouped = {};
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < gridDimensions.numRows; r++) {
    const rowLabel = letters[r] || `R${r + 1}`;
    rowsGrouped[rowLabel] = gridCells
      .filter(c => c.rowLabel === rowLabel)
      .sort((a, b) => a.col - b.col);
  }

  const rowLabels = Object.keys(rowsGrouped);
  const totalActualSeats = gridCells.filter(c => !c.isPathway).length;
  const totalPathways = gridCells.filter(c => c.isPathway).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Tv2 className="text-yellow-400" /> Screens & Seat Matrix
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Build custom auditorium grids, drag-select multiple seats, define walking pathways, and customize seat tiers.
          </p>
        </div>

        <button
          onClick={() => setIsAddScreenModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold transition shadow-lg shadow-yellow-500/20"
        >
          <Plus size={16} /> Add Auditorium Screen
        </button>
      </div>

      {/* Screens Grid */}
      {loading ? (
        <div className="py-20 text-center text-neutral-500">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-yellow-400" />
          <p className="text-sm">Loading auditorium screens...</p>
        </div>
      ) : screens.length === 0 ? (
        <div className="bg-[#101216] border border-white/5 rounded-2xl p-12 text-center">
          <Tv2 size={48} className="mx-auto text-neutral-600 mb-3" />
          <h3 className="text-lg font-bold text-white">No Screens Configured Yet</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mt-1 mb-6">
            Get started by adding your cinema's first auditorium screen with supported visual formats and sound system.
          </p>
          <button
            onClick={() => setIsAddScreenModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold transition"
          >
            <Plus size={16} /> Add First Screen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screens.map((screen) => (
            <div
              key={screen.id}
              className="bg-[#101216] border border-white/5 hover:border-yellow-500/30 rounded-2xl p-6 transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                      Screen {screen.screenNumber}
                    </span>
                    <h3 className="text-xl font-bold text-white mt-2 group-hover:text-yellow-400 transition">
                      {screen.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleDeleteScreen(screen.id, screen.name)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition"
                    title="Delete Screen"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Specs */}
                <div className="mt-4 space-y-2.5 text-xs text-neutral-300">
                  <div className="flex items-center gap-2">
                    <Volume2 size={14} className="text-yellow-400 shrink-0" />
                    <span className="truncate">{screen.soundSystem || 'Dolby Surround 7.1'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Armchair size={14} className="text-cyan-400 shrink-0" />
                    <span>
                      <strong>{screen._count?.seats || screen.totalCapacity}</strong> bookable seats
                    </span>
                  </div>

                  {/* Format Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {screen.supportedFormats?.map((fmt) => (
                      <span
                        key={fmt}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10 text-neutral-300"
                      >
                        {fmt === 'TWO_D' ? '2D' : fmt === 'THREE_D' ? '3D' : fmt === 'FOUR_DX' ? '4DX' : fmt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2">
                <button
                  onClick={() => openMatrixConfigurator(screen)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-yellow-500 hover:text-black text-white text-xs font-bold border border-white/10 hover:border-yellow-500 transition group/btn"
                >
                  <Sliders size={14} className="text-yellow-400 group-hover/btn:text-black" />
                  Configure Matrix & Pathways
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD SCREEN */}
      {isAddScreenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121419] border border-white/10 rounded-2xl w-full max-w-md p-6 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Tv2 className="text-yellow-400" size={20} />
                Add Auditorium Screen
              </h3>
              <button
                onClick={() => setIsAddScreenModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateScreen} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Screen / Audi Number <span className="text-yellow-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1, 2, or IMAX 1"
                  value={newScreen.screenNumber}
                  onChange={(e) => setNewScreen({ ...newScreen, screenNumber: e.target.value })}
                  className="w-full bg-[#1a1d24] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Screen Name <span className="text-yellow-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audi 1 - Dolby Atmos Main"
                  value={newScreen.name}
                  onChange={(e) => setNewScreen({ ...newScreen, name: e.target.value })}
                  className="w-full bg-[#1a1d24] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Sound System</label>
                <select
                  value={newScreen.soundSystem}
                  onChange={(e) => setNewScreen({ ...newScreen, soundSystem: e.target.value })}
                  className="w-full bg-[#1a1d24] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                >
                  <option value="Dolby Atmos 7.1">Dolby Atmos 7.1</option>
                  <option value="Dolby Atmos 9.1.2">Dolby Atmos 9.1.2</option>
                  <option value="IMAX 12-Track Immersive">IMAX 12-Track Immersive</option>
                  <option value="DTS:X Surround">DTS:X Surround</option>
                  <option value="Dolby 5.1 Surround">Dolby 5.1 Surround</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">Supported Formats</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'TWO_D', label: '2D' },
                    { id: 'THREE_D', label: '3D' },
                    { id: 'IMAX', label: 'IMAX' },
                    { id: 'FOUR_DX', label: '4DX' },
                    { id: 'SCREEN_X', label: 'ScreenX' }
                  ].map((fmt) => {
                    const isChecked = newScreen.supportedFormats.includes(fmt.id);
                    return (
                      <button
                        type="button"
                        key={fmt.id}
                        onClick={() => {
                          const updated = isChecked
                            ? newScreen.supportedFormats.filter(f => f !== fmt.id)
                            : [...newScreen.supportedFormats, fmt.id];
                          setNewScreen({ ...newScreen, supportedFormats: updated.length ? updated : ['TWO_D'] });
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition text-center ${
                          isChecked
                            ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400'
                            : 'bg-white/[0.03] border-white/10 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Rows (A-Z)</label>
                  <input
                    type="number"
                    min="1"
                    max="26"
                    value={newScreen.rows}
                    onChange={(e) => setNewScreen({ ...newScreen, rows: Math.max(1, e.target.value) })}
                    className="w-full bg-[#1a1d24] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Seats / Row</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={newScreen.cols}
                    onChange={(e) => setNewScreen({ ...newScreen, cols: Math.max(1, e.target.value) })}
                    className="w-full bg-[#1a1d24] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>
              <div className="text-right text-xs text-neutral-400">
                Initial capacity: <strong className="text-yellow-400">{newScreen.rows * newScreen.cols} seats</strong>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddScreenModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold transition disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Screen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN MODAL: INTERACTIVE SEAT MATRIX CONFIGURATOR WITH DRAG SELECTION & PATHWAYS */}
      {activeScreenForMatrix && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-2 md:p-6 overflow-hidden animate-in fade-in">
          <div className="bg-[#0e1014] border border-white/10 rounded-3xl flex-1 flex flex-col overflow-hidden max-w-[1600px] mx-auto w-full shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#13161c]">
              <div className="flex items-center gap-4">
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  Audi {activeScreenForMatrix.screenNumber}
                </span>
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    {activeScreenForMatrix.name}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-neutral-400 mt-0.5">
                    <span>Capacity: <strong className="text-white">{totalActualSeats}</strong> bookable seats</span>
                    <span>•</span>
                    <span>Pathways/Gaps: <strong className="text-neutral-300">{totalPathways}</strong> cells</span>
                  </div>
                </div>
              </div>

              {/* Mode Switcher & Save Button */}
              <div className="flex items-center gap-3">
                <div className="flex rounded-xl bg-white/5 p-1 border border-white/5">
                  <button
                    onClick={() => setActiveTab('matrix')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      activeTab === 'matrix' ? 'bg-yellow-500 text-black shadow' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid size={14} /> Matrix Canvas
                  </button>
                  <button
                    onClick={() => setActiveTab('generator')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      activeTab === 'generator' ? 'bg-yellow-500 text-black shadow' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Sliders size={14} /> Custom Generator
                  </button>
                </div>

                <button
                  onClick={handleSaveMatrix}
                  disabled={savingMatrix}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Save size={15} />
                  {savingMatrix ? 'Saving Changes...' : 'Save Matrix Layout'}
                </button>

                <button
                  onClick={() => setActiveScreenForMatrix(null)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* TAB 1: VISUAL MATRIX CANVAS */}
            {activeTab === 'matrix' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* FLOATING / STICKY BULK ACTION BAR */}
                <div className="px-6 py-2.5 bg-[#141820] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-neutral-300">
                      Selection: <strong className="text-yellow-400 font-mono">{selectedKeys.size}</strong> cells selected
                    </span>

                    {selectedKeys.size > 0 && (
                      <button
                        onClick={handleDeselectAll}
                        className="text-[11px] text-neutral-400 hover:text-white underline"
                      >
                        Clear
                      </button>
                    )}

                    <button
                      onClick={handleSelectAll}
                      className="text-[11px] text-neutral-400 hover:text-white underline ml-1"
                    >
                      Select All
                    </button>
                  </div>

                  {/* Bulk Operations */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-neutral-500 font-medium mr-1">Apply to selected:</span>

                    {/* Pathways */}
                    <button
                      onClick={() => handleBulkSetPathway(true)}
                      disabled={selectedKeys.size === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-white/10 font-bold transition disabled:opacity-40"
                      title="Turn selected seats into an empty walkway aisle"
                    >
                      <Footprints size={13} className="text-yellow-400" />
                      Make Pathway / Aisle
                    </button>

                    <button
                      onClick={() => handleBulkSetPathway(false)}
                      disabled={selectedKeys.size === 0}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 font-semibold transition disabled:opacity-40"
                      title="Convert walkways back to normal seats"
                    >
                      <Armchair size={13} />
                      Convert to Seat
                    </button>

                    {/* Tier Setters */}
                    <button
                      onClick={() => handleBulkSetTier('NORMAL')}
                      disabled={selectedKeys.size === 0}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-bold transition disabled:opacity-40"
                    >
                      Normal
                    </button>

                    <button
                      onClick={() => handleBulkSetTier('PREMIUM')}
                      disabled={selectedKeys.size === 0}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 font-bold transition disabled:opacity-40"
                    >
                      Premium
                    </button>

                    <button
                      onClick={() => handleBulkSetTier('RECLINER')}
                      disabled={selectedKeys.size === 0}
                      className="px-2.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 font-bold transition disabled:opacity-40"
                    >
                      Recliner
                    </button>

                    {/* Flags */}
                    <button
                      onClick={handleBulkToggleAccessible}
                      disabled={selectedKeys.size === 0}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-blue-400 border border-white/10 transition disabled:opacity-40"
                      title="Toggle Wheelchair Accessible"
                    >
                      <Accessibility size={15} />
                    </button>

                    <button
                      onClick={handleBulkToggleBroken}
                      disabled={selectedKeys.size === 0}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-red-400 border border-white/10 transition disabled:opacity-40"
                      title="Toggle Broken / Maintenance"
                    >
                      <AlertTriangle size={15} />
                    </button>
                  </div>
                </div>

                {/* Main Interactive Matrix Viewport */}
                <div className="flex-1 overflow-auto p-6 md:p-8 flex flex-col items-center select-none bg-[#090b0e]">
                  {/* Curved Cinema Screen Header */}
                  <div className="w-full max-w-4xl mb-8 text-center pointer-events-none">
                    <div className="h-2 w-full bg-gradient-to-r from-transparent via-yellow-500 to-transparent rounded-full shadow-[0_0_25px_rgba(234,179,8,0.7)]" />
                    <div className="mt-2 text-[11px] font-black tracking-[0.3em] uppercase text-neutral-400">
                      CINEMA SCREEN THIS WAY
                    </div>
                  </div>

                  {/* Legend & Instructions */}
                  <div className="flex flex-wrap items-center justify-center gap-4 text-xs mb-6 p-2.5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-1.5 text-neutral-300">
                      <span className="w-3.5 h-3.5 rounded bg-cyan-600/40 border border-cyan-400 inline-block" />
                      <span>Normal</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-300">
                      <span className="w-3.5 h-3.5 rounded bg-amber-600/40 border border-amber-400 inline-block" />
                      <span>Premium</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-300">
                      <span className="w-3.5 h-3.5 rounded bg-purple-600/40 border border-purple-400 inline-block" />
                      <span>Recliner</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-300">
                      <span className="w-5 h-3.5 rounded border border-dashed border-neutral-600 bg-neutral-900/60 inline-flex items-center justify-center text-[9px] text-neutral-500">
                        <Footprints size={10} />
                      </span>
                      <span>Pathway / Aisle</span>
                    </div>
                    <div className="text-neutral-500 text-[11px] ml-2">
                      💡 <em>Click & drag across adjacent seats to multi-select. Click row or column headers to select entire line.</em>
                    </div>
                  </div>

                  {/* MATRIX GRID CONTAINER */}
                  <div className="pb-16 inline-block">
                    {/* Column Headers (1, 2, 3...) - Clickable to select entire column */}
                    <div className="flex items-center gap-1.5 mb-2 pl-10">
                      {Array.from({ length: gridDimensions.numCols }).map((_, cIdx) => {
                        const colNum = cIdx + 1;
                        return (
                          <button
                            key={`col-head-${colNum}`}
                            onClick={() => handleSelectCol(colNum)}
                            className="w-8 h-6 rounded text-[10px] font-mono font-bold text-neutral-500 hover:text-yellow-400 hover:bg-white/5 transition flex items-center justify-center"
                            title={`Click to select Column ${colNum} (e.g. to create vertical aisle)`}
                          >
                            {colNum}
                          </button>
                        );
                      })}
                    </div>

                    {/* Rows */}
                    <div className="space-y-1.5">
                      {rowLabels.map((rowLabel) => {
                        const rowCells = rowsGrouped[rowLabel] || [];
                        return (
                          <div key={rowLabel} className="flex items-center gap-1.5">
                            {/* Row Header Button (A, B, C...) - Clickable to select entire row */}
                            <button
                              onClick={() => handleSelectRow(rowLabel)}
                              className="w-8 h-8 rounded text-xs font-mono font-black text-neutral-400 hover:text-yellow-400 hover:bg-white/5 transition flex items-center justify-center"
                              title={`Click to select entire Row ${rowLabel}`}
                            >
                              {rowLabel}
                            </button>

                            {/* Row Cells */}
                            <div className="flex items-center gap-1.5">
                              {rowCells.map((cell) => {
                                const isSelected = selectedKeys.has(cell.key);

                                if (cell.isPathway) {
                                  // RENDER PATHWAY / WALKWAY CELL
                                  return (
                                    <div
                                      key={cell.key}
                                      onMouseDown={(e) => handleCellMouseDown(cell, e)}
                                      onMouseEnter={() => handleCellMouseEnter(cell)}
                                      className={`w-8 h-8 rounded-lg border border-dashed border-white/10 bg-black/40 flex items-center justify-center transition cursor-pointer group/path ${
                                        isSelected 
                                          ? 'border-yellow-400 ring-2 ring-yellow-400 bg-yellow-500/20' 
                                          : 'hover:border-white/30 hover:bg-white/5'
                                      }`}
                                      title={`Row ${cell.rowLabel}, Col ${cell.col}: Walking Pathway (Click/drag to select)`}
                                    >
                                      <Footprints size={12} className={`opacity-40 group-hover/path:opacity-80 ${isSelected ? 'text-yellow-400 opacity-100' : 'text-neutral-500'}`} />
                                    </div>
                                  );
                                }

                                // RENDER REAL SEAT CELL
                                let colorClasses = 'bg-cyan-600/20 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/40';
                                if (cell.tier === 'PREMIUM') {
                                  colorClasses = 'bg-amber-600/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/40';
                                } else if (cell.tier === 'RECLINER') {
                                  colorClasses = 'bg-purple-600/20 border-purple-500/50 text-purple-300 hover:bg-purple-500/40';
                                }

                                if (cell.isBroken) {
                                  colorClasses = 'bg-red-500/10 border-red-500/40 text-red-400 line-through opacity-70';
                                }

                                return (
                                  <div
                                    key={cell.key}
                                    onMouseDown={(e) => handleCellMouseDown(cell, e)}
                                    onMouseEnter={() => handleCellMouseEnter(cell)}
                                    className={`w-8 h-8 rounded-lg border text-xs font-mono font-bold flex items-center justify-center transition cursor-pointer relative ${colorClasses} ${
                                      isSelected
                                        ? 'ring-2 ring-yellow-400 scale-105 z-10 shadow-lg !border-yellow-400'
                                        : ''
                                    }`}
                                    title={`Seat ${cell.rowLabel}${cell.seatNumber} (${cell.tier})`}
                                  >
                                    {cell.isAccessible ? (
                                      <Accessibility size={13} className="text-blue-400" />
                                    ) : (
                                      <span>{cell.seatNumber}</span>
                                    )}

                                    {cell.isBroken && (
                                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CUSTOM GRID GENERATOR FORM */}
            {activeTab === 'generator' && (
              <div className="flex-1 overflow-auto p-8 max-w-2xl mx-auto w-full">
                <div className="bg-[#14171d] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sliders className="text-yellow-400" size={20} />
                      Auditorium Custom Grid Generator
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      Configure dimensions, specify pathway aisles, and assign tier proportions.
                    </p>
                  </div>

                  <form onSubmit={handleGenerateCustomGrid} className="space-y-5 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-neutral-300 mb-1">
                          Total Rows (A-Z)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="26"
                          required
                          value={genRows}
                          onChange={(e) => setGenRows(e.target.value)}
                          className="w-full bg-[#1b1e26] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-neutral-300 mb-1">
                          Columns / Seats Per Row
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          required
                          value={genCols}
                          onChange={(e) => setGenCols(e.target.value)}
                          className="w-full bg-[#1b1e26] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-300 mb-1">
                        Pathway / Aisle Columns (comma-separated column numbers)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 5, 11 (or leave blank for no center aisles)"
                        value={genAisles}
                        onChange={(e) => setGenAisles(e.target.value)}
                        className="w-full bg-[#1b1e26] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 font-mono"
                      />
                      <span className="text-[11px] text-neutral-500 mt-1 block">
                        These columns will be converted to walkway aisles without seats.
                      </span>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="pt-2">
                      <span className="text-[11px] font-semibold text-neutral-400 block mb-2">
                        Or select a cinema preset:
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setGenRows(8);
                            setGenCols(12);
                            setGenAisles('7');
                            setGenTierNormalRows(4);
                            setGenTierPremiumRows(2);
                            setGenTierReclinerRows(2);
                          }}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-neutral-300 text-center"
                        >
                          <div className="font-bold">Standard 8×12</div>
                          <div className="text-[10px] text-neutral-500">Center Aisle (Col 7)</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setGenRows(10);
                            setGenCols(16);
                            setGenAisles('5, 12');
                            setGenTierNormalRows(5);
                            setGenTierPremiumRows(3);
                            setGenTierReclinerRows(2);
                          }}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-neutral-300 text-center"
                        >
                          <div className="font-bold">Large 10×16</div>
                          <div className="text-[10px] text-neutral-500">2 Aisles (Cols 5, 12)</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setGenRows(6);
                            setGenCols(10);
                            setGenAisles('5');
                            setGenTierNormalRows(0);
                            setGenTierPremiumRows(2);
                            setGenTierReclinerRows(4);
                          }}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-neutral-300 text-center"
                        >
                          <div className="font-bold">Luxe Recliner 6×10</div>
                          <div className="text-[10px] text-neutral-500">Plush VIP Audi</div>
                        </button>
                      </div>
                    </div>

                    {/* Tier Row Count Distribution */}
                    <div className="pt-4 border-t border-white/10 space-y-3">
                      <label className="block font-semibold text-neutral-300">
                        Seat Tier Allocation by Rows
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <span className="text-[10px] text-cyan-400 font-bold block mb-1">Normal Rows</span>
                          <input
                            type="number"
                            min="0"
                            max={genRows}
                            value={genTierNormalRows}
                            onChange={(e) => setGenTierNormalRows(e.target.value)}
                            className="w-full bg-[#1b1e26] border border-white/10 rounded-xl px-3 py-2 text-white font-mono font-bold"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-400 font-bold block mb-1">Premium Rows</span>
                          <input
                            type="number"
                            min="0"
                            max={genRows}
                            value={genTierPremiumRows}
                            onChange={(e) => setGenTierPremiumRows(e.target.value)}
                            className="w-full bg-[#1b1e26] border border-white/10 rounded-xl px-3 py-2 text-white font-mono font-bold"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-purple-400 font-bold block mb-1">Recliner Rows</span>
                          <input
                            type="number"
                            min="0"
                            max={genRows}
                            value={genTierReclinerRows}
                            onChange={(e) => setGenTierReclinerRows(e.target.value)}
                            className="w-full bg-[#1b1e26] border border-white/10 rounded-xl px-3 py-2 text-white font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveTab('matrix')}
                        className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold transition shadow-lg shadow-yellow-500/20"
                      >
                        Generate & Open Matrix
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
