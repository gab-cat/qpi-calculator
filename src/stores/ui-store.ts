import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  timestamp: number;
}

interface FormState {
  errors: Record<string, string>;
  isSubmitting: boolean;
}

interface UIStoreState {
  // Modal management
  openModals: string[];

  // Dialog management (specific dialogs)
  isStartupDialogOpen: boolean;
  isTemplateSelectorOpen: boolean;
  isTemplateCreatorOpen: boolean;
  isCourseDialogOpen: boolean;
  isSemesterDialogOpen: boolean;

  // Navigation
  sidebarOpen: boolean;
  
  // Loading states
  globalLoading: boolean;
  componentLoading: Record<string, boolean>;
  convexLoading: Record<string, boolean>; // For Convex operations
  csvImportLoading: boolean;
  
  // Notifications
  notifications: Notification[];
  
  // Form states
  formStates: Record<string, FormState>;
  
  // View preferences
  theme: 'light' | 'dark';
  layoutMode: 'grid' | 'list';
  showCalculations: boolean;
  
  // Actions - Modal Management
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  closeAllModals: () => void;
  isModalOpen: (modalId: string) => boolean;

  // Actions - Dialog Management
  openStartupDialog: () => void;
  closeStartupDialog: () => void;
  openTemplateSelector: () => void;
  closeTemplateSelector: () => void;
  openTemplateCreator: () => void;
  closeTemplateCreator: () => void;
  openCourseDialog: () => void;
  closeCourseDialog: () => void;
  openSemesterDialog: () => void;
  closeSemesterDialog: () => void;
  
  // Actions - Navigation
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Actions - Loading States
  setGlobalLoading: (loading: boolean) => void;
  setComponentLoading: (componentId: string, loading: boolean) => void;
  isComponentLoading: (componentId: string) => boolean;
  setConvexLoading: (operationId: string, loading: boolean) => void;
  isConvexLoading: (operationId: string) => boolean;
  setCsvImportLoading: (loading: boolean) => void;
  clearAllLoading: () => void;
  
  // Actions - Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (notificationId: string) => void;
  clearNotifications: () => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  
  // Actions - Form States
  setFormErrors: (formId: string, errors: Record<string, string>) => void;
  clearFormErrors: (formId: string) => void;
  getFormErrors: (formId: string) => Record<string, string>;
  setFormSubmitting: (formId: string, isSubmitting: boolean) => void;
  isFormSubmitting: (formId: string) => boolean;
  resetFormState: (formId: string) => void;
  
  // Actions - View Preferences
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setLayoutMode: (mode: 'grid' | 'list') => void;
  setShowCalculations: (show: boolean) => void;
  toggleShowCalculations: () => void;
  
  // Actions - Persistence
  savePreferences: () => void;
  loadPreferences: () => void;
  reset: () => void;
}

const defaultFormState: FormState = {
  errors: {},
  isSubmitting: false,
};

