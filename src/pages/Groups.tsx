
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { Upload, MoreVertical, Users, Send, Edit, Trash2, Download } from "lucide-react";
import { motion } from "framer-motion";

// Define schemas
const newGroupSchema = z.object({
  name: z.string().min(2, { message: "Group name must be at least 2 characters" }),
  description: z.string().optional(),
  numbers: z.string().min(1, { message: "Please enter at least one phone number" }),
});

const csvUploadSchema = z.object({
  name: z.string().min(2, { message: "Group name must be at least 2 characters" }),
  description: z.string().optional(),
  csvFile: z.instanceof(FileList).refine((files) => files.length > 0, {
    message: "Please upload a CSV file",
  }),
});

type NewGroupFormValues = z.infer<typeof newGroupSchema>;
type CsvUploadFormValues = z.infer<typeof csvUploadSchema>;

// Mock data for contact groups
const mockGroups = [
  {
    id: "1",
    name: "Customers",
    description: "All active customers",
    count: 156,
    createdAt: "2023-05-12",
  },
  {
    id: "2",
    name: "Employees",
    description: "Company staff",
    count: 34,
    createdAt: "2023-05-10",
  },
  {
    id: "3",
    name: "Partners",
    description: "Business partners and vendors",
    count: 27,
    createdAt: "2023-05-08",
  },
  {
    id: "4",
    name: "Newsletter Subscribers",
    description: "Newsletter subscription list",
    count: 892,
    createdAt: "2023-05-06",
  },
];

const Groups = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [groups, setGroups] = useState(mockGroups);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState<"new" | "upload" | null>(null);

  // Forms
  const newGroupForm = useForm<NewGroupFormValues>({
    resolver: zodResolver(newGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      numbers: "",
    },
  });

  const csvUploadForm = useForm<CsvUploadFormValues>({
    resolver: zodResolver(csvUploadSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Handle new group form submission
  const onSubmitNewGroup = async (data: NewGroupFormValues) => {
    try {
      setIsSubmitting(true);
      console.log("Creating new group:", data);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Count the number of phone numbers (separated by commas, newlines or spaces)
      const count = data.numbers.split(/[,\n\s]+/).filter(n => n.trim()).length;
      
      // Add new group to the list
      const newGroup = {
        id: Math.random().toString(36).substr(2, 9),
        name: data.name,
        description: data.description || "",
        count,
        createdAt: new Date().toISOString().split('T')[0],
      };
      
      setGroups([newGroup, ...groups]);
      
      toast({
        title: "Group created",
        description: `${data.name} has been created with ${count} contacts`,
      });
      
      newGroupForm.reset();
      setOpenDialog(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create group",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle CSV upload form submission
  const onSubmitCSVUpload = async (data: CsvUploadFormValues) => {
    try {
      setIsSubmitting(true);
      console.log("Uploading CSV:", data);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add new group to the list with random count (in a real app, this would be the actual count from the CSV)
      const newGroup = {
        id: Math.random().toString(36).substr(2, 9),
        name: data.name,
        description: data.description || "",
        count: Math.floor(Math.random() * 100) + 50, // Random count for demo
        createdAt: new Date().toISOString().split('T')[0],
      };
      
      setGroups([newGroup, ...groups]);
      
      toast({
        title: "Group created from CSV",
        description: `${data.name} has been created with ${newGroup.count} contacts`,
      });
      
      csvUploadForm.reset();
      setOpenDialog(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to upload CSV",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle group deletion
  const deleteGroup = (id: string) => {
    const groupToDelete = groups.find(group => group.id === id);
    if (groupToDelete) {
      setGroups(groups.filter(group => group.id !== id));
      toast({
        title: "Group deleted",
        description: `${groupToDelete.name} has been deleted`,
      });
    }
  };

  // Handler for "Send SMS to Group" action
  const sendSMSToGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      console.log(`Sending SMS to group: ${group.name}`);
      // Navigate to send SMS page with this group pre-selected
      window.location.href = `/send-sms?group=${groupId}`;
    }
  };

  return (
    <DashboardLayout title="Contact Groups" backLink="/dashboard">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Contact Groups
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Organize and manage your contacts for bulk messaging
            </p>
          </div>
          
          <div className="flex gap-3">
            <Dialog open={openDialog === "upload"} onOpenChange={(open) => setOpenDialog(open ? "upload" : null)}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span>Upload CSV</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Import contacts from CSV</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file with contact numbers to create a new group
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...csvUploadForm}>
                  <form onSubmit={csvUploadForm.handleSubmit(onSubmitCSVUpload)} className="space-y-6 py-4">
                    <FormField
                      control={csvUploadForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Customers" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={csvUploadForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief description of this group" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={csvUploadForm.control}
                      name="csvFile"
                      render={({ field: { value, onChange, ...fieldProps } }) => (
                        <FormItem>
                          <FormLabel>CSV File</FormLabel>
                          <FormControl>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                              <Input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                id="contact-csv-file"
                                onChange={(event) => {
                                  onChange(event.target.files);
                                }}
                                {...fieldProps}
                              />
                              <label htmlFor="contact-csv-file" className="cursor-pointer w-full flex flex-col items-center gap-2">
                                <Upload className="h-8 w-8 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {value && value.length > 0 ? value[0].name : 'Click to upload CSV file'}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  CSV file with a column for phone numbers
                                </span>
                              </label>
                            </div>
                          </FormControl>
                          <FormDescription>
                            <a 
                              href="/sample-contacts.csv" 
                              className="text-jaylink-600 hover:text-jaylink-700"
                              download
                            >
                              Download sample CSV template
                            </a>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpenDialog(null)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        className="bg-jaylink-600 hover:bg-jaylink-700"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Uploading..." : "Upload and Create Group"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={openDialog === "new"} onOpenChange={(open) => setOpenDialog(open ? "new" : null)}>
              <DialogTrigger asChild>
                <Button className="bg-jaylink-600 hover:bg-jaylink-700">
                  Create New Group
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create a New Contact Group</DialogTitle>
                  <DialogDescription>
                    Create a new group to organize your contacts
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...newGroupForm}>
                  <form onSubmit={newGroupForm.handleSubmit(onSubmitNewGroup)} className="space-y-6 py-4">
                    <FormField
                      control={newGroupForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Customers" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={newGroupForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief description of this group" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={newGroupForm.control}
                      name="numbers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Numbers</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter phone numbers - one per line or comma-separated" 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Enter each number on a new line or separate with commas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpenDialog(null)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        className="bg-jaylink-600 hover:bg-jaylink-700"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Creating..." : "Create Group"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Groups Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-subtle">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
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
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-jaylink-600" />
                        {group.name}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {group.description}
                    </TableCell>
                    <TableCell className="text-center">{group.count}</TableCell>
                    <TableCell>{group.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => sendSMSToGroup(group.id)}>
                            <Send className="h-4 w-4 mr-2" />
                            Send SMS to Group
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Group
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Export Contacts
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 hover:text-red-700 focus:text-red-700"
                            onClick={() => deleteGroup(group.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Group
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                
                {groups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="h-10 w-10 text-gray-400 mb-2" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                          No contact groups yet
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Create your first contact group to start organizing your contacts
                        </p>
                        <Button 
                          onClick={() => setOpenDialog("new")}
                          className="bg-jaylink-600 hover:bg-jaylink-700"
                        >
                          Create New Group
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Groups;
