export interface Category {
    categoryId: string;
    name: string;
    prefix: string;
    color: string;
}

export type TicketStatus = 'EN_ATTENTE' | 'APPELE' | 'CALLING' | 'EN_TRAITEMENT' | 'PROCESSING' | 'ISOLE' | 'TRANSFERE' | 'COMPLETE' | 'ANNULE';
export type FormFieldValue = string | number | boolean | null;
export type TicketFormData = Record<string, FormFieldValue | undefined>;

export interface Ticket {
    ticketId: string;
    ticketNumber: string;
    siteId: string;
    categoryId?: string;
    currentStepId?: string;
    status: TicketStatus;
    
    // Identification Logistique
    driverName?: string;
    driverPhone?: string;
    licensePlate?: string;
    orderNumber?: string;
    companyName?: string;
    
    // Pesage
    weightIn?: number;
    weightOut?: number;
    priority: number;
    recallCount: number;
    
    // Chronométrie
    arrivedAt: string;
    calledAt?: string;
    startedAt?: string;
    completedAt?: string;
    updatedAt: string;
    calledBy?: string;
    quaiId?: string;
    isTransferred?: boolean;

    // Relations
    category?: Category;
    site?: { siteId: string; name: string };
    currentStep?: WorkflowStep;
    queue?: Queue;
    vehicleInfo?: TicketVehicleInfo;
    logistic?: TicketLogistic;
}

export interface TicketVehicleInfo {
    licensePlate: string;
    driverName: string;
    driverPhone?: string;
    companyName?: string;
}

export interface TicketLogistic {
    orderNumber?: string;
    qrCode?: string;
    printedCount?: number;
    grossWeight?: number;
    tareWeight?: number;
    netWeight?: number;
    plannedQuantity?: number;
    loadedQuantity?: number;
    loadingInstructions?: string;
    loadingStartedAt?: string;
    loadingEndedAt?: string;
}

export interface Queue {
    queueId: string;
    name: string;
    siteId?: string;
    type?: string;
    isActived?: boolean;
    isActive?: boolean;
}

export interface WorkflowStep {
    stepId: string;
    workflowId: string;
    queueId?: string | null; // Obsolete, use queues
    name: string;
    code?: string;
    stepCode: string;
    order?: number;
    orderNumber?: number;
    formConfig: FormFieldConfig[];
    isolationAfterRecalls: number;
    isInitial?: boolean;
    isFinal?: boolean;
    queue?: Queue;
    queues?: Queue[];
}

export interface FormFieldOption {
    label: string;
    value: string | number | boolean;
}

export interface FormFieldConfig {
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'checkbox' | 'weight_in' | 'weight_out';
    required?: boolean;
    options?: FormFieldOption[];
    placeholder?: string;
    defaultValue?: FormFieldValue;
}

export interface Workflow {
    workflowId: string;
    name: string;
    description?: string;
    isActived: boolean;
    createdAt: string;
    steps?: WorkflowStep[];
    sites?: { siteId: string; name: string; code: string }[];
}
export interface TicketActionLog {
    logId: string;
    ticketId: string;
    stepId: string;
    actionType: 'APPEL' | 'RAPPEL' | 'COMMENCER' | 'TERMINER' | 'ISOLER' | 'PESEE_ENTREE' | 'PESEE_SORTIE' | 'IMPRESSION' | 'TRANSFERE' | 'PRIORITY_SET' | 'ANNULER';
    agentId?: string;
    quaiId?: string;
    formData?: Record<string, unknown>;
    occurredAt: string;
    agent?: {
        username: string;
        firstName?: string;
        lastName?: string;
    };
    step?: WorkflowStep;
}

export interface TicketFullHistory {
    ticket: Ticket;
    history: TicketActionLog[];
}

export interface QuaiConfigResponse {
    label: string;
    expectedStepCode?: string;
    formConfig: FormFieldConfig[];
}

export interface StepCompletionResult {
    moved?: boolean;
    completed?: boolean;
    nextStep?: WorkflowStep;
}

export interface TicketProcessResponse {
    ticket: Ticket;
    formConfig: FormFieldConfig[];
}

export interface TicketCompletionResponse {
    ticket: Ticket;
    result: StepCompletionResult;
}

export interface QueueStatusEntry {
    queueId: string;
    name: string;
    waiting: number;
    processing: number;
    completed: number;
}

export interface SocketTicketEventPayload {
    event?: string;
    ticket?: Ticket;
}
