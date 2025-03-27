
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Upload, File, Trash2, Play } from "lucide-react";

const AudioUploadForm = () => {
  const [loading, setLoading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadedAudios, setUploadedAudios] = useState([
    { id: "1", name: "Welcome_Message.mp3", size: "256 KB", duration: "15s", date: "2023-05-15" },
    { id: "2", name: "Special_Promo.mp3", size: "512 KB", duration: "30s", date: "2023-05-10" },
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) return;

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      
      // Add new audio to list
      const newAudio = {
        id: Date.now().toString(),
        name: audioFile.name,
        size: `${Math.round(audioFile.size / 1024)} KB`,
        duration: "Unknown",
        date: new Date().toISOString().split('T')[0],
      };
      
      setUploadedAudios([newAudio, ...uploadedAudios]);
      setAudioFile(null);
      
      toast.success("Audio file uploaded successfully!");
    }, 1500);
  };

  const handleDelete = (id: string) => {
    setUploadedAudios(uploadedAudios.filter(audio => audio.id !== id));
    toast.success("Audio file deleted successfully!");
  };

  const handlePlay = (name: string) => {
    toast.info(`Playing ${name}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-subtle"
    >
      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
        Upload Audio Files
      </h2>

      <form onSubmit={handleUpload} className="mb-8">
        <div className="space-y-6">
          <div>
            <Label htmlFor="audioFile">Select Audio File</Label>
            <div className="mt-1 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
              <div className="space-y-2 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                  <label
                    htmlFor="audioFile"
                    className="relative cursor-pointer rounded-md font-medium text-jaylink-600 hover:text-jaylink-700"
                  >
                    <span>Upload an audio file</span>
                    <Input
                      id="audioFile"
                      name="audioFile"
                      type="file"
                      accept="audio/*"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">MP3, WAV up to 10MB</p>
              </div>
            </div>
            {audioFile && (
              <div className="mt-2 flex items-center justify-between p-2 bg-jaylink-50 dark:bg-jaylink-900/20 rounded-lg">
                <div className="flex items-center">
                  <File className="h-5 w-5 text-jaylink-600 dark:text-jaylink-400" />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{audioFile.name}</span>
                </div>
                <span className="text-xs text-gray-500">{Math.round(audioFile.size / 1024)} KB</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-jaylink-600 hover:bg-jaylink-700 flex items-center justify-center"
            disabled={!audioFile || loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload Audio
          </Button>
        </div>
      </form>

      <div>
        <h3 className="font-medium text-lg mb-4 text-gray-900 dark:text-white">Your Audio Files</h3>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploadedAudios.map((audio) => (
                <TableRow key={audio.id}>
                  <TableCell className="font-medium">{audio.name}</TableCell>
                  <TableCell>{audio.size}</TableCell>
                  <TableCell>{audio.duration}</TableCell>
                  <TableCell>{audio.date}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePlay(audio.name)}
                        className="h-8 w-8 text-green-600"
                      >
                        <Play size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(audio.id)}
                        className="h-8 w-8 text-red-600"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {uploadedAudios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                    No audio files uploaded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </motion.div>
  );
};

export default AudioUploadForm;
