
export interface AudioFileListProps {
  files: {
    id: string;
    name: string;
    duration: number;
    type: string;
    created: string;
  }[];
  onDelete: (id: string) => void;
}
