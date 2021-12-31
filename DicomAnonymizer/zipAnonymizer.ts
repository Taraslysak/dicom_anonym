import JSZip from "jszip";
import DicomAnonymizer, { ITableData } from "./DicomAnonymizer";

export enum ProgressStatus {
  IN_PROGRESS,
  FINISH,
  SUCCESS,
  ERROR,
}

export type OnProgress = (
  progress: number,
  status: ProgressStatus,
  error?: string
) => void;

export const anonymizeZip = async (
  zipData: Buffer,
  callback: OnProgress,
  onDataAnonymized: (anonymizedData: ITableData) => void
): Promise<Buffer | Uint8Array | Blob> => {
  const zip = new JSZip();
  //   const newZip = new JSZip();

  try {
    const zipBuf: JSZip = await zip.loadAsync(zipData, {
      optimizedBinaryString: true,
    });

    const { files } = zipBuf;
    let fileNumber = 0;
    for (const key in files) {
      const value = files[key];
      if (!value.dir) {
        fileNumber++;
      }
    }

    let progressFiles: number = 0;
    callback(0, ProgressStatus.IN_PROGRESS);
    for (const key in files) {
      const value = files[key];
      if (!value.dir) {
        const data: Uint8Array = await value.async("uint8array");
        const anonymizer = new DicomAnonymizer(data);
        try {
          const newData = anonymizer.anonymize();
          zip.file(key, newData);
          progressFiles === 0 && onDataAnonymized(anonymizer.anonymizedData);
        } catch (error: any) {
          const message = error.toString();
          if (!message.includes("dicomParser.read")) {
            throw error;
          }
        }
        progressFiles++;
        callback(
          (progressFiles / fileNumber) * 100,
          ProgressStatus.IN_PROGRESS
        );
      }
    }
    callback(100, ProgressStatus.FINISH);
    // const onUpdate = (metadata: any) => {};
    const zipBuffer: Uint8Array = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: {
        level: 3,
      },
    });
    callback(100, ProgressStatus.SUCCESS);
    return zipBuffer;
  } catch (error) {
    callback(0, ProgressStatus.ERROR, error.message);
  }

  return null;
};
