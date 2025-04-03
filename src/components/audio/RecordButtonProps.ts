
export interface RecordButtonProps {
  onRecordingComplete?: (blob: Blob, duration: number, name: string) => void;
}
