
export interface AudioFile {
  id: string;
  name: string;
  duration: number; // Changed from string to number
  type: string;
  created: string;
  url?: string;
  reference?: string;
}
