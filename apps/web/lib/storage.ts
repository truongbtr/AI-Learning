import { type FileStorage, LocalFileStorage } from "@mtct/core/storage";

/** FileStorage adapter bound to FILE_ROOT (docs/08 pha 0). MinIO/S3 can replace it later. */
let instance: FileStorage | null = null;

export function fileStorage(): FileStorage {
  instance ??= new LocalFileStorage(process.env.FILE_ROOT ?? "./data/files");
  return instance;
}
