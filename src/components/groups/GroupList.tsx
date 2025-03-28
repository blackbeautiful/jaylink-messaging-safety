
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
import { Edit, Trash2, MoreVertical, Download, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
}

const GroupList = ({ groups, onDeleteGroup }: GroupListProps) => {
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
