import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AIAssistant from '../features/core/AIAssistant';
import * as client from '../api/client';

const mockUser: any = { id: 'emp-1', name: 'Sarah Connor', role: 'EMPLOYEE' };

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

const mockAsk = vi.fn();

vi.mock('../api/client', () => ({
  useAskAI: vi.fn(() => ({ mutate: mockAsk, isPending: false })),
}));

// The Send button and the header's Close button are both icon-only (empty
// accessible name), so getByRole('button', { name: '' }) is ambiguous —
// scope to the one sitting right next to the input instead.
const getSendButton = () => screen.getByPlaceholderText('Ask a question…').closest('div')!.querySelector('button')!;

describe('AIAssistant', () => {
  beforeEach(() => {
    mockAsk.mockClear();
    mockUser.role = 'EMPLOYEE';
    vi.mocked(client.useAskAI).mockReturnValue({ mutate: mockAsk, isPending: false } as any);
  });

  it('renders nothing when closed', () => {
    const { container } = render(<AIAssistant open={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows a role-specific hint in the empty state', () => {
    render(<AIAssistant open onClose={vi.fn()} />);
    expect(screen.getByText('You can ask about your own profile, leave, and open roles — plus public directory info (title, department, manager) for any coworker.')).toBeInTheDocument();

    mockUser.role = 'MANAGER';
    const { unmount } = render(<AIAssistant open onClose={vi.fn()} />);
    expect(screen.getByText('As a manager, you can ask about your own team.')).toBeInTheDocument();
    unmount();
  });

  it('disables Send when the input is empty or whitespace-only', () => {
    render(<AIAssistant open onClose={vi.fn()} />);
    const sendButton = getSendButton();
    expect(sendButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('Ask a question…'), { target: { value: '   ' } });
    expect(sendButton).toBeDisabled();
    expect(mockAsk).not.toHaveBeenCalled();
  });

  it('sends the question, appends it as a user message, and clears the input', () => {
    render(<AIAssistant open onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('Ask a question…') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'How many leave days do I have left?' } });
    fireEvent.click(getSendButton());

    expect(screen.getByText('How many leave days do I have left?')).toBeInTheDocument();
    expect(mockAsk).toHaveBeenCalledWith('How many leave days do I have left?', expect.objectContaining({
      onSuccess: expect.any(Function), onError: expect.any(Function),
    }));
    expect(input.value).toBe('');
  });

  it('sends on Enter as well as the button', () => {
    render(<AIAssistant open onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('Ask a question…');

    fireEvent.change(input, { target: { value: 'What roles are open?' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockAsk).toHaveBeenCalledWith('What roles are open?', expect.anything());
  });

  it('appends the answer as an assistant message on success', () => {
    mockAsk.mockImplementation((_q, { onSuccess }) => onSuccess({ answer: 'You have 12 days remaining.' }));
    render(<AIAssistant open onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Ask a question…'), { target: { value: 'Leave balance?' } });
    fireEvent.click(getSendButton());

    expect(screen.getByText('You have 12 days remaining.')).toBeInTheDocument();
  });

  it('shows a distinguishable error message (warning icon) rather than a raw crash on failure', () => {
    mockAsk.mockImplementation((_q, { onError }) => onError({ message: 'Something went wrong.' }));
    render(<AIAssistant open onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Ask a question…'), { target: { value: 'Leave balance?' } });
    fireEvent.click(getSendButton());

    expect(screen.getByText('⚠️ Something went wrong.')).toBeInTheDocument();
  });

  it('does not send again while a previous question is still pending', () => {
    vi.mocked(client.useAskAI).mockReturnValue({ mutate: mockAsk, isPending: true } as any);
    render(<AIAssistant open onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Ask a question…'), { target: { value: 'Another question' } });
    fireEvent.click(getSendButton());

    expect(mockAsk).not.toHaveBeenCalled();
    expect(screen.getByText('Thinking…')).toBeInTheDocument();
  });

  it('automatically submits initialQuestion when provided upon opening', () => {
    const onClear = vi.fn();
    render(<AIAssistant open onClose={vi.fn()} initialQuestion="What is my leave balance?" onClearInitialQuestion={onClear} />);

    expect(screen.getByText('What is my leave balance?')).toBeInTheDocument();
    expect(mockAsk).toHaveBeenCalledWith('What is my leave balance?', expect.any(Object));
    expect(onClear).toHaveBeenCalled();
  });
});
