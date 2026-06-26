// src/services/index.ts
// Barrel exports for OttoCommand services.
// (Removed the dead mock-agent layer — predictive-engine / automation-rules /
//  tool-executor — which simulated tool execution off ../data/mock and was
//  imported nowhere. Live orchestration runs in otto-q-core via otto-q-api.ts.)

export { FleetSchedulingService } from "./scheduling";
