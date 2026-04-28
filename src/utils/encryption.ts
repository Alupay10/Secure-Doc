import nacl from 'tweetnacl';

export interface EncryptionMetadata {
  key: string;
  nonce: string;
}

export interface EncryptedFilePayload {
  blob: Blob;
  metadata: EncryptionMetadata;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
};

export const base64ToBytes = (value: string): Uint8Array => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

export const encodeEncryptionMetadata = (metadata: EncryptionMetadata): string => {
  return JSON.stringify(metadata);
};

export const decodeEncryptionMetadata = (value?: string | null): EncryptionMetadata | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<EncryptionMetadata>;
    if (!parsed.key || !parsed.nonce) {
      return null;
    }

    return {
      key: parsed.key,
      nonce: parsed.nonce,
    };
  } catch {
    return null;
  }
};

export const encryptBytes = async (input: ArrayBuffer): Promise<EncryptedFilePayload> => {
  const key = nacl.randomBytes(nacl.secretbox.keyLength);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const message = new Uint8Array(input);
  const encrypted = nacl.secretbox(message, nonce, key);

  if (!encrypted) {
    throw new Error('Failed to encrypt file');
  }

  return {
    blob: new Blob([encrypted], { type: 'application/octet-stream' }),
    metadata: {
      key: bytesToBase64(key),
      nonce: bytesToBase64(nonce),
    },
  };
};

export const encryptFile = async (file: File): Promise<EncryptedFilePayload> => {
  const buffer = await file.arrayBuffer();
  return encryptBytes(buffer);
};

export const decryptBytes = async (
  input: ArrayBuffer,
  metadata: EncryptionMetadata
): Promise<ArrayBuffer> => {
  const key = base64ToBytes(metadata.key);
  const nonce = base64ToBytes(metadata.nonce);
  const cipher = new Uint8Array(input);
  const decrypted = nacl.secretbox.open(cipher, nonce, key);

  if (!decrypted) {
    throw new Error('Failed to decrypt file');
  }

  return decrypted.buffer.slice(decrypted.byteOffset, decrypted.byteOffset + decrypted.byteLength);
};

export const decryptBlob = async (
  blob: Blob,
  metadata: EncryptionMetadata
): Promise<Blob> => {
  const buffer = await blob.arrayBuffer();
  const decryptedBuffer = await decryptBytes(buffer, metadata);
  return new Blob([decryptedBuffer]);
};

export const blobToText = async (blob: Blob): Promise<string> => {
  return textDecoder.decode(await blob.arrayBuffer());
};

export const textToBlob = (text: string, mimeType = 'text/plain'): Blob => {
  return new Blob([textEncoder.encode(text)], { type: mimeType });
};