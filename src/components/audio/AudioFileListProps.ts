
import { AudioFile } from "@/types/audio";

export interface AudioFileListProps {
  files: AudioFile[];
  selectedId?: string | null;
  onSelect?: (file: AudioFile) => void;
  onDelete?: (id: string) => void;
}
