import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUIStore } from '../../src/stores/ui-store';

describe('UI Store', () => {
  beforeEach(() => {
    // Clear store state before each test
    useUIStore.getState().reset();
    vi.clearAllMocks();
  });

  describe('Modal Management', () => {
    it('should initialize with no open modals', () => {
      const { openModals } = useUIStore.getState();
      expect(openModals).toEqual([]);
    });

    it('should open a modal', () => {
      const store = useUIStore.getState();
      const modalId = 'course-selector';

      store.openModal(modalId);

      const { openModals } = useUIStore.getState();
      expect(openModals).toContain(modalId);
    });

    it('should close a modal', () => {
      const store = useUIStore.getState();
      const modalId = 'course-selector';

      // Open then close
      store.openModal(modalId);
      store.closeModal(modalId);

      const { openModals } = useUIStore.getState();
      expect(openModals).not.toContain(modalId);
    });

    it('should close all modals', () => {
      const store = useUIStore.getState();

      // Open multiple modals
      store.openModal('modal-1');
      store.openModal('modal-2');
      store.openModal('modal-3');

      // Close all
      store.closeAllModals();

      const { openModals } = useUIStore.getState();
      expect(openModals).toEqual([]);
    });

    it('should check if modal is open', () => {
      const store = useUIStore.getState();
      const modalId = 'course-selector';

      expect(store.isModalOpen(modalId)).toBe(false);

      store.openModal(modalId);
      expect(store.isModalOpen(modalId)).toBe(true);
    });
  });

  describe('Navigation State', () => {
    it('should initialize with default active tab', () => {
      const { activeTab } = useUIStore.getState();
      expect(activeTab).toBe('calculator');
    });

    it('should set active tab', () => {
      const store = useUIStore.getState();
      const tabId = 'templates';

      store.setActiveTab(tabId);

      const { activeTab } = useUIStore.getState();
      expect(activeTab).toBe(tabId);
    });

    it('should manage sidebar visibility', () => {
      const store = useUIStore.getState();

      expect(useUIStore.getState().sidebarOpen).toBe(false);

      store.toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);

      store.setSidebarOpen(false);
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });
  });

  describe('Loading States', () => {
    it('should manage global loading state', () => {
      const store = useUIStore.getState();

      store.setGlobalLoading(true);
      expect(useUIStore.getState().globalLoading).toBe(true);

      store.setGlobalLoading(false);
      expect(useUIStore.getState().globalLoading).toBe(false);
    });

    it('should manage component-specific loading states', () => {
      const store = useUIStore.getState();
      const componentId = 'grade-table';

      store.setComponentLoading(componentId, true);
      expect(store.isComponentLoading(componentId)).toBe(true);

      store.setComponentLoading(componentId, false);
      expect(store.isComponentLoading(componentId)).toBe(false);
    });

    it('should clear all loading states', () => {
      const store = useUIStore.getState();

      // Set multiple loading states
      store.setGlobalLoading(true);
      store.setComponentLoading('comp-1', true);
      store.setComponentLoading('comp-2', true);

      // Clear all
      store.clearAllLoading();

      expect(useUIStore.getState().globalLoading).toBe(false);
      expect(useUIStore.getState().componentLoading).toEqual({});
    });
  });

  describe('Notification System', () => {
    it('should add notification', () => {
      const store = useUIStore.getState();
      const notification = {
        message: 'Grade saved successfully',
        type: 'success' as const,
        duration: 5000
      };

      store.addNotification(notification);

      const { notifications } = useUIStore.getState();
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toMatchObject(notification);
      expect(notifications[0].id).toBeDefined();
    });

    it('should remove notification', () => {
      const store = useUIStore.getState();
      const notification = {
        message: 'Test notification',
        type: 'info' as const
      };

      store.addNotification(notification);
      const notificationId = useUIStore.getState().notifications[0].id;

      store.removeNotification(notificationId);

      const { notifications } = useUIStore.getState();
      expect(notifications).toHaveLength(0);
    });

    it('should clear all notifications', () => {
      const store = useUIStore.getState();

      // Add multiple notifications
      store.addNotification({ message: 'Notification 1', type: 'info' });
      store.addNotification({ message: 'Notification 2', type: 'success' });
      store.addNotification({ message: 'Notification 3', type: 'error' });

      // Clear all
      store.clearNotifications();

      const { notifications } = useUIStore.getState();
      expect(notifications).toEqual([]);
    });

    it('should add convenience notification methods', () => {
      const store = useUIStore.getState();

      store.showSuccess('Success message');
      store.showError('Error message');
      store.showInfo('Info message');
      store.showWarning('Warning message');

      const { notifications } = useUIStore.getState();
      expect(notifications).toHaveLength(4);
      expect(notifications[0].type).toBe('success');
      expect(notifications[1].type).toBe('error');
      expect(notifications[2].type).toBe('info');
      expect(notifications[3].type).toBe('warning');
    });
  });

  describe('Form States', () => {
    it('should manage form validation states', () => {
      const store = useUIStore.getState();
      const formId = 'grade-form';
      const errors = { grade: 'Grade must be between 0-100' };

      store.setFormErrors(formId, errors);
      expect(store.getFormErrors(formId)).toEqual(errors);

      store.clearFormErrors(formId);
      expect(store.getFormErrors(formId)).toEqual({});
    });

    it('should manage form submission states', () => {
      const store = useUIStore.getState();
      const formId = 'course-form';

      store.setFormSubmitting(formId, true);
      expect(store.isFormSubmitting(formId)).toBe(true);

      store.setFormSubmitting(formId, false);
      expect(store.isFormSubmitting(formId)).toBe(false);
    });

    it('should reset form state', () => {
      const store = useUIStore.getState();
      const formId = 'test-form';

      // Set some form state
      store.setFormErrors(formId, { field: 'error' });
      store.setFormSubmitting(formId, true);

      // Reset
      store.resetFormState(formId);

      expect(store.getFormErrors(formId)).toEqual({});
      expect(store.isFormSubmitting(formId)).toBe(false);
    });
  });

  describe('View Preferences', () => {
    it('should manage layout preferences', () => {
      const store = useUIStore.getState();

      expect(useUIStore.getState().layoutMode).toBe('grid');

      store.setLayoutMode('list');
      expect(useUIStore.getState().layoutMode).toBe('list');
    });

    it('should manage theme preferences', () => {
      const store = useUIStore.getState();

      expect(useUIStore.getState().theme).toBe('light');

      store.setTheme('dark');
      expect(useUIStore.getState().theme).toBe('dark');

      store.toggleTheme();
      expect(useUIStore.getState().theme).toBe('light');
    });

    it('should manage display options', () => {
      const store = useUIStore.getState();

      expect(useUIStore.getState().showCalculations).toBe(true);

      store.setShowCalculations(false);
      expect(useUIStore.getState().showCalculations).toBe(false);

      store.toggleShowCalculations();
      expect(useUIStore.getState().showCalculations).toBe(true);
    });
  });

  describe('Persistence', () => {
    it('should save and load preferences', () => {
      const store = useUIStore.getState();

      // This will be implemented with localStorage
      expect(store.savePreferences).toBeDefined();
      expect(store.loadPreferences).toBeDefined();
    });
  });
});