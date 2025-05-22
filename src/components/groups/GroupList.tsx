// src/components/groups/GroupList.tsx
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface Group {
  id: string | number;
  name: string;
  description?: string;
  contactCount?: number;
  createdAt: string;
}

export interface GroupListProps {
  groups: Group[];
  onDeleteGroup: (id: string | number) => void;
  isLoading?: boolean;
}

const GroupList = ({ groups, onDeleteGroup, isLoading = false }: GroupListProps) => {
  const [groupToDelete, setGroupToDelete] = useState<string | number | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const confirmDelete = (id: string | number) => {
    setGroupToDelete(id);
  };

  const handleDeleteConfirmed = () => {
    if (groupToDelete !== null) {
      onDeleteGroup(groupToDelete);
      setGroupToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-50 dark:bg-gray-700/40 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Skeleton className="w-9 h-9 rounded-full mr-3" />
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <div className="flex space-x-1">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          No groups yet. Create your first group.
        </p>
      ) : (
        groups.map((group) => (
          <div
            key={group.id}
            className="bg-gray-50 dark:bg-gray-700/40 p-3 rounded-lg flex justify-between items-center"
          >
            <div className="flex items-center">
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {group.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {group.contactCount !== undefined ? `${group.contactCount} contacts` : 'Loading...'} · Created {formatDate(group.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog open={groupToDelete === group.id}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => confirmDelete(group.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the group "{group.name}" and remove all contact associations. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setGroupToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-red-500 hover:bg-red-600">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default GroupList;