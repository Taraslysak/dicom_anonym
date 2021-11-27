import { DataSet, parseDicom } from 'dicom-parser';
import { dataDictionary } from './dataDictionary';

export default class DicomAnonymizer {
  constructor(private originBuffer: Uint8Array) {}

  anonymize = (): Uint8Array => {
    const dicom: DataSet = parseDicom(this.originBuffer);
    for (const element in dicom.elements) {
      const { tag, vr, length, dataOffset } = dicom.elements[element];
      const description = dataDictionary[tag];
      let name = '???';
      let vm = '???';
      if (description) {
        name = description.name;
        vm = description.vm;
      } else {
        console.warn(`[${vr}] Unknown tag:[${tag}]`);
      }

      switch (vr) {
        case 'PN': {
          let value = '';
          if (length > 0) value = dicom.string(element);
          console.log(`[${vr}] ${name}:[${value}]`);
        }
        default: {
          console.warn(`Skip vr:[${vr}]`);
        }
      }
    }
    return dicom.byteArray;
  };
}
