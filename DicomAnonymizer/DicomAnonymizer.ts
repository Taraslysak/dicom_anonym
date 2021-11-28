import { DataSet, parseDicom } from 'dicom-parser';
import { dataDictionary } from './dataDictionary';
import { listAnonymizedTags } from './listAnonymizedTags';

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
      if (!(tag in listAnonymizedTags)) {
        console.log(`...skip ${tag}:${vr} [${name}]`);
        continue;
      }

      console.log(`Name: [${name}]`);

      if (vr in handler) {
        handler[vr](dicom, dataOffset, length);
      } else {
        console.warn(`Unknown vr:[${vr}]`);
      }
    }
    return dicom.byteArray;
  };
}

const loadString8 = (
  byteArr: Uint8Array,
  offset: number,
  length: number
): string => {
  if (length <= 0) {
    return '';
  }
  const bytes = byteArr.slice(offset, offset + length);
  let retVal: string = '';
  for (const c of bytes) {
    retVal += String.fromCharCode(c);
  }
  return retVal;
};

const handler: {
  [vr: string]: (dicom: DataSet, offset: number, length?: number) => void;
} = {
  PN: (dicom: DataSet, offset: number, length?: number) => {
    const value = loadString8(dicom.byteArray, offset, length);
    // if (length > 0) value = dicom.string(element);
    console.log(`Origin Value: [PN][${value}]`);
  },
};
