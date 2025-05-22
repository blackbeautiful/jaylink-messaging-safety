// src/components/groups/EnhancedContactList.tsx - Enhanced version with better UI and smooth delete
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, User, Mail, Phone, Calendar, MoreHorizontal, UserPlus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { formatPhoneNumber, getInitials, generateAvatarColor } from '@/lib/utils';
import Pagination from '@/components/Pagination';

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
  compact = false,
}: EnhancedContactListProps) => {
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (contact: Contact) => {
    setDeletingContact(contact);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingContact) return;

    try {
      setIsDeleting(true);
      await new Promise((resolve) => setTimeout(resolve, 100)); // Prevent UI glitch
      onDelete(deletingContact.id);
      setDeletingContact(null);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!isDeleting) {
      setDeletingContact(null);
    }
  };

  const handleEditClick = (contact: Contact) => {
    if (onEdit) {
      onEdit(contact);
    }
  };

  // Format time with proper timezone handling
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="p-4">
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
          </Card>
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No contacts found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Add your first contact to start building your contact list for messaging campaigns.
        </p>
        <Button onClick={onRefresh} variant="outline" className="mr-3">
          Refresh
        </Button>
        <Button className="bg-green-600 hover:bg-green-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Add First Contact
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contacts Grid */}
      <div className={`space-y-${compact ? '3' : '4'}`}>
        {contacts.map((contact) => (
          <Card
            key={contact.id}
            className="group hover:shadow-lg transition-all duration-200 border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600"
          >
            <CardContent className={`${compact ? 'p-4' : 'p-6'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  {/* Avatar */}
                  <div
                    className={`${
                      compact ? 'w-10 h-10' : 'w-12 h-12'
                    } rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold shadow-sm ${generateAvatarColor(
                      contact.name
                    )}`}
                  >
                    {getInitials(contact.name)}
                  </div>

                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3
                        className={`font-semibold text-gray-900 dark:text-white truncate ${
                          compact ? 'text-base' : 'text-lg'
                        }`}
                      >
                        {contact.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
                      >
                        Contact
                      </Badge>
                    </div>

                    <div className={`space-y-${compact ? '1' : '2'}`}>
                      {/* Phone */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Phone
                          className={`${
                            compact ? 'h-3 w-3' : 'h-4 w-4'
                          } flex-shrink-0 text-green-600`}
                        />
                        <span className="truncate font-medium">
                          {formatPhoneNumber(contact.phone)}
                        </span>
                      </div>

                      {/* Email */}
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Mail
                            className={`${
                              compact ? 'h-3 w-3' : 'h-4 w-4'
                            } flex-shrink-0 text-blue-600`}
                          />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}

                      {/* Created Date */}
                      {!compact && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span>Added {formatTime(contact.createdAt)}</span>
                          {contact.updatedAt !== contact.createdAt && (
                            <>
                              <span>•</span>
                              <span>Updated {formatTime(contact.updatedAt)}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {showActions && (
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                    {/* Desktop Actions */}
                    <div className="hidden sm:flex items-center space-x-2">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          onClick={() => handleEditClick(contact)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleDeleteClick(contact)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Mobile Actions - Dropdown Menu */}
                    <div className="sm:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {onEdit && (
                            <DropdownMenuItem onClick={() => handleEditClick(contact)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Contact
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(contact)}
                            className="text-red-600 focus:text-red-600 dark:text-red-400"
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of{' '}
            {pagination.total} contacts
          </div>

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}

      {/* Fixed Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingContact} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingContact?.name}"?
              <span className="block mt-2 text-amber-600 dark:text-amber-400 font-medium">
                This will remove the contact from all groups and cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Contact'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EnhancedContactList;
