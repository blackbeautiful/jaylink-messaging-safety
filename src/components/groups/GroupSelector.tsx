/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Loader2, RefreshCw, AlertCircle, FolderOpen, Check } from "lucide-react";
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
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
}

export const GroupSelector = ({ 
  onGroupSelected, 
  buttonText = "Select Group", 
  selectedGroup = null,
  disabled = false,
  variant = "outline",
  size = "default"
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

  // Memoized filtered groups
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const query = searchQuery.toLowerCase();
    return groups.filter(group => 
      group.name.toLowerCase().includes(query) ||
      group.description?.toLowerCase().includes(query)
    );
  }, [groups, searchQuery]);

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
      fetchGroups(1, "");
    }
  }, [isOpen, fetchGroups]);

  const handleSelectGroup = (group: Group) => {
    onGroupSelected(group);
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchQuery("");
      setError(null);
    }
  };

  const getButtonText = () => {
    if (selectedGroup) {
      return selectedGroup.name;
    }
    return buttonText;
  };

  const getButtonIcon = () => {
    if (selectedGroup) {
      return <Check className="h-4 w-4 text-green-600" />;
    }
    return <Users className="h-4 w-4" />;
  };

  // Calculate dynamic heights for mobile
  const getDialogClasses = () => {
    if (isMobile) {
      return "w-full h-full max-w-none max-h-none m-0 rounded-none flex flex-col";
    }
    return "max-w-lg w-full max-h-[80vh] flex flex-col";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant={variant}
          size={size}
          className="w-full flex items-center gap-2 justify-start relative"
          disabled={disabled}
        >
          {getButtonIcon()}
          <div className="flex-1 text-left min-w-0">
            <span className="truncate block">{getButtonText()}</span>
            {selectedGroup && (
              <span className="text-xs text-gray-500 truncate block">
                {selectedGroup.contactCount} contact{selectedGroup.contactCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {selectedGroup && (
            <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 flex-shrink-0">
              Selected
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className={getDialogClasses()}>
        {/* Fixed Header */}
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Select Group
            {selectedGroup && (
              <Badge variant="secondary" className="ml-2 max-w-[200px]">
                <span className="truncate">{selectedGroup.name}</span>
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 flex flex-col px-6 py-4 gap-4">
          {/* Search - Fixed */}
          <div className="flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="flex-shrink-0 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
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
                    fetchGroups(1, "");
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Groups count */}
          {filteredGroups.length > 0 && (
            <div className="flex-shrink-0 py-2 border-b">
              <span className="text-sm text-gray-600">
                {filteredGroups.length} group{filteredGroups.length !== 1 ? 's' : ''} found
              </span>
            </div>
          )}

          {/* Groups list - Scrollable */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              {loading && groups.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading groups...</span>
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No groups found</p>
                  <p className="text-sm">
                    {searchQuery ? 'Try adjusting your search' : 'Create your first group to get started'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pb-4">
                  {filteredGroups.map(group => {
                    const isSelected = selectedGroup?.id === group.id;
                    
                    return (
                      <div 
                        key={group.id}
                        className={`flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' : 'border border-transparent'
                        }`}
                        onClick={() => handleSelectGroup(group)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-medium text-sm truncate flex items-center gap-2">
                              <span className="truncate">{group.name}</span>
                              {isSelected && <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                            </div>
                            <Badge 
                              variant={group.contactCount > 0 ? "default" : "secondary"}
                              className={`text-xs flex-shrink-0 ${
                                group.contactCount > 0 
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" 
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                              }`}
                            >
                              {group.contactCount} contact{group.contactCount !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          {group.description && (
                            <div className="text-xs text-gray-500 truncate mb-1">{group.description}</div>
                          )}
                          <div className="text-xs text-gray-400">
                            Created {formatDate(group.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
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
        </div>
        
        {/* Fixed Footer */}
        <div className="flex-shrink-0 flex justify-end space-x-2 px-6 py-4 border-t bg-white dark:bg-gray-800">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupSelector;