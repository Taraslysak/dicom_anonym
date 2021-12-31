import { DataSet, parseDicom } from "dicom-parser";
import { dataDictionary } from "./dataDictionary";
import { listAnonymizedTags } from "./listAnonymizedTags";

const charSet8: Uint8Array = new Uint8Array(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 "
    .split("")
    .map((char) => char.charCodeAt(0))
);

const charUpperSet8: Uint8Array = new Uint8Array(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 "
    .split("")
    .map((char) => char.charCodeAt(0))
);

const charNumberSet8: Uint8Array = new Uint8Array(
  "0123456789".split("").map((char) => char.charCodeAt(0))
);

export default class DicomAnonymizer {
  private originBuffer: Uint8Array;
  constructor(originBuffer: Uint8Array) {
    this.originBuffer = Uint8Array.from(originBuffer);
  }
  private _anonymizedData?: ITableData;

  get anonymizedData(): ITableData | undefined {
    return this._anonymizedData;
  }

  anonymize = (): Uint8Array => {
    let vrs = new Set<string>();
    for (const item in listAnonymizedTags) {
      if (item in dataDictionary) {
        const element = dataDictionary[item];
        if (!(element.vr in handler)) {
          if (element.vr === "OB") {
            console.log("OB");
          }
          vrs.add(element.vr);
        }
      }
    }
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
    this._anonymizedData = presentData(dicom);
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
    randomValue.push(getRandomChar8());
  }
  return randomValue;
};

const getRandomChar8 = (): number => {
  return charSet8[Math.floor(Math.random() * charSet8.length)];
};

const getRandomUpperChar8 = (): number => {
  return charUpperSet8[Math.floor(Math.random() * charUpperSet8.length)];
};

const getRandomNumberChar8 = (): number => {
  return charNumberSet8[Math.floor(Math.random() * charNumberSet8.length)];
};

const randomDate = (
  start: Date = new Date(0),
  end: Date = new Date()
): Date => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

const handler: {
  [vr: string]: (dicom: DataSet, offset: number, length?: number) => void;
} = {
  PN: (dicom: DataSet, offset: number, length: number = 0) => {
    for (let position = 0; position < length; position++) {
      dicom.byteArray[offset + position] = getRandomChar8();
    }
  },
  LO: (dicom: DataSet, offset: number, length: number = 0) => {
    const value = loadString8(dicom.byteArray, offset, length);
    console.log(value);
    for (let position = 0; position < length; position++) {
      dicom.byteArray[offset + position] = getRandomChar8();
    }
  },
  CS: (dicom: DataSet, offset: number, length: number = 0) => {
    const value = loadString8(dicom.byteArray, offset, length);
    console.log(value);
    for (let position = 0; position < length; position++) {
      dicom.byteArray[offset + position] = getRandomUpperChar8();
    }
  },
  UI: (dicom: DataSet, offset: number, length: number = 0) => {
    const bytes = dicom.byteArray;
    const value = loadString8(bytes, offset, length);
    for (let position = 0; position < length; position++) {
      const char: number = bytes[position + offset];
      if (char === 0 || String.fromCharCode(char) === ".") continue;
      bytes[offset + position] = getRandomNumberChar8();
    }
    console.log(value);
  },
  DA: (dicom: DataSet, offset: number, length: number = 0) => {
    const value = loadString8(dicom.byteArray, offset, length);
    const d = randomDate();
    const dateStr = `${d.getFullYear()}${d
      .getMonth()
      .toString()
      .padStart(2, "0")}${d.getDate().toString().padStart(2, "0")}`;
    const bytes = dicom.byteArray;
    const size = Math.min(length, dateStr.length);
    for (let i = 0; i < size; i++) {
      bytes[offset + i] = dateStr.charCodeAt(i);
    }
    // console.log(value);
  },
  TM: (dicom: DataSet, offset: number, length: number = 0) => {
    const value = loadString8(dicom.byteArray, offset, length);
    const d = randomDate();
    const timeStr = `${d.getHours().toString().padStart(2, "0")}${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}${d.getSeconds().toString().padStart(2, "0")}.${d
      .getMilliseconds()
      .toString()
      .padStart(6, "0")}`;
    const bytes = dicom.byteArray;
    const size = Math.min(length, timeStr.length);
    for (let i = 0; i < size; i++) {
      bytes[offset + i] = timeStr.charCodeAt(i);
    }
    console.log(value);
  },
  SH: (dicom: DataSet, offset: number, length: number = 0) => {
    // TODO: need verify!
    // const value = loadString8(dicom.byteArray, offset, length);
    for (let position = 0; position < length; position++) {
      dicom.byteArray[offset + position] = getRandomChar8();
    }
  },
  ST: (dicom: DataSet, offset: number, length: number = 0) => {
    // TODO: need verify!
    // const value = loadString8(dicom.byteArray, offset, length);
    for (let position = 0; position < length; position++) {
      dicom.byteArray[offset + position] = getRandomChar8();
    }
  },
  UL: (dicom: DataSet, offset: number, length: number = 0) => {
    // TODO: need implement
  },
  DT: (dicom: DataSet, offset: number, length: number = 0) => {
    // TODO: need implement
  },
  SQ: (dicom: DataSet, offset: number, length: number = 0) => {
    // TODO: need implement
  },
  LT: (dicom: DataSet, offset: number, length: number = 0) => {
    // TODO: need implement
  },
  AS: (dicom: DataSet, offset: number, length: number = 0) => {
    // TODO: need implement
  },
  DS: (dicom: DataSet, offset: number, length: number = 0) => {
    // TODO: need implement
  },
  US: (dicom: DataSet, offset: number, length: number = 0) => {
    // TODO: need implement
  },
  UT: (dicom: DataSet, offset: number, length: number = 0) => {
    // TODO: need implement
  },
  AE: (dicom: DataSet, offset: number, length: number = 0) => {
    // TODO: need implement
  },
  OB: (dicom: DataSet, offset: number, length: number = 0) => {
    // TODO: need verify!
    for (let position = 0; position < length; position++) {
      dicom.byteArray[offset + position] = getRandomChar8();
    }
  },
};

const presentData = (anonymizedDicom: DataSet): ITableData => {
  const sex = anonymizedDicom.string("x00100040");
  const age = anonymizedDicom.string("x00101010");
  const height = anonymizedDicom.string("x00101020");
  const ethnicGroup = anonymizedDicom.string("x00102160");
  const origin = "some";
  const imageComments = anonymizedDicom.string("x00204000");
  const weight = anonymizedDicom.string("x00101030");
  const patientHistory = anonymizedDicom.string("x001021B0");
  // const fileName = bufferedFile.name;

  const dataStructure = Object.keys(anonymizedDicom.elements).map((key) => {
    const tag = dataDictionary[key]?.tag;
    let textCodeDescription = "";

    if (dataDictionary[key]?.tag) {
      if (tag !== undefined) {
        const decodeString = anonymizedDicom.string(tag);

        if (decodeString !== undefined) {
          textCodeDescription = decodeString;
        }
      }
    }

    return {
      [dataDictionary[key]?.name]: textCodeDescription,
    };
  });

  const parsedData: ITableData = {
    // folder,
    sex,
    age,
    height,
    ethnicGroup,
    origin,
    imageComments,
    patientHistory,
    dataStructure,
    // fileName,
    weight,
  };
  return parsedData;
};
export interface ITableData {
  // folder: string
  sex: string;
  age: string;
  height: string;
  ethnicGroup: string;
  origin: string;
  imageComments: string;
  patientHistory: string;
  dataStructure: {
    [x: string]: string;
  }[];
  // fileName: string
  weight: string;
}
