import fs from 'fs';
import JSZip, { file } from 'jszip';
import dicomParser from 'dicom-parser';
import DicomAnonymizer from '../DicomAnonymizer/DicomAnonymizer';
import { listAnonymizedTags } from '../DicomAnonymizer/listAnonymizedTags';
describe('Dicom Anonymizer', () => {
  test('should be able to anonymize Dicom file', async () => {
    const buffer = await prepareUint8Array();
    const initialDicom = dicomParser.parseDicom(buffer);
    const anonymizer = new DicomAnonymizer(buffer);
    const newBuffer = anonymizer.anonymize();
    const anonymizedDicom = dicomParser.parseDicom(newBuffer);
    expect(anonymizedDicom).toBeTruthy();
    expect(anonymizedDicom.string('x00100010')).not.toBe(
      initialDicom.string('x00100010')
    );
    expect(anonymizedDicom.string('x00100020')).not.toBe(
      initialDicom.string('x00100020')
    );
    for (const element in initialDicom.elements) {
      if (element in listAnonymizedTags) {
        const initDesc = initialDicom.elements[element];
        if (initDesc.length > 0) {
          const anonDesc = anonymizedDicom.elements[element];
          expect(initDesc).toEqual(anonDesc);
          const initBytes = initialDicom.byteArray.slice(
            initDesc.dataOffset,
            initDesc.dataOffset + initDesc.length
          );
          const anonBytes = anonymizedDicom.byteArray.slice(
            anonDesc.dataOffset,
            anonDesc.dataOffset + anonDesc.length
          );
          expect(initBytes).not.toEqual(anonBytes);
        }
      }
    }
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
