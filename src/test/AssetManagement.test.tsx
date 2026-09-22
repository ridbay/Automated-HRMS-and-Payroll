import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import AssetManagement from '../features/admin/AssetManagement';
import * as client from '../api/client';
import * as assetClient from '../api/asset.client';

vi.mock('../features/admin/AssetModal', () => ({
  AssetModal: ({ isOpen }: any) => (isOpen ? React.createElement('div', null, 'Asset Modal Open') : null),
}));

const mockDeleteMutate = vi.fn();

vi.mock('../api/client', () => ({
  useDirectory: vi.fn(() => ({ data: [] })),
}));

vi.mock('../api/asset.client', () => ({
  useAdminAssets: vi.fn(() => ({ data: [], isLoading: false })),
  useDeleteAsset: vi.fn(() => ({ mutate: mockDeleteMutate, isPending: false })),
}));

const ASSETS = [
  { id: 'A-1', name: 'MacBook Pro 16"', category: 'Laptop', status: 'Assigned', serialNumber: 'SN-001', purchaseDate: '2025-01-10', value: 2000000, assignedTo: 'EMP-1' },
  { id: 'A-2', name: 'Dell UltraSharp Monitor', category: 'Monitor', status: 'Assigned', serialNumber: 'SN-002', purchaseDate: '2025-02-15', value: 500000, assignedTo: null },
  { id: 'A-3', name: 'iPhone 15', category: 'Phone', status: 'Maintenance', serialNumber: 'SN-003', purchaseDate: '2025-03-20', value: 1000000, assignedTo: null },
];

const DIRECTORY = [{ id: 'EMP-1', name: 'Ada Lovelace', department: 'Engineering', avatar: '' }];

describe('AssetManagement', () => {
  beforeEach(() => {
    mockDeleteMutate.mockClear();
    vi.mocked(client.useDirectory).mockReturnValue({ data: DIRECTORY } as any);
    vi.mocked(assetClient.useAdminAssets).mockReturnValue({ data: ASSETS, isLoading: false } as any);
    vi.mocked(assetClient.useDeleteAsset).mockReturnValue({ mutate: mockDeleteMutate, isPending: false } as any);
    vi.spyOn(window, 'confirm');
  });

  it('computes inventory stats: total count, total value in millions, assigned rate, and maintenance count', () => {
    render(<AssetManagement />);

    // 3 assets, ₦(2,000,000 + 500,000 + 1,000,000) = ₦3.5M total value.
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('₦3.5M')).toBeInTheDocument();
    // 2 of 3 are "Assigned" -> round(66.67) = 67%.
    expect(screen.getByText('67%')).toBeInTheDocument();
    // 1 asset in Maintenance.
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows 0% assigned and no crash when there are no assets yet', () => {
    vi.mocked(assetClient.useAdminAssets).mockReturnValue({ data: [], isLoading: false } as any);

    render(<AssetManagement />);

    expect(screen.getByText('₦0.0M')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('filters by category via the toolbar chips', () => {
    render(<AssetManagement />);

    expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument();
    expect(screen.getByText('iPhone 15')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Phone'));

    expect(screen.queryByText('MacBook Pro 16"')).not.toBeInTheDocument();
    expect(screen.getByText('iPhone 15')).toBeInTheDocument();
  });

  it('combines the search box with the active category filter (AND, not OR)', () => {
    render(<AssetManagement />);

    fireEvent.click(screen.getByText('Laptop'));
    fireEvent.change(screen.getByPlaceholderText('Search serial, name...'), { target: { value: 'iphone' } });

    // "iPhone 15" matches the search but not the "Laptop" category filter.
    expect(screen.queryByText('iPhone 15')).not.toBeInTheDocument();
    expect(screen.queryByText('MacBook Pro 16"')).not.toBeInTheDocument();
  });

  it('shows the assignee\'s name and department when assignedTo matches a directory entry, and "Unassigned" otherwise', () => {
    render(<AssetManagement />);

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getAllByText('Unassigned')).toHaveLength(2); // the monitor and the phone
  });

  it('deletes an asset only after the confirm dialog is accepted', () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    render(<AssetManagement />);

    const macRow = screen.getByText('MacBook Pro 16"').closest('div.group')!;
    fireEvent.click(within(macRow as HTMLElement).getAllByRole('button').slice(-1)[0]); // trash icon is the last action button

    expect(mockDeleteMutate).not.toHaveBeenCalled();

    vi.mocked(window.confirm).mockReturnValue(true);
    fireEvent.click(within(macRow as HTMLElement).getAllByRole('button').slice(-1)[0]);

    expect(mockDeleteMutate).toHaveBeenCalledWith('A-1');
  });

  it('opens the Add Asset modal when "Add New Asset" is clicked', () => {
    render(<AssetManagement />);

    expect(screen.queryByText('Asset Modal Open')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Add New Asset'));
    expect(screen.getByText('Asset Modal Open')).toBeInTheDocument();
  });
});
