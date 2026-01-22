export interface FailureCommon {
    id: number;
    recordId: number;
    failureType: string;
    uavId: string;
    failureDate: string;
    reporter: string;
    reportedTs: string;
    description: string;
}