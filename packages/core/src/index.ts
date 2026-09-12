// Browser-safe domain exports. Node-only adapters live under "@mtct/core/storage".
export * from "./attention";
export * from "./auth";
export * from "./calendar";
export * from "./diary";
export * from "./grading";
export * from "./intake";
export * from "./mastery";
export * from "./planner";
export * from "./remediation";
export * from "./speech";
// The storage *contract* is plain types, so anything may depend on it; the implementation that
// touches the disk stays behind "@mtct/core/storage".
export type { FileStorage, StoredFile } from "./storage/file-storage";
export * from "./world";