export const useUIStore = create<UIStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        openModals: [],
        isStartupDialogOpen: false,
        isTemplateSelectorOpen: false,
        isTemplateCreatorOpen: false,
        isCourseDialogOpen: false,
        isSemesterDialogOpen: false,
        sidebarOpen: false,
        globalLoading: false,
        componentLoading: {},
        convexLoading: {},
        csvImportLoading: false,
        notifications: [],
        formStates: {},
        theme: 'light',
        layoutMode: 'grid',
        showCalculations: true,
        
        // Modal Management Actions
        openModal: (modalId) => {
          set((state) => {
            if (state.openModals.includes(modalId)) {
              return state; // Already open
            }
            
            return {
              openModals: [...state.openModals, modalId],
            };
          });
        },
        
        closeModal: (modalId) => {
          set((state) => ({
            openModals: state.openModals.filter(id => id !== modalId),
          }));
        },
        
        closeAllModals: () => {
          set({ openModals: [] });
        },
        
        isModalOpen: (modalId) => {
          return get().openModals.includes(modalId);
        },

        // Dialog Management Actions
        openStartupDialog: () => {
          set({ isStartupDialogOpen: true });
        },

        closeStartupDialog: () => {
          set({ isStartupDialogOpen: false });
        },

        openTemplateSelector: () => {
          set({ isTemplateSelectorOpen: true });
        },

        closeTemplateSelector: () => {
          set({ isTemplateSelectorOpen: false });
        },

        openTemplateCreator: () => {
          set({ isTemplateCreatorOpen: true });
        },

        closeTemplateCreator: () => {
          set({ isTemplateCreatorOpen: false });
        },

        openCourseDialog: () => {
          set({ isCourseDialogOpen: true });
        },

        closeCourseDialog: () => {
          set({ isCourseDialogOpen: false });
        },

        openSemesterDialog: () => {
          set({ isSemesterDialogOpen: true });
        },

        closeSemesterDialog: () => {
          set({ isSemesterDialogOpen: false });
        },
        
        // Navigation Actions
        toggleSidebar: () => {
          set((state) => ({
            sidebarOpen: !state.sidebarOpen,
          }));
        },
        
        setSidebarOpen: (open) => {
          set({ sidebarOpen: open });
        },
        
        // Loading States Actions
        setGlobalLoading: (loading) => {
          set({ globalLoading: loading });
        },
        
        setComponentLoading: (componentId, loading) => {
          set((state) => ({
            componentLoading: {
              ...state.componentLoading,
              [componentId]: loading,
            },
          }));
        },
        
        isComponentLoading: (componentId) => {
          return get().componentLoading[componentId] || false;
        },

        setConvexLoading: (operationId, loading) => {
          set((state) => ({
            convexLoading: {
              ...state.convexLoading,
              [operationId]: loading,
            },
          }));
        },

        isConvexLoading: (operationId) => {
          return get().convexLoading[operationId] || false;
        },

        setCsvImportLoading: (loading) => {
          set({ csvImportLoading: loading });
        },

        clearAllLoading: () => {
          set({
            globalLoading: false,
            componentLoading: {},
            convexLoading: {},
            csvImportLoading: false,
          });
        },
        
        // Notification Actions
        addNotification: (notification) => {
          const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const timestamp = Date.now();
          
          const newNotification: Notification = {
            ...notification,
            id,
            timestamp,
          };
          
          set((state) => ({
            notifications: [...state.notifications, newNotification],
          }));
          
          // Auto-remove notification after duration
          if (notification.duration && notification.duration > 0) {
            setTimeout(() => {
              get().removeNotification(id);
            }, notification.duration);
          }
        },
        
        removeNotification: (notificationId) => {
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== notificationId),
          }));
        },
        
        clearNotifications: () => {
          set({ notifications: [] });
        },
        
        showSuccess: (message, duration = 5000) => {
          get().addNotification({
            message,
            type: 'success',
            duration,
          });
        },
        
        showError: (message, duration = 0) => {
          get().addNotification({
            message,
            type: 'error',
            duration, // 0 = no auto-remove for errors
          });
        },
        
        showWarning: (message, duration = 7000) => {
          get().addNotification({
            message,
            type: 'warning',
            duration,
          });
        },
        
        showInfo: (message, duration = 5000) => {
          get().addNotification({
            message,
            type: 'info',
            duration,
          });
        },
        
        // Form State Actions
        setFormErrors: (formId, errors) => {
          set((state) => ({
            formStates: {
              ...state.formStates,
              [formId]: {
                ...state.formStates[formId] || defaultFormState,
                errors,
              },
            },
          }));
        },
        
        clearFormErrors: (formId) => {
          set((state) => ({
            formStates: {
              ...state.formStates,
              [formId]: {
                ...state.formStates[formId] || defaultFormState,
                errors: {},
              },
            },
          }));
        },
        
        getFormErrors: (formId) => {
          return get().formStates[formId]?.errors || {};
        },
        
        setFormSubmitting: (formId, isSubmitting) => {
          set((state) => ({
            formStates: {
              ...state.formStates,
              [formId]: {
                ...state.formStates[formId] || defaultFormState,
                isSubmitting,
              },
            },
          }));
        },
        
        isFormSubmitting: (formId) => {
          return get().formStates[formId]?.isSubmitting || false;
        },
        
        resetFormState: (formId) => {
          set((state) => ({
            formStates: {
              ...state.formStates,
              [formId]: { ...defaultFormState },
            },
          }));
        },
        
        // View Preferences Actions
        setTheme: (theme) => {
          set({ theme });
        },
        
        toggleTheme: () => {
          set((state) => ({
            theme: state.theme === 'light' ? 'dark' : 'light',
          }));
        },
        
        setLayoutMode: (mode) => {
          set({ layoutMode: mode });
        },
        
        setShowCalculations: (show) => {
          set({ showCalculations: show });
        },
        
        toggleShowCalculations: () => {
          set((state) => ({
            showCalculations: !state.showCalculations,
          }));
        },
        
        // Persistence Actions
        savePreferences: () => {
          const { theme, layoutMode, showCalculations } = get();
          const preferences = {
            theme,
            layoutMode,
            showCalculations,
          };
          
          try {
            localStorage.setItem('qpi-ui-preferences', JSON.stringify(preferences));
          } catch (error) {
            console.warn('Failed to save UI preferences:', error);
          }
        },
        
        loadPreferences: () => {
          try {
            const saved = localStorage.getItem('qpi-ui-preferences');
            if (saved) {
              const preferences = JSON.parse(saved);
              set({
                theme: preferences.theme || 'light',
                layoutMode: preferences.layoutMode || 'grid',
                showCalculations: preferences.showCalculations !== false,
              });
            }
          } catch (error) {
            console.warn('Failed to load UI preferences:', error);
          }
        },
        
        reset: () => {
          set({
            openModals: [],
            isStartupDialogOpen: false,
            isTemplateSelectorOpen: false,
            isTemplateCreatorOpen: false,
            isCourseDialogOpen: false,
            isSemesterDialogOpen: false,
            sidebarOpen: false,
            globalLoading: false,
            componentLoading: {},
            convexLoading: {},
            csvImportLoading: false,
            notifications: [],
            formStates: {},
            theme: 'light',
            layoutMode: 'grid',
            showCalculations: true,
          });
        },
      }),
      {
        name: 'qpi-ui-store',
        partialize: (state) => ({
          // Only persist preferences and navigation state
          theme: state.theme,
          layoutMode: state.layoutMode,
          showCalculations: state.showCalculations,
          // Don't persist dialog states - they should start closed
        }),
      }
    ),
    { name: 'UIStore' }
  )
);