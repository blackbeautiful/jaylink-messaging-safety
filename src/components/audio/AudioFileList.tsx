
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause, Edit, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AudioFile {
  id: string;
  name: string;
  duration: string;
  size: string;
  created: string;
  type: string;
}

interface AudioFileListProps {
  audioFiles: AudioFile[];
  onDeleteAudio: (id: string) => void;
}

const AudioFileList = ({ audioFiles, onDeleteAudio }: AudioFileListProps) => {
  const [playingId, setPlayingId] = useState<string | null>(null);

  const togglePlayPause = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <ScrollArea className="h-[400px] md:h-auto w-full">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-[100px]">Duration</TableHead>
                <TableHead className="hidden sm:table-cell w-[100px]">Size</TableHead>
                <TableHead className="hidden md:table-cell w-[150px]">Created</TableHead>
                <TableHead className="hidden sm:table-cell w-[100px]">Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audioFiles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-gray-500"
                  >
                    No audio files found. Upload or record an audio file to get started.
                  </TableCell>
                </TableRow>
              ) : (
                audioFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">{file.name}</TableCell>
                    <TableCell className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full mr-2 text-gray-500 hover:text-gray-700"
                        onClick={() => togglePlayPause(file.id)}
                      >
                        {playingId === file.id ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                      {file.duration}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{file.size}</TableCell>
                    <TableCell className="hidden md:table-cell">{file.created}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          file.type === "upload"
                            ? "bg-blue-100 text-blue-800"
                            : file.type === "recording"
                            ? "bg-green-100 text-green-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {file.type === "upload"
                          ? "Uploaded"
                          : file.type === "recording"
                          ? "Recording"
                          : "TTS"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDeleteAudio(file.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
};

export default AudioFileList;
