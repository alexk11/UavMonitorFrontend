export interface UavEngine {
    id: number;
    recordId: number;
    uavId: string;
    engineActiveFrom: string;
    engineActiveTill: string;
    engineOperateDuration: string;
    reporter: string;
    reportedTimestamp: string;
    note: string;
}
