
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users } from "lucide-react";

interface Group {
  id: string;
  name: string;
  description: string;
  count: number;
  date: string;
}

export interface GroupListProps {
  groups: Group[];
  onDeleteGroup: (id: string) => void;
}

const GroupList = ({ groups, onDeleteGroup }: GroupListProps) => {
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
                  {group.count} contacts · Created {group.date}
                </p>
              </div>
            </div>
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteGroup(group.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default GroupList;
