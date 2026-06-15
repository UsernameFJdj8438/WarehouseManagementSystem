import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchShelves } from '../../../store/slices/inventorySlice';
import { Shelf, Employee, WorkOrder, EmployeeRole, WorkOrderStatus, LPN, Bin } from '../types/inventory.types';
import { warehouseApi } from '../services/warehouseApi';
import { Button } from '../../../components/UI/Button';
import { Card } from '../../../components/UI/Card';
import { Input } from '../../../components/UI/Input';
import { useAuth } from '../../auth/context/AuthContext';

export const WarehouseViewer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { shelves, loading } = useAppSelector((state) => state.inventory);
  const { user: currentUser } = useAuth();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null);
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  
  const [movementSource, setMovementSource] = useState<{ bin: Bin, lpn: LPN } | null>(null);
  const [assignedWorkerId, setAssignedWorkerId] = useState<number>(0);

  const [isAddingShelf, setIsAddingShelf] = useState(false);
  const [isEditingShelf, setIsEditingShelf] = useState(false);
  const [newShelfLabel, setNewShelfLabel] = useState('');
  const [newShelfType, setNewShelfType] = useState<'Standard' | 'Dock'>('Standard');
  
  const [editShelfLabel, setEditShelfLabel] = useState('');
  const [editShelfX, setEditShelfX] = useState(0);
  const [editShelfY, setEditShelfY] = useState(0);

  const fetchData = async () => {
    try {
      dispatch(fetchShelves());
      
      let employeeData: Employee[] = [];
      if (currentUser?.role === EmployeeRole.Manager) {
        employeeData = await warehouseApi.getEmployees();
      }

      const woData = await warehouseApi.getWorkOrders();
      
      console.log("Employees fetched:", employeeData);
      console.log("Work Orders fetched:", woData);
      
      setEmployees(employeeData);
      setWorkOrders(woData);
    } catch (err) {
      console.error("Failed to fetch data in Viewer:", err);
    }
  };

  useEffect(() => {
    if (currentUser) fetchData();
  }, [dispatch, currentUser?.employeeID]);

  const handleAddShelf = async () => {
    if (!newShelfLabel) return;
    
    const lastShelf = shelves[shelves.length - 1];
    const newX = 500; 
    const newY = lastShelf ? lastShelf.y + 50 : 100;

    const newShelf = {
      label: newShelfLabel,
      x: newShelfType === 'Dock' ? 550 : newX,
      y: newShelfType === 'Dock' ? 10 : newY,
      width: newShelfType === 'Dock' ? 200 : 120,
      height: newShelfType === 'Dock' ? 60 : 40,
      binCount: newShelfType === 'Dock' ? 8 : 4,
      isLoadingDock: newShelfType === 'Dock'
    };

    try {
      await warehouseApi.createShelf(newShelf);
      setNewShelfLabel('');
      setIsAddingShelf(false);
      fetchData();
    } catch (err) {
      alert('Failed to add shelf');
    }
  };

  const handleShelfClick = (shelf: Shelf) => {
    setSelectedShelf(shelf);
    setSelectedBin(null);
    setIsEditingShelf(false);
    
    setEditShelfLabel(shelf.label);
    setEditShelfX(shelf.x);
    setEditShelfY(shelf.y);
  };

  const handleUpdateShelf = async () => {
    if (!selectedShelf) return;
    const updatedShelf = {
      ...selectedShelf,
      label: editShelfLabel,
      x: editShelfX,
      y: editShelfY
    };
    try {
      await warehouseApi.updateShelf(updatedShelf);
      setIsEditingShelf(false);
      fetchData();
    } catch (err) {
      alert('Failed to update shelf');
    }
  };

  const handleCreateWorkOrder = async (targetBin: Bin) => {
    if (!movementSource) return;
    
    if (!assignedWorkerId) {
      alert('Please select a worker to assign this task to.');
      return;
    }

    try {
      await warehouseApi.createWorkOrder({
        lpnid: movementSource.lpn.lpnid,
        fromBinID: movementSource.bin.binID,
        toBinID: targetBin.binID,
        assignedEmployeeID: assignedWorkerId
      });
      setMovementSource(null);
      setAssignedWorkerId(0);
      fetchData();
      alert('Work Order Created Successfully!');
    } catch (err) {
      alert('Failed to create work order');
    }
  };

  const handleUpdateWOStatus = async (woId: number, status: WorkOrderStatus) => {
    try {
      await warehouseApi.updateWorkOrderStatus(woId, status);
      fetchData();
    } catch (err) {
      alert('Failed to update work order');
    }
  };

  if (loading && shelves.length === 0) return <div className="p-10 text-center text-muted-text">Loading Warehouse Environment...</div>;

  const activeWO = workOrders.find(wo => {
    const assignedId = wo.assignedEmployeeID || (wo as any).assignedEmployeeId;
    return assignedId === currentUser?.employeeID && wo.status !== WorkOrderStatus.Completed;
  });
  
  const getShelfIdFromBinId = (binId: number) => {
    for (const shelf of shelves) {
      if (shelf.bins?.some(b => b.binID === binId)) return shelf.shelfID;
    }
    return null;
  };

  const activeTaskSourceShelf = activeWO?.status === WorkOrderStatus.Pending ? getShelfIdFromBinId(activeWO.fromBinID) : null;
  const activeTaskDestShelf = activeWO?.status === WorkOrderStatus.InProgress ? getShelfIdFromBinId(activeWO.toBinID) : null;

  const activeTaskBinID = activeWO?.status === WorkOrderStatus.Pending ? activeWO.fromBinID : 
                          activeWO?.status === WorkOrderStatus.InProgress ? activeWO.toBinID : null;

  return (
    <div className="flex flex-col w-full h-[calc(100vh-180px)] gap-6">
      
      <Card padding="none" className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 transition-colors">
        <div className="flex items-center gap-6">
          <h2 className="text-xl font-black text-card-title tracking-tight">Warehouse Control</h2>
          <div className="h-8 w-px bg-base-border hidden sm:block" />
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-muted-text uppercase tracking-widest">Session:</span>
            <span className="px-3 py-1.5 rounded-lg border border-base-border bg-page text-sm font-black text-base-text shadow-inner">
              {currentUser?.name}
            </span>
          </div>
        </div>
        
        {currentUser?.role === EmployeeRole.Worker && activeWO && (
          <div className="flex items-center gap-4 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-lg transition-colors">
            <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
              Task: Move {activeWO.lpnid}
            </span>
            <Button 
              size="sm"
              variant={activeWO.status === WorkOrderStatus.Pending ? 'primary' : 'secondary'}
              onClick={() => handleUpdateWOStatus(activeWO.workOrderID, activeWO.status === WorkOrderStatus.Pending ? WorkOrderStatus.InProgress : WorkOrderStatus.Completed)}
            >
              {activeWO.status === WorkOrderStatus.Pending ? 'Confirm Pick' : 'Confirm Drop-off'}
            </Button>
          </div>
        )}
      </Card>

      <div className="flex flex-1 gap-6 min-h-0">
        <div className="flex-[3] flex flex-col bg-card rounded-xl border border-base-border shadow-sm overflow-hidden transition-colors">
          <div className="p-4 border-b border-base-border flex justify-between items-center bg-page/50">
            <h3 className="font-bold text-card-title tracking-tight">2D Storage Visualization</h3>
            {movementSource && (
              <div className="flex items-center gap-3 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/40 border border-primary-100 dark:border-primary-800 rounded-full text-xs font-bold text-primary-800 dark:text-primary-200 animate-pulse">
                <span>Moving: {movementSource.lpn.lpnid}</span>
                <div className="w-px h-3 bg-primary-200 dark:bg-primary-700" />
                <span>Assign to:</span>
                <select 
                  value={assignedWorkerId}
                  onChange={(e) => setAssignedWorkerId(Number(e.target.value))}
                  className="bg-card border border-primary-200 dark:border-primary-700 rounded px-1 text-base-text text-[10px]"
                >
                  <option value={0}>Choose Worker...</option>
                  {employees.filter(e => 
                    e.role === EmployeeRole.Worker || 
                    e.role === 1 || 
                    String(e.role).toLowerCase() === 'worker'
                  ).map(emp => (
                    <option key={emp.employeeID} value={emp.employeeID}>{emp.name}</option>
                  ))}
                </select>
                <button onClick={() => { setMovementSource(null); setAssignedWorkerId(0); }} className="hover:text-red-600 transition-colors">✕</button>
              </div>
            )}
          </div>

          <div className="flex-1 relative bg-page transition-colors">
            <svg width="100%" height="100%" viewBox="0 0 1000 600" className="drop-shadow-sm">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" className="text-base-border/30" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {shelves.map(shelf => {
                const isSelected = selectedShelf?.shelfID === shelf.shelfID;
                const isManagerSource = movementSource?.bin.shelfID === shelf.shelfID;
                const isWorkerPickup = activeTaskSourceShelf === shelf.shelfID;
                const isWorkerDropoff = activeTaskDestShelf === shelf.shelfID;

                const hasOtherTask = workOrders.some(wo => 
                  wo.status !== WorkOrderStatus.Completed && 
                  (getShelfIdFromBinId(wo.fromBinID) === shelf.shelfID || getShelfIdFromBinId(wo.toBinID) === shelf.shelfID)
                );


                let strokeColor = isSelected ? '#f97316' : '#a8a29e'; 
                let strokeWidth = isSelected ? "3" : "1.5";
                let fillColor = isSelected ? '#ffedd5' : (shelf.isLoadingDock ? '#fff7ed' : '#ffffff');

                const isDarkMode = document.documentElement.classList.contains('dark');
                if (isDarkMode) {
                   fillColor = isSelected ? '#431407' : (shelf.isLoadingDock ? '#292524' : '#1c1917');
                   strokeColor = isSelected ? '#fb923c' : '#44403c';
                }

                if (isManagerSource || isWorkerPickup) { 
                  strokeColor = '#ea580c'; 
                  strokeWidth = "3"; 
                  fillColor = isDarkMode ? '#431407' : '#fff7ed'; 
                }
                else if (isWorkerDropoff) { 
                  strokeColor = '#f97316'; 
                  strokeWidth = "3"; 
                  fillColor = isDarkMode ? '#431407' : '#fff7ed'; 
                }
                else if (hasOtherTask) { 
                  strokeColor = '#10b981'; 
                }

                return (
                  <g key={shelf.shelfID} onClick={() => handleShelfClick(shelf)} className="cursor-pointer transition-all">
                    <rect 
                      x={shelf.x} y={shelf.y} width={shelf.width} height={shelf.height} 
                      fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} 
                      rx="8" className="transition-all duration-300"
                    />
                    <text 
                      x={shelf.x + shelf.width / 2} y={shelf.y + shelf.height / 2} 
                      textAnchor="middle" dominantBaseline="middle" 
                      className={`text-[10px] font-black transition-colors ${shelf.isLoadingDock ? 'fill-primary-700 dark:fill-primary-400' : 'fill-muted-text dark:fill-slate-400'}`}
                    >
                      {shelf.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="flex-1 min-w-[320px] overflow-y-auto pr-1">
          {selectedShelf ? (
            <Card padding="md" className="h-full flex flex-col transition-colors">
              <div className="border-b border-base-border pb-4 mb-6 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-black text-card-title tracking-tight">{selectedShelf.label}</h3>
                  <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest">
                    {selectedShelf.isLoadingDock ? 'Loading Dock' : 'Standard Shelf'}
                  </span>
                </div>
                {currentUser?.role === EmployeeRole.Manager && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingShelf(!isEditingShelf)}>
                    {isEditingShelf ? 'Cancel' : 'Edit'}
                  </Button>
                )}
              </div>
              
              {isEditingShelf ? (
                <div className="space-y-4 p-4 bg-page rounded-lg border border-base-border transition-colors">
                  <h4 className="text-[10px] font-black text-muted-text uppercase tracking-widest">Shelf Settings</h4>
                  <div className="space-y-3">
                    <Input label="Label" value={editShelfLabel} onChange={e => setEditShelfLabel(e.target.value)} />
                    <div className="flex gap-2">
                      <Input label="X" type="number" value={editShelfX} onChange={e => setEditShelfX(Number(e.target.value))} />
                      <Input label="Y" type="number" value={editShelfY} onChange={e => setEditShelfY(Number(e.target.value))} />
                    </div>
                    <Button fullWidth onClick={handleUpdateShelf}>Save Changes</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                  {(selectedShelf.bins ?? []).map(bin => {
                    const isTaskTarget = bin.binID === activeTaskBinID;
                    
                    return (
                      <div key={bin.binID} 
                        onClick={() => setSelectedBin(bin)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          isTaskTarget 
                            ? "border-primary-500 bg-primary-500/10 shadow-md ring-2 ring-primary-500/20" 
                            : selectedBin?.binID === bin.binID 
                              ? "bg-primary-500/5 border-primary-400" 
                              : "bg-card border-base-border hover:border-primary-300"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isTaskTarget ? 'text-primary-600' : 'text-muted-text'}`}>
                              BIN #{bin.position}
                            </span>
                            {isTaskTarget && (
                              <span className="flex h-2 w-2 rounded-full bg-primary-600 animate-pulse" />
                            )}
                          </div>
                          {movementSource && currentUser?.role === EmployeeRole.Manager && (
                            <Button size="sm" variant="primary" className="h-7 text-[10px]" onClick={(e) => { e.stopPropagation(); handleCreateWorkOrder(bin); }}>
                              Set Dest
                            </Button>
                          )}
                        </div>

                      <div className="space-y-2">
                        {(bin.lpNs ?? []).length > 0 ? (
                          (bin.lpNs ?? []).map(lpn => (
                            <div key={lpn.lpnid} className="bg-page p-3 rounded-lg border border-base-border shadow-sm">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-black text-base-text">{lpn.lpnid}</span>
                                {currentUser?.role === EmployeeRole.Manager && !movementSource && (
                                  <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={(e) => { e.stopPropagation(); setMovementSource({ bin, lpn }); }}>
                                    Move
                                  </Button>
                                )}
                              </div>
                              {(lpn.contents ?? []).map(content => (
                                <div key={content.lpnContentID} className="text-[10px] text-muted-text">
                                  {content.product?.name} x {content.quantity}
                                </div>
                              ))}
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-muted-text italic text-center py-2">Empty Bin</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center text-center p-8 transition-colors">
              <div className="w-16 h-16 bg-primary-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-xl font-bold text-primary-300 mb-6">WMS</div>
              <h4 className="text-base-text font-black mb-2 tracking-tight">Warehouse Ready</h4>
              <p className="text-sm text-muted-text mb-8 max-w-[200px]">Select a storage shelf on the map to view contents.</p>
              
              {currentUser?.role === EmployeeRole.Manager && (
                <div className="w-full pt-8 border-t border-base-border space-y-4">
                  <h4 className="text-[10px] font-black text-muted-text uppercase tracking-widest text-left">Management</h4>
                  {isAddingShelf ? (
                    <div className="space-y-3">
                      <Input label="Label" value={newShelfLabel} onChange={e => setNewShelfLabel(e.target.value)} />
                      <select className="w-full p-2 text-sm border border-base-border rounded bg-card text-base-text" value={newShelfType} onChange={e => setNewShelfType(e.target.value as any)}>
                        <option value="Standard">Standard</option>
                        <option value="Dock">Loading Dock</option>
                      </select>
                      <div className="flex gap-2">
                        <Button size="sm" fullWidth onClick={handleAddShelf}>Create</Button>
                        <Button size="sm" fullWidth variant="secondary" onClick={() => setIsAddingShelf(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button fullWidth variant="secondary" onClick={() => setIsAddingShelf(true)}>+ Add New Area</Button>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
