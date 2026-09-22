import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AssetModal } from '../features/admin/AssetModal';
import * as assetClient from '../api/asset.client';

const { mockCreateAsset } = vi.hoisted(() => ({ mockCreateAsset: vi.fn() }));

vi.mock('../api/asset.client', () => ({
  useCreateAsset: vi.fn(() => ({ mutate: mockCreateAsset, isPending: false })),
}));

const employees = [{ id: 'EMP-1', name: 'Grace', lastName: 'Hopper' }];

describe('AssetModal', () => {
  beforeEach(() => {
    mockCreateAsset.mockClear();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<AssetModal isOpen={false} onClose={vi.fn()} employees={employees} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('closes via the X button', () => {
    const onClose = vi.fn();
    render(<AssetModal isOpen={true} onClose={onClose} employees={employees} />);
    fireEvent.click(document.querySelector('.lucide-x')!.closest('button')!);
    expect(onClose).toHaveBeenCalled();
  });

  it('submits the asset with defaults and an unassigned employee', () => {
    render(<AssetModal isOpen={true} onClose={vi.fn()} employees={employees} />);
    fireEvent.change(screen.getByPlaceholderText('e.g. MacBook Pro M3'), { target: { value: 'MacBook Pro' } });
    fireEvent.click(screen.getByText('Save Asset'));

    expect(mockCreateAsset).toHaveBeenCalledWith(
      { name: 'MacBook Pro', category: 'Laptop', status: 'Available', condition: 'New', employeeId: undefined, value: 0 },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it('assigns the asset to a selected employee and parses the value as an integer', () => {
    render(<AssetModal isOpen={true} onClose={vi.fn()} employees={employees} />);
    fireEvent.change(screen.getByPlaceholderText('e.g. MacBook Pro M3'), { target: { value: 'MacBook Pro' } });
    fireEvent.change(screen.getByText('-- Unassigned --').closest('select')!, { target: { value: 'EMP-1' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. 1500000'), { target: { value: '1500000' } });
    fireEvent.click(screen.getByText('Save Asset'));

    expect(mockCreateAsset).toHaveBeenCalledWith(
      expect.objectContaining({ employeeId: 'EMP-1', value: 1500000 }),
      expect.anything()
    );
  });

  it('closes the modal on successful save', () => {
    const onClose = vi.fn();
    mockCreateAsset.mockImplementation((_payload, { onSuccess }) => onSuccess());
    render(<AssetModal isOpen={true} onClose={onClose} employees={employees} />);
    fireEvent.change(screen.getByPlaceholderText('e.g. MacBook Pro M3'), { target: { value: 'MacBook Pro' } });
    fireEvent.click(screen.getByText('Save Asset'));
    expect(onClose).toHaveBeenCalled();
  });
});
