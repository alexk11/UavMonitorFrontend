export interface UavFailureStep {
  id: number;
  failureId: number;
  recordId: number;
  uavId: string;
  date: string;
  contactPerson: string;
  importance: string
  description: string;
}
