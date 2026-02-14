
// Auto-generated embedded assets module
// This file is generated during build and should not be edited manually
// Reset for dev mode - will be populated during production build

export interface EmbeddedAsset {
  content: string; // base64 encoded
  mimeType: string;
}

export const embeddedAssets: Record<string, EmbeddedAsset> = {};

export const manifest = {};

export const getAsset = (path: string): EmbeddedAsset | undefined => {
  return embeddedAssets[path];
};

export const decodeAsset = (asset: EmbeddedAsset): Buffer => {
  return Buffer.from(asset.content, 'base64');
};
