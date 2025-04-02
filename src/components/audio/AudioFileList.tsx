
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
import { AudioFileListProps } from "./AudioFileListProps";

const AudioFileList = ({ files = [], onDelete }: AudioFileListProps) => {
  const [playingId, setPlayingId] = useState<string | null>(null);

  const togglePlayPause = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
    }
  };

  // Mobile card view for each audio file
  const MobileAudioCard = ({ file }: { file: any }) => (
    <div className="border rounded-lg p-4 mb-3 bg-white dark:bg-gray-800">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-gray-900 dark:text-white truncate max-w-[70%]">{file.name}</h3>
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
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full mr-2 text-gray-500 hover:text-gray-700"
            onClick={() => togglePlayPause(file.id)}
          >
            {playingId === file.id ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">{file.duration} sec</span>
        </div>
        
        <div className="text-xs text-gray-500">{file.created}</div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete && onDelete(file.id)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Mobile view - card layout */}
      <div className="md:hidden p-3">
        <ScrollArea className="h-[400px] w-full">
          {!files || files.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-center text-gray-500 p-4">
              No audio files found. Upload or record an audio file to get started.
            </div>
          ) : (
            files.map((file) => (
              <MobileAudioCard key={file.id} file={file} />
            ))
          )}
        </ScrollArea>
      </div>

      {/* Desktop view - table layout */}
      <div className="hidden md:block">
        <ScrollArea className="h-[500px] w-full">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[100px]">Duration</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[150px]">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!files || files.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-gray-500"
                    >
                      No audio files found. Upload or record an audio file to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="font-medium truncate max-w-[200px]">
                        {file.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
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
                          <span className="whitespace-nowrap">{file.duration} sec</span>
                        </div>
                      </TableCell>
                      <TableCell>
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
                      <TableCell>{file.created}</TableCell>
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
                            <DropdownMenuItem onClick={() => onDelete && onDelete(file.id)} className="text-red-600">
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
    </div>
  );
};

export default AudioFileList;
