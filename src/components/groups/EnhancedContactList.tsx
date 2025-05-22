// src/components/groups/EnhancedContactList.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, User, Mail, Phone, Calendar, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatPhoneNumber, getInitials, generateAvatarColor } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface EnhancedContactListProps {
  contacts: Contact[];
  pagination: PaginationInfo;
  loading: boolean;
  onDelete: (id: string) => void;
  onEdit?: (contact: Contact) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  showActions?: boolean;
  compact?: boolean;
}

const EnhancedContactList = ({ 
  contacts, 
  pagination, 
  loading, 
  onDelete, 
  onEdit,
  onPageChange,
  onRefresh,
  showActions = true,
  compact = false
}: EnhancedContactListProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteClick = (contact: Contact) => {
    setDeletingId(contact.id);
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      onDelete(deletingId);
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeletingId(null);
  };

  const handleEditClick = (contact: Contact) => {
    if (onEdit) {
      onEdit(contact);
    }
  };

  // Get the contact being deleted for the dialog
  const contactToDelete = contacts.find(c => c.id === deletingId);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-gray-50 dark:bg-gray-700/40 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              {showActions && (
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No contacts found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Add your first contact to start building your contact list for messaging campaigns.
        </p>
        <Button onClick={onRefresh} variant="outline">
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contact List */}
      <div className={`space-y-${compact ? '2' : '3'}`}>
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className={`bg-gray-50 dark:bg-gray-700/40 ${compact ? 'p-3' : 'p-4'} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                {/* Avatar */}
                <div className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold ${generateAvatarColor(contact.name)}`}>
                  {getInitials(contact.name)}
                </div>
                
                {/* Contact Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className={`font-semibold text-gray-900 dark:text-white truncate ${compact ? 'text-sm' : 'text-base'}`}>
                      {contact.name}
                    </h3>
                  </div>
                  
                  <div className={`space-y-${compact ? '0.5' : '1'}`}>
                    {/* Phone */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} flex-shrink-0 text-green-600`} />
                      <span className="truncate font-medium">{formatPhoneNumber(contact.phone)}</span>
                    </div>
                    
                    {/* Email */}
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} flex-shrink-0 text-blue-600`} />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}
                    
                    {/* Created Date */}
                    {!compact && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span>Added {formatDate(contact.createdAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              {showActions && (
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {/* Desktop Actions */}
                  <div className="hidden sm:flex items-center space-x-2">
                    {onEdit && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-600 hover:text-blue-600"
                        onClick={() => handleEditClick(contact)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-600 hover:text-red-600"
                          onClick={() => handleDeleteClick(contact)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{contactToDelete?.name}"? This will remove the contact from all groups and cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={handleDeleteCancel}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeleteConfirm}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            Delete Contact
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  
                  {/* Mobile Actions - Dropdown Menu */}
                  <div className="sm:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEdit && (
                          <DropdownMenuItem onClick={() => handleEditClick(contact)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Contact
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(contact)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Contact
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of{' '}
            {pagination.total} contacts
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ 
                length: Math.min(5, pagination.totalPages) 
              }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Mobile-specific Alert Dialog */}
      <AlertDialog open={!!deletingId && !!contactToDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{contactToDelete?.name}"? This will remove the contact from all groups and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete Contact
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EnhancedContactList;