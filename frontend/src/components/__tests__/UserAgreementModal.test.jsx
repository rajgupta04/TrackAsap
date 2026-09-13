import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserAgreementModal from '../discussion/UserAgreementModal';

describe('UserAgreementModal Component', () => {
  it('should not render anything when isOpen is false', () => {
    const { container } = render(
      <UserAgreementModal isOpen={false} onAccept={vi.fn()} onClose={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('should render modal content, guidelines, and warning when isOpen is true', () => {
    render(<UserAgreementModal isOpen={true} onAccept={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByText('Community Agreement')).toBeInTheDocument();
    expect(screen.getByText('Be Respectful & Supportive')).toBeInTheDocument();
    expect(screen.getByText('No Harassment or Hate')).toBeInTheDocument();
    expect(screen.getByText(/permanently banned/i)).toBeInTheDocument();
  });

  it('should keep Accept button disabled until user checks agreement', () => {
    render(<UserAgreementModal isOpen={true} onAccept={vi.fn()} onClose={vi.fn()} />);

    const acceptBtn = screen.getByRole('button', { name: /accept & join community/i });
    expect(acceptBtn).toBeDisabled();

    // Check the box
    const checkbox = screen.getByText(/I agree to follow the community guidelines/i);
    fireEvent.click(checkbox);

    expect(acceptBtn).not.toBeDisabled();
  });

  it('should call onAccept when Accept button is clicked after agreeing', () => {
    const onAcceptMock = vi.fn();
    render(<UserAgreementModal isOpen={true} onAccept={onAcceptMock} onClose={vi.fn()} />);

    const checkbox = screen.getByText(/I agree to follow the community guidelines/i);
    fireEvent.click(checkbox);

    const acceptBtn = screen.getByRole('button', { name: /accept & join community/i });
    fireEvent.click(acceptBtn);

    expect(onAcceptMock).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Cancel button or close icon is clicked', () => {
    const onCloseMock = vi.fn();
    render(<UserAgreementModal isOpen={true} onAccept={vi.fn()} onClose={onCloseMock} />);

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
