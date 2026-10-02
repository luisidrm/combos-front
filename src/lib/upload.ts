import type { RequestUploadResponse } from '@/store/api/mediaApi';

// Step 2 of the media flow (docs/API.md section 5): POST straight to MinIO,
// not through our API — every presigned `fields` entry first, in order,
// then the file last under "file". Success is a bare 204, no JSON body.
export async function uploadFileToPresignedUrl(
  permission: RequestUploadResponse,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const formData = new FormData();
  for (const [key, value] of Object.entries(permission.fields)) {
    formData.append(key, value);
  }
  formData.append('file', file);

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', permission.url);
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed with status ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(formData);
  });
}
