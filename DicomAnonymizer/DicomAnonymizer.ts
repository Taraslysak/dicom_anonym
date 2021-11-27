import { DataSet, parseDicom } from 'dicom-parser';

export default class DicomAnonymizer {
  constructor(private originBuffer: Uint8Array) {}

  anonymize = (): Uint8Array => {
    const dicom: DataSet = parseDicom(this.originBuffer);
    for (const element in dicom.elements) {
      const v = dicom.string(element);
      const { tag, vr, length, dataOffset } = dicom.elements[element];

      console.log(v);
    }
    return dicom.byteArray;
  };
}
