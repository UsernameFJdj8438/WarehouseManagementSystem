export interface InventoryItem {
  productID: number;
  sku: string;
  name: string;
  description?: string;
  price: number;
  minStockLevel: number;
  totalStock: number;
  unassignedStock: number;
  weight: number;
}

export enum LPNType {
  Pallet = 0,
  Tote = 1,
  Box = 2
}

export interface LPNContent {
  lpnContentID: number;
  lpnid: string;
  productID: number;
  product?: InventoryItem;
  quantity: number;
}

export interface LPN {
  lpnid: string;
  currentBinID?: number;
  type: LPNType;
  weight: number;
  contents: LPNContent[];
}

export interface Bin {
  binID: number;
  shelfID: number;
  position: number;
  maxLPNs: number;
  lpNs: LPN[];
}

export interface Shelf {
  shelfID: number;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  binCount: number;
  isLoadingDock: boolean;
  bins: Bin[];
}

export enum EmployeeRole {
  Manager = 0,
  Worker = 1,
  Customer = 2
}

export interface Employee {
  employeeID: number;
  name: string;
  email?: string;
  role: EmployeeRole;
}

export enum WorkOrderStatus {
  Pending = 0,
  InProgress = 1,
  Completed = 2,
  Cancelled = 3
}

export interface WorkOrder {
  workOrderID: number;
  lpnid: string;
  lpn?: LPN;
  fromBinID: number;
  toBinID: number;
  assignedEmployeeID?: number;
  assignedEmployee?: Employee;
  status: WorkOrderStatus;
  createdAt: string;
  completedAt?: string;
}
