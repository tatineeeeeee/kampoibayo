"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useToastHelpers } from "../components/Toast";
import { Tables } from "../../database.types";
import { USER_ROLE } from "../lib/constants/roles";
import { Crown } from "lucide-react";
import { createElement } from "react";

type User = Tables<"users">;

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false); // Start false for instant UI
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRole, setEditRole] = useState("");
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [selectedUserBookings, setSelectedUserBookings] = useState<User | null>(
    null
  );
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

  // Enhanced role-based access control
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [isCurrentUserSuperAdmin, setIsCurrentUserSuperAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Add User modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showPasswordReveal, setShowPasswordReveal] = useState(false);
  const [createdUserInfo, setCreatedUserInfo] = useState<{
    name: string;
    email: string;
    tempPassword: string;
  } | null>(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedUsers, setPaginatedUsers] = useState<User[]>([]);

  // Standardized toast helpers
  const { success, error: showError, warning } = useToastHelpers();

  const fetchUsers = useCallback(async () => {
    try {
      // Get current user role first
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: currentUserData, error: userError } = await supabase
          .from("users")
          .select("role, id")
          .eq("auth_id", session.user.id)
          .single();

        if (userError) {
          console.error("❌ Error fetching current user:", userError);
        } else {
          const isAdmin = currentUserData?.role === USER_ROLE.ADMIN;
          setIsCurrentUserAdmin(isAdmin);
          setCurrentUserRole(currentUserData?.role || null);
          // For now, treat all admins as having full admin powers until super admin column is added
          setIsCurrentUserSuperAdmin(isAdmin);
          setCurrentUserId(currentUserData?.id || null);
        }
      }

      // Then fetch all users
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching users:", error);
        showError("Failed to fetch users");
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error("❌ Error in fetchUsers:", error);
      showError("An error occurred while fetching users");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Delayed fetch to not block navigation
  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(), 100);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // Filter users based on search term and role filter
  useEffect(() => {
    let filtered = users;

    // First filter by role
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Then filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (user) =>
          // Search by name
          user.full_name?.toLowerCase().includes(searchLower) ||
          // Search by email
          user.email?.toLowerCase().includes(searchLower) ||
          // Search by ID
          user.id?.toString().includes(searchTerm.trim())
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  // Pagination logic
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedUsers(filteredUsers.slice(startIndex, endIndex));
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredUsers]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  // Pagination functions
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () =>
    setCurrentPage(Math.min(totalPages, currentPage + 1));

  const updateUserRole = async (userId: string, newRole: string) => {
    if (!userId || !newRole) {
      warning("Invalid user data");
      return;
    }

    if (selectedUser?.role === newRole) {
      warning("User already has this role");
      return;
    }

    try {
      const updateData = { role: newRole };

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId);

      if (error) throw error;

      success(`User role updated to ${newRole}!`);
      setShowEditModal(false);
      setSelectedUser(null);
      setEditRole("");
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error updating user role:", error);
      showError("Failed to update user role");
    }
  };

  // Permission check: Can current user delete the target user?
  const canDeleteUser = (targetUser: User): boolean => {
    // Staff cannot delete anyone
    if (currentUserRole === USER_ROLE.STAFF) return false;

    // Cannot delete yourself
    if (targetUser.id === currentUserId) return false;

    // Super Admin cannot be deleted by anyone
    if (targetUser.is_super_admin) return false;

    // Only Super Admin can delete other admins
    if (targetUser.role === USER_ROLE.ADMIN && !isCurrentUserSuperAdmin) return false;

    // Admins and Super Admins can delete users and staff
    return isCurrentUserAdmin || isCurrentUserSuperAdmin;
  };

  // Permission check: Can current user edit the target user's role?
  const canEditUserRole = (targetUser: User): boolean => {
    // Staff cannot edit roles
    if (currentUserRole === USER_ROLE.STAFF) return false;

    // Cannot edit your own role (must be done by another admin)
    if (targetUser.id === currentUserId) return false;

    // Super Admin's role cannot be changed
    if (targetUser.is_super_admin) return false;

    // Only Super Admin can change other admin's roles
    if (targetUser.role === USER_ROLE.ADMIN && !isCurrentUserSuperAdmin) return false;

    // Admins and Super Admins can edit users and staff roles
    return isCurrentUserAdmin || isCurrentUserSuperAdmin;
  };

  // Permission check: Can current user create new users?
  const canCreateUser = (): boolean => {
    if (currentUserRole === USER_ROLE.STAFF) return false;
    return isCurrentUserAdmin || isCurrentUserSuperAdmin;
  };

  // Add User handlers
  const handleAddUserSuccess = (
    tempPassword: string,
    userName: string,
    userEmail: string
  ) => {
    setShowAddUserModal(false);
    setCreatedUserInfo({ name: userName, email: userEmail, tempPassword });
    setShowPasswordReveal(true);
    success(`User ${userName} created successfully!`);
    fetchUsers();
  };

  const handlePasswordRevealClose = () => {
    setShowPasswordReveal(false);
    setCreatedUserInfo(null);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteCancel = () => {
    setUserToDelete(null);
    setShowDeleteModal(false);
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete.id);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!userId) {
      warning("Invalid user data");
      return;
    }

    try {
      // Find the user to get their auth_id
      const userToDeleteData = users.find((u) => u.id === userId);
      if (!userToDeleteData) {
        showError("User not found");
        return;
      }

      // Get the current session for authorization
      const { getFreshSession } = await import("../utils/apiTimeout");
      const session = await getFreshSession(supabase);
      if (!session?.access_token) {
        showError("You must be logged in to delete users");
        return;
      }

      // Use the hard delete API to remove from both database and auth
      const response = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: userId,
          authId: userToDeleteData.auth_id,
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("Non-JSON response received:", textResponse);
        throw new Error("Server returned invalid response format");
      }

      const result = await response.json();

      if (!response.ok) {
        const errorMsg =
          result.error || result.message || "Failed to delete user";
        throw new Error(errorMsg);
      }

      // Handle successful response
      if (result.success) {
        const message =
          result.message ||
          "User completely deleted! They can now re-register with the same email if needed.";
        success(message);

        // Show warning if auth deletion failed
        if (result.authError) {
          warning("Note: Authentication cleanup may be incomplete");
        }
      } else {
        throw new Error("Deletion was not successful");
      }

      fetchUsers(); // Refresh the list

      // Close the modal
      setUserToDelete(null);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("User deletion failed:", error instanceof Error ? error.message : "Unknown error");

      if (error instanceof Error) {
        if (error.message.includes("configuration")) {
          showError("Server configuration error. Please contact support.");
        } else if (error.message.includes("invalid response format")) {
          showError("Server error. Please try again or contact support.");
        } else {
          showError(`Failed to delete user: ${error.message}`);
        }
      } else {
        showError("Failed to delete user - unknown error occurred");
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleBadgeClass = (role: string, isSuperAdmin?: boolean) => {
    if (isSuperAdmin) {
      return "bg-gradient-to-r from-warning/20 to-warning/10 text-warning border border-warning/20 shadow-sm";
    }
    switch (role) {
      case USER_ROLE.ADMIN:
        return "bg-info/10 text-primary border border-info/20";
      case USER_ROLE.STAFF:
        return "bg-info/10 text-primary border border-info/20";
      case USER_ROLE.USER:
      default:
        return "bg-success/10 text-success border border-success/20";
    }
  };

  // Get role display with icon for super admin
  const getRoleDisplay = (user: User) => {
    if (user.is_super_admin) {
      return createElement(
        "span",
        {
          className: `inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass(
            user.role || USER_ROLE.ADMIN,
            true
          )}`,
        },
        createElement(Crown, { className: "w-3 h-3" }),
        "Super Admin"
      );
    }
    return createElement(
      "span",
      {
        className: `inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass(
          user.role || USER_ROLE.USER
        )}`,
      },
      user.role || USER_ROLE.USER
    );
  };

  return {
    // Data
    users,
    filteredUsers,
    paginatedUsers,
    loading,

    // Search & filters
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,

    // Pagination
    currentPage,
    totalPages,
    itemsPerPage,
    startIndex,
    setItemsPerPage,
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToPreviousPage,
    goToNextPage,

    // Edit role modal
    showEditModal,
    setShowEditModal,
    selectedUser,
    setSelectedUser,
    editRole,
    setEditRole,
    updateUserRole,

    // Bookings modal
    showBookingsModal,
    setShowBookingsModal,
    selectedUserBookings,
    setSelectedUserBookings,

    // Delete modal
    showDeleteModal,
    userToDelete,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,

    // Add user modal
    showAddUserModal,
    setShowAddUserModal,
    isCurrentUserSuperAdmin,
    handleAddUserSuccess,

    // Password reveal modal
    showPasswordReveal,
    createdUserInfo,
    handlePasswordRevealClose,

    // Permissions
    canDeleteUser,
    canEditUserRole,
    canCreateUser,

    // Utilities
    fetchUsers,
    formatDate,
    getRoleDisplay,

    // Toast helpers (exposed for child components)
    success,
    showError,
  };
}
