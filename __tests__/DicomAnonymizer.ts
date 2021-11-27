import fs from 'fs';
import JSZip, { file } from 'jszip';
import dicomParser from 'dicom-parser';
import DicomAnonymizer from '../DicomAnonymizer/DicomAnonymizer';
describe('Dicom Anonymizer', () => {
  test('should be able to anonymize Dicom file', async () => {
    const buffer = await prepareUint8Array();
    const anonymizer = new DicomAnonymizer(buffer);
    const newBuffer = anonymizer.anonymize();
    expect(true).toBe(true);
    expect(dicomParser.parseDicom(newBuffer)).toBeTruthy();
  });
});

// ZIP parsing helper function
const prepareUint8Array = async (): Promise<Uint8Array> => {
  const zip = new JSZip();
  const sampleZIPData: Buffer = fs.readFileSync(
    `${__dirname}/dicom_sample.zip`
  );
  const zipBuf: JSZip = await zip.loadAsync(sampleZIPData, {
    optimizedBinaryString: true,
  });

  return await Object.values(zipBuf.files)[0].async('uint8array');
};
