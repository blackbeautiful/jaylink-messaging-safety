// src/components/groups/GroupSelector.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Users, Search, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { api } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDate, debounce } from "@/lib/utils";

export interface Group {
  id: string;
  name: string;
  description?: string;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

interface GroupSelectorProps {
  onGroupSelected: (group: Group) => void;
  buttonText?: string;
  selectedGroup?: Group | null;
  disabled?: boolean;
}

export const GroupSelector = ({ 
  onGroupSelected, 
  buttonText = "Select Group", 
  selectedGroup = null,
  disabled = false
}: GroupSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Debounced search function
  const debouncedFetchGroups = useCallback(
    debounce((page: number, search: string) => {
      fetchGroups(page, search);
    }, 300),
    []
  );

  // Fetch groups function
  const fetchGroups = useCallback(async (page = 1, search = "") => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/groups', {
        params: {
          page,
          limit: 50,
          search: search.trim(),
        },
      });

      if (response.data.success) {
        const { groups: newGroups, pagination: paginationData } = response.data.data;
        
        if (page === 1) {
          setGroups(newGroups);
        } else {
          setGroups(prev => [...prev, ...newGroups]);
        }
        
        setPagination(paginationData);
      } else {
        throw new Error(response.data.message || 'Failed to fetch groups');
      }
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch groups';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more groups
  const loadMore = useCallback(() => {
    if (pagination.hasNext && !loading) {
      fetchGroups(pagination.currentPage + 1, searchQuery);
    }
  }, [pagination.hasNext, pagination.currentPage, searchQuery, loading, fetchGroups]);

  // Fetch groups when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchGroups(1, searchQuery);
    }
  }, [isOpen, fetchGroups, searchQuery]);

  // Handle search with debouncing
  useEffect(() => {
    if (isOpen) {
      debouncedFetchGroups(1, searchQuery);
    }
  }, [searchQuery, isOpen, debouncedFetchGroups]);

  const handleSelectGroup = (group: Group) => {
    onGroupSelected(group);
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchQuery("");
      setError(null);
      setGroups([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        total: 0,
        hasNext: false,
        hasPrev: false,
      });
    }
  };

  const getButtonText = () => {
    if (selectedGroup) {
      return `${selectedGroup.name} (${selectedGroup.contactCount} contacts)`;
    }
    return buttonText;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full flex items-center gap-2 justify-start"
          disabled={disabled}
        >
          <Users className="h-4 w-4" />
          <span className="truncate">{getButtonText()}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className={isMobile ? "w-[95vw] max-w-[95vw] h-[80vh]" : "max-w-lg w-full h-[70vh]"}>
        <DialogHeader>
          <DialogTitle>Select Group</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setError(null);
                    fetchGroups(1, searchQuery);
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Groups list */}
          <div className="flex-1 flex flex-col">
            {groups.length > 0 && (
              <div className="mb-2">
                <span className="text-sm text-gray-600">
                  {pagination.total} group{pagination.total !== 1 ? 's' : ''} found
                </span>
              </div>
            )}

            <ScrollArea className="flex-1 border rounded-md">
              {loading && groups.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-jaylink-600" />
                  <span className="ml-2 text-gray-600">Loading groups...</span>
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  {searchQuery ? 'No groups found matching your search' : 'No groups available'}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {groups.map(group => (
                    <div 
                      key={group.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer transition-colors"
                      onClick={() => handleSelectGroup(group)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-medium text-sm truncate">{group.name}</div>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            {group.contactCount} contact{group.contactCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {group.description && (
                          <div className="text-xs text-gray-500 truncate mb-1">{group.description}</div>
                        )}
                        <div className="text-xs text-gray-400">
                          Created {formatDate(group.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Load more button */}
                  {pagination.hasNext && (
                    <div className="flex justify-center p-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={loadMore}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Load More'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupSelector;