/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_GOOGLE_MAPS_API_KEY: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Declaraciones para archivos JSON
declare module "*.json" {
  const value: any;
  export default value;
}
