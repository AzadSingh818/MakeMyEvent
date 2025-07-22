// src/hooks/index.ts

// Export all hooks for easy importing
export * from './use-auth';
export * from './use-events';
export * from './use-faculty';
export * from './use-sessions';
export * from './use-registrations';
export * from './use-attendance';

// Re-export commonly used hooks with aliases for convenience
export {
  useAuth,
  useProfile,
  useUpdateProfile,
  useRegister,
  useDashboardStats,
  useNotifications,
  // Role check hooks
  useIsOrganizer,
  useIsEventManager,
  useIsFaculty,
  useIsDelegate,
  useIsHallCoordinator,
  useCanManageEvents,
  useCanMarkAttendance,
  useUserPermissions
} from './use-auth';

export {
  useEvents,
  useEvent,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useChangeEventStatus,
  useBulkUpdateEvents,
  useBulkDeleteEvents,
  useEventStats,
  useUserEventRole
} from './use-events';

export {
  useFaculty,
  useFacultyProfile,
  useMyFacultyProfile,
  useFacultyByEvent,
  useSendInvitations,
  useUpdateFaculty,
  useBulkUpdateFaculty,
  useUploadCV,
  useRespondToInvitation,
  useFacultyStats,
  useFacultyByInstitution,
  useFacultyByRole,
  useFacultySearch
} from './use-faculty';

export {
  useSessions,
  useSession,
  useSessionsByEvent,
  useSessionsByDate,
  useSessionsByHall,
  useUserSessions,
  useCreateSession,
  useUpdateSession,
  useDeleteSession,
  useBulkUpdateSessions,
  useBulkDeleteSessions,
  useCheckConflicts,
  useAddSpeaker,
  useRemoveSpeaker,
  useSessionStats,
  useTodaysSessions,
  useUpcomingSessions,
  useOngoingSessions
} from './use-sessions';

export {
  useRegistrations,
  useRegistration,
  useRegistrationsByEvent,
  useMyRegistrations,
  useCreateRegistration,
  useUpdateRegistration,
  useBulkUpdateRegistrations,
  useApproveRegistrations,
  useRejectRegistrations,
  useCancelRegistration,
  useBulkCancelRegistrations,
  useRegistrationStats,
  useRegistrationEligibility,
  useExportRegistrations,
  usePendingRegistrations,
  useApprovedRegistrations,
  useWaitlistRegistrations,
  useRegistrationsByType,
  useIsUserRegistered
} from './use-registrations';

export {
  useAttendance,
  useSessionAttendance,
  useUserAttendance,
  useMyAttendance,
  useMarkAttendance,
  useBulkMarkAttendance,
  useMarkAttendanceQR,
  useGenerateQR,
  useRemoveAttendance,
  useExportAttendance,
  useAttendanceStats,
  useHasAttended,
  useAttendanceByDateRange,
  useRealtimeAttendanceCount,
  useAttendanceTrends
} from './use-attendance';

// ✅ FIXED: Removed problematic exports for non-existent files
// Hook combinations for common use cases would be implemented later
// when those specific hook files are created

// Custom combined hooks that use multiple base hooks
// These would be separate files that combine multiple hooks for common workflows