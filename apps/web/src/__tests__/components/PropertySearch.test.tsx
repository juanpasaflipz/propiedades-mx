import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PropertySearch from '@/components/PropertySearch';

describe('PropertySearch', () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    mockOnSearch.mockClear();
  });

  it('renders all search filters', () => {
    render(<PropertySearch onSearch={mockOnSearch} />);

    // Check if all filter inputs are rendered
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/transaction type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/min price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/property type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/min bedrooms/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/min bathrooms/i)).toBeInTheDocument();
  });

  it('calls onSearch with filter values when form is submitted', async () => {
    render(<PropertySearch onSearch={mockOnSearch} />);

    // Fill in the form
    await userEvent.selectOptions(screen.getByLabelText(/country/i), 'Mexico');
    await userEvent.type(screen.getByLabelText(/city/i), 'Mexico City');
    await userEvent.selectOptions(screen.getByLabelText(/transaction type/i), 'sale');
    await userEvent.type(screen.getByLabelText(/min price/i), '100000');
    await userEvent.type(screen.getByLabelText(/max price/i), '500000');
    await userEvent.selectOptions(screen.getByLabelText(/property type/i), 'apartment');
    await userEvent.type(screen.getByLabelText(/min bedrooms/i), '2');
    await userEvent.type(screen.getByLabelText(/min bathrooms/i), '2');

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    // Check if onSearch was called with the correct values
    expect(mockOnSearch).toHaveBeenCalledWith({
      country: 'Mexico',
      city: 'Mexico City',
      transactionType: 'sale',
      minPrice: '100000',
      maxPrice: '500000',
      propertyType: 'apartment',
      minBedrooms: '2',
      minBathrooms: '2',
    });
  });

  it('handles empty form submission', () => {
    render(<PropertySearch onSearch={mockOnSearch} />);

    // Submit the form without filling any values
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    // Check if onSearch was called with empty values
    expect(mockOnSearch).toHaveBeenCalledWith({
      country: '',
      city: '',
      transactionType: '',
      minPrice: '',
      maxPrice: '',
      propertyType: '',
      minBedrooms: '',
      minBathrooms: '',
    });
  });
}); 