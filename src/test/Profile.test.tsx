import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Profile from '../features/employee/Profile';
import * as client from '../api/client';

vi.mock('framer-motion', () => {
  const stripMotionProps = ({
    initial, animate, exit, transition, whileHover, whileTap, layout, layoutId, variants, ...rest
  }: any) => rest;
  const componentCache = new Map<string, any>();
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        if (!componentCache.has(tag)) {
          componentCache.set(tag, React.forwardRef((props: any, ref: any) => React.createElement(tag, { ...stripMotionProps(props), ref })));
        }
        return componentCache.get(tag);
      },
    }
  );
  return { motion, AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children) };
});

const mockAlert = vi.fn().mockResolvedValue(undefined);
vi.mock('../components/PopupProvider', () => ({
  usePopup: () => ({ alert: mockAlert, confirm: vi.fn(), prompt: vi.fn() }),
}));

const mockUpdateUser = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'emp-1', role: 'EMPLOYEE' }, updateUser: mockUpdateUser }),
}));

const {
  mockUpdateProfile, mockAddEmergencyContact, mockChangePassword,
} = vi.hoisted(() => ({
  mockUpdateProfile: vi.fn(),
  mockAddEmergencyContact: vi.fn(),
  mockChangePassword: vi.fn(),
}));

vi.mock('../api/client', () => ({
  useMyProfile: vi.fn(() => ({ data: undefined, isLoading: false })),
  useUpdateMyProfile: vi.fn(() => ({ mutate: mockUpdateProfile, isPending: false })),
  useAddEmergencyContact: vi.fn(() => ({ mutate: mockAddEmergencyContact, isPending: false })),
  useDeleteEmergencyContact: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUploadDocumentMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteDocumentMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  getDocumentDownloadUrl: vi.fn(() => ''),
  downloadAuthenticatedBlob: vi.fn(),
  useChangePassword: vi.fn(() => ({ mutate: mockChangePassword, isPending: false })),
}));

const profile = (overrides: any = {}) => ({
  id: 'emp-1',
  name: 'Ada',
  lastName: 'Lovelace',
  avatar: null,
  phone: null,
  location: null,
  emergencyContacts: [],
  accountNumber: null,
  nin: null,
  tin: null,
  pensionId: null,
  ...overrides,
});

describe('Profile (employee)', () => {
  beforeEach(() => {
    mockUpdateProfile.mockClear();
    mockAddEmergencyContact.mockClear();
    mockChangePassword.mockClear();
    mockAlert.mockClear();
    mockUpdateUser.mockClear();
    vi.mocked(client.useMyProfile).mockReturnValue({ data: profile(), isLoading: false } as any);
  });

  it('shows a loading state while the profile loads', () => {
    vi.mocked(client.useMyProfile).mockReturnValue({ data: undefined, isLoading: true } as any);
    const { container } = render(<Profile />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows a not-found message if the profile request comes back empty', () => {
    vi.mocked(client.useMyProfile).mockReturnValue({ data: undefined, isLoading: false } as any);
    render(<Profile />);
    expect(screen.getByText('Profile not found.')).toBeInTheDocument();
  });

  it('computes profile completion percentage from the 6-item checklist and labels it accordingly', () => {
    // avatar + phone + location + bank set = 4/6 = 67% -> "Good" (>40, not >70)
    vi.mocked(client.useMyProfile).mockReturnValue({
      data: profile({ avatar: 'data:x', phone: '555-0100', location: 'Lagos', accountNumber: '0123456789' }),
      isLoading: false,
    } as any);
    render(<Profile />);
    fireEvent.click(screen.getByText('Family & Contacts'));

    expect(screen.getByText('67% Complete')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('shows "Perfect!" once every checklist item is complete', () => {
    vi.mocked(client.useMyProfile).mockReturnValue({
      data: profile({
        avatar: 'data:x', phone: '555-0100', location: 'Lagos',
        emergencyContacts: [{ id: 'EC-1', name: 'Bob' }],
        accountNumber: '0123456789',
        nin: 'NIN-1', tin: 'TIN-1', pensionId: 'PEN-1',
      }),
      isLoading: false,
    } as any);
    render(<Profile />);
    fireEvent.click(screen.getByText('Family & Contacts'));

    expect(screen.getByText('100% Complete')).toBeInTheDocument();
    expect(screen.getByText('Perfect!')).toBeInTheDocument();
  });

  describe('Change password', () => {
    const openPasswordModal = () => {
      render(<Profile />);
      fireEvent.click(screen.getByText('Family & Contacts'));
      fireEvent.click(screen.getByText('Change Password'));
    };

    it('requires all three fields before submitting', async () => {
      openPasswordModal();
      fireEvent.click(screen.getByText('Update Password'));

      await waitFor(() => expect(mockAlert).toHaveBeenCalledWith('Please fill in all fields.'));
      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    it('rejects mismatched new/confirm passwords', async () => {
      openPasswordModal();
      const inputs = document.querySelectorAll('input[type="password"]');
      fireEvent.change(inputs[0], { target: { value: 'oldpass1' } });
      fireEvent.change(inputs[1], { target: { value: 'newpass1' } });
      fireEvent.change(inputs[2], { target: { value: 'different' } });
      fireEvent.click(screen.getByText('Update Password'));

      await waitFor(() => expect(mockAlert).toHaveBeenCalledWith('New passwords do not match.'));
      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    it('submits the change and confirms success, closing the modal', async () => {
      mockChangePassword.mockImplementation((_payload, { onSuccess }) => onSuccess());
      openPasswordModal();

      const inputs = document.querySelectorAll('input[type="password"]');
      fireEvent.change(inputs[0], { target: { value: 'oldpass1' } });
      fireEvent.change(inputs[1], { target: { value: 'newpass1' } });
      fireEvent.change(inputs[2], { target: { value: 'newpass1' } });
      fireEvent.click(screen.getByText('Update Password'));

      expect(mockChangePassword).toHaveBeenCalledWith(
        { currentPassword: 'oldpass1', newPassword: 'newpass1' },
        expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
      );
      await waitFor(() => expect(mockAlert).toHaveBeenCalledWith('Password changed successfully.'));
      expect(screen.queryByText('Update Password')).not.toBeInTheDocument();
    });

    it('surfaces a server-side error (e.g. wrong current password) via popup', async () => {
      mockChangePassword.mockImplementation((_payload, { onError }) => onError({ message: 'Current password is incorrect.' }));
      openPasswordModal();

      const inputs = document.querySelectorAll('input[type="password"]');
      fireEvent.change(inputs[0], { target: { value: 'wrongpass' } });
      fireEvent.change(inputs[1], { target: { value: 'newpass1' } });
      fireEvent.change(inputs[2], { target: { value: 'newpass1' } });
      fireEvent.click(screen.getByText('Update Password'));

      await waitFor(() => expect(mockAlert).toHaveBeenCalledWith('Current password is incorrect.'));
    });
  });

  it('adds an emergency contact and resets the form on success', () => {
    mockAddEmergencyContact.mockImplementation((_payload, { onSuccess }) => onSuccess());
    render(<Profile />);
    fireEvent.click(screen.getByText('Family & Contacts'));
    fireEvent.click(screen.getByText('Add Contact'));

    fireEvent.change(screen.getByPlaceholderText('E.g. Jane Doe'), { target: { value: 'Bob Marley' } });
    fireEvent.click(screen.getByText('Save Contact'));

    expect(mockAddEmergencyContact).toHaveBeenCalledWith(
      { name: 'Bob Marley', relationship: '', phone: '' },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    expect(screen.queryByText('Save Contact')).not.toBeInTheDocument();
  });

  it('uploads a new avatar as a data URL and syncs it into the session via updateUser', async () => {
    mockUpdateProfile.mockImplementation((_payload, { onSuccess }) => onSuccess());
    const { container } = render(<Profile />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['avatar bytes'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalled());
    const [payload] = mockUpdateProfile.mock.calls[0];
    expect(payload.avatar).toMatch(/^data:/);
    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith(expect.objectContaining({ avatar: expect.stringMatching(/^data:/) })));
  });
});
