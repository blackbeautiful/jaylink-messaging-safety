
export interface UploadButtonProps {
  onChange?: (files: File[]) => void;
  onUpload?: (name: string, file: File) => void;
  isUploading?: boolean;
}
