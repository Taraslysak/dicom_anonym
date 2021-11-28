import { DataSet, parseDicom } from "dicom-parser";
import { dataDictionary } from "./dataDictionary";
import { listAnonymizedTags } from "./listAnonymizedTags";

const charSet8: Uint8Array = new Uint8Array(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    .split("")
    .map((char) => char.charCodeAt(0))
);

export default class DicomAnonymizer {
  private originBuffer: Uint8Array;
  constructor(originBuffer: Uint8Array) {
    this.originBuffer = Uint8Array.from(originBuffer);
  }

  anonymize = (): Uint8Array => {
    const dicom: DataSet = parseDicom(this.originBuffer);
    for (const element in dicom.elements) {
      const { tag, vr, length, dataOffset } = dicom.elements[element];
      const description = dataDictionary[tag];
      let name = "???";
      let vm = "???";
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

      if (vr in handler && length) {
        handler[vr](dicom, dataOffset, length);
        console.log(dicom.string(tag));
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
    return "";
  }
  const bytes = byteArr.slice(offset, offset + length);
  let retVal: string = "";
  for (const c of bytes) {
    retVal += String.fromCharCode(c);
  }
  return retVal;
};

const getRandomUint8CharArray = (length: number): number[] => {
  let randomValue: number[] = [];
  for (const _ of new Array(length)) {
    randomValue.push(getRandomChar());
  }
  return randomValue;
};

const getRandomChar = (): number => {
  return charSet8[Math.floor(Math.random() * charSet8.length)];
};

const handler: {
  [vr: string]: (dicom: DataSet, offset: number, length?: number) => void;
} = {
  PN: (dicom: DataSet, offset: number, length: number = 0) => {
    for (let position = 0; position < length; position++) {
      dicom.byteArray[offset + position] = getRandomChar();
    }
  },
  IS: (dicom: DataSet, offset: number, length: number = 0) => {
    const value = loadString8(dicom.byteArray, offset, length);
    console.log(value);
  },
  UL: (dicom: DataSet, offset: number, length: number = 0) => {
    const value = loadString8(dicom.byteArray, offset, length);
    console.log(value);
  },
  LO: (dicom: DataSet, offset: number, length: number = 0) => {
    const value = loadString8(dicom.byteArray, offset, length);
    console.log(value);
    for (let position = 0; position < length; position++) {
      dicom.byteArray[offset + position] = getRandomChar();
    }
  },
};
