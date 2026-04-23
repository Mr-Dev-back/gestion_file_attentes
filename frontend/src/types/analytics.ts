export type DepartmentType = 'INFRA' | 'BATIMENT' | 'ELECTRICITE';

export interface SiteStatus {
  id: string;
  name: string;
  truckCount: number;
  status: 'fluid' | 'busy' | 'congested';
  coordinates: { x: number; y: number }; // Relative coordinates for the SVG map
}

export interface CategoryData {
  category: string;
  count: number;
  site: string;
}

export interface WorkflowStage {
  id: string;
  name: string;
  truckCount: number;
  avgTime: number; // in minutes
  isBottleneck: boolean;
}

export interface ArchiveSearchFilters {
  plaque?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  siteId?: string;
}

export interface TicketArchive {
  id: string;
  plaque: string;
  type: string;
  site: string;
  entryDate: string;
  exitDate: string;
  duration: string;
  status: string;
}
