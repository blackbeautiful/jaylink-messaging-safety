
import { useState } from "react";
import { toast } from "sonner";
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
import { Edit, Trash2, MoreVertical, Download, Users, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

interface Group {
  id: string;
  name: string;
  description: string;
  members: number;
  created: string;
}

interface GroupListProps {
  groups: Group[];
  onDeleteGroup: (id: string) => void;
  onAddContacts?: (id: string) => void;
}

const GroupList = ({ groups, onDeleteGroup, onAddContacts }: GroupListProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="border rounded-md overflow-hidden">
      <ScrollArea className="h-[400px] md:h-auto w-full">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="text-center">Members</TableHead>
                <TableHead className="hidden sm:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                    No groups found. Create a new group to get started.
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-jaylink-500" />
                        {group.name}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{group.description}</TableCell>
                    <TableCell className="text-center">{group.members}</TableCell>
                    <TableCell className="hidden sm:table-cell">{group.created}</TableCell>
                    <TableCell className="text-right">
                      {isMobile ? (
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
                              Edit Group
                            </DropdownMenuItem>
                            {onAddContacts && (
                              <DropdownMenuItem onClick={() => onAddContacts(group.id)}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add Contacts
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Export Contacts
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDeleteGroup(group.id)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Group
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <div className="flex justify-end space-x-1">
                          <Button variant="ghost" size="icon" title="Edit Group">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {onAddContacts && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Add Contacts"
                              onClick={() => onAddContacts(group.id)}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="Export Contacts">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Delete Group"
                            onClick={() => onDeleteGroup(group.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
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

export default GroupList;
