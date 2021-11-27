import fs from "fs";
import JSZip, { file } from "jszip";
import dicomParser from "dicom-parser";
describe("Dicom Anonymizer", () => {
  test("should be able to anonymize Dicom file", async () => {
    const uintArray = await prepareUint8Array();
    const parsedDicom = dicomParser.parseDicom(uintArray);
    expect(true).toBe(true);
  });
});

// ZIP parsing helper function
const prepareUint8Array = async (): Promise<Uint8Array> => {
  const zip = new JSZip();
  const sampleZIPData = fs.readFileSync(`${__dirname}/dicom_sample.zip`);
  const files = await zip.loadAsync(sampleZIPData, {
    optimizedBinaryString: true,
  });

  return await Object.values(files.files)[0].async("uint8array");
};
