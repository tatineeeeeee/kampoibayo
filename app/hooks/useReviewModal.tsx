'use client';

import { useState, useCallback } from 'react';
import { MODAL_ANIMATION_CLOSE_MS } from '@/app/lib/constants/timeouts';

interface UseReviewModalProps {
  bookingId?: number;
  guestName?: string;
  guestEmail?: string;
  trigger?: 'post-booking' | 'prompt' | 'manual';
}

interface UseReviewModalReturn {
  isOpen: boolean;
  modalProps: UseReviewModalProps;
  openModal: (props?: UseReviewModalProps) => void;
  closeModal: () => void;
}

export const useReviewModal = (): UseReviewModalReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalProps, setModalProps] = useState<UseReviewModalProps>({});

  const openModal = useCallback((props: UseReviewModalProps = {}) => {
    setModalProps(props);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setModalProps({});
    }, MODAL_ANIMATION_CLOSE_MS);
  }, []);

  return {
    isOpen,
    modalProps,
    openModal,
    closeModal
  };
};