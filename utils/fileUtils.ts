import { Readable } from 'stream';

export async function getContentTypeFromStream(stream: Readable): Promise<string> {
  return new Promise((resolve) => {
    stream.once('readable', () => {
      const chunk = stream.read(12);
      let contentType = 'application/octet-stream';

      if (chunk && chunk.toString('ascii').startsWith('%PDF-')) {
        contentType = 'application/pdf';
      }

      resolve(contentType);
    });
  });
}

export async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}