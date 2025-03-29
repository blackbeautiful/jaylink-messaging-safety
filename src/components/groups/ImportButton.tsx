
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface ImportButtonProps {
  onImport: () => void;
}

const ImportButton = ({ onImport }: ImportButtonProps) => {
  return (
    <Button 
      variant="outline" 
      onClick={onImport} 
      className="w-full sm:w-auto"
    >
      <Upload className="mr-2 h-4 w-4" />
      Import
    </Button>
  );
};

export default ImportButton;
