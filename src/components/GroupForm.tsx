
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Save, Trash2, Edit, FileText, Database, Users } from "lucide-react";

const GroupForm = () => {
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    numbers: "",
  });
  const [contactFile, setContactFile] = useState<File | null>(null);
  const [groups, setGroups] = useState([
    {
      id: "1",
      name: "Customers",
      description: "Regular customers",
      count: 125,
      date: "2023-05-10",
    },
    {
      id: "2",
      name: "Employees",
      description: "Company staff",
      count: 42,
      date: "2023-05-15",
    },
    {
      id: "3",
      name: "Vendors",
      description: "Service providers",
      count: 18,
      date: "2023-05-20",
    },
  ]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setContactFile(e.target.files[0]);
      toast.success("Contact file selected");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.name) {
      toast.error("Group name is required");
      setLoading(false);
      return;
    }

    if (!formData.numbers && !contactFile) {
      toast.error("Please add phone numbers or upload a file");
      setLoading(false);
      return;
    }

    setTimeout(() => {
      const newGroup = {
        id: Math.random().toString(36).substring(2, 9),
        name: formData.name,
        description: formData.description,
        count: contactFile 
          ? Math.floor(Math.random() * 100) + 20 
          : formData.numbers.split(",").length,
        date: new Date().toISOString().split("T")[0],
      };

      setGroups([newGroup, ...groups]);
      setFormData({ name: "", description: "", numbers: "" });
      setContactFile(null);
      setLoading(false);
      setOpenDialog(false);
      toast.success("Contact group created successfully");
    }, 1000);
  };

  const handleDeleteGroup = (id: string) => {
    setGroups(groups.filter(group => group.id !== id));
    toast.success("Group deleted successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Contact Groups
        </h2>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="bg-jaylink-600 hover:bg-jaylink-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Create Contact Group</DialogTitle>
              <DialogDescription>
                Create a new group to organize your contacts for bulk messaging
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Customers, Employees, etc."
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Enter a description for this group"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="numbers">Phone Numbers</Label>
                  <Textarea
                    id="numbers"
                    name="numbers"
                    placeholder="Enter phone numbers separated by commas (e.g., 234801234567, 234802345678)"
                    value={formData.numbers}
                    onChange={handleInputChange}
                    className="mt-1"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter numbers in international format without spaces or plus sign
                  </p>
                </div>

                <div className="- my-1 relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">
                      OR
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="contactFile">Upload Contact File</Label>
                  <div className="mt-1 flex items-center space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-20 flex flex-col items-center justify-center border-dashed"
                      onClick={() => document.getElementById("contactFile")?.click()}
                    >
                      <FileText className="h-6 w-6 mb-1 text-gray-400" />
                      <span className="text-sm">
                        {contactFile ? contactFile.name : "Click to upload CSV"}
                      </span>
                      <input
                        id="contactFile"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Upload a CSV file with phone numbers in the first column
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-jaylink-600 hover:bg-jaylink-700">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Group
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Your Contact Groups</CardTitle>
          <CardDescription>
            Manage your saved groups for easy message sending
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Contacts</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-jaylink-500" />
                        {group.name}
                      </div>
                    </TableCell>
                    <TableCell>{group.description}</TableCell>
                    <TableCell className="text-center">{group.count}</TableCell>
                    <TableCell>{group.date}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteGroup(group.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {groups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      <Database className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p>No contact groups found</p>
                      <Button 
                        variant="link" 
                        className="mt-2 text-jaylink-600"
                        onClick={() => setOpenDialog(true)}
                      >
                        Create your first group
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupForm;
