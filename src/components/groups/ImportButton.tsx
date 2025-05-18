// src/components/groups/ImportButton.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export interface ImportButtonProps {
  onImport: (file: File) => void;
}

const ImportButton = ({ onImport }: ImportButtonProps) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (file) {
      onImport(file);
      setOpen(false);
      setFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
          <DialogDescription>
            Upload a CSV file with your contacts
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Upload className="mx-auto h-10 w-10 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-500">
                Click to select file
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">CSV files only</p>
            </div>
            {file && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: {file.name}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file}>
            Import Contacts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportButton;
