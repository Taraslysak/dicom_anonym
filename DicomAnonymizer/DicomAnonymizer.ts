import { DataSet, parseDicom } from 'dicom-parser';

export default class DicomAnonymizer {
  constructor(private originBuffer: Uint8Array) {}

  anonymize = (): Uint8Array => {
    const dicom: DataSet = parseDicom(this.originBuffer);
    return dicom.byteArray;
  };
}
