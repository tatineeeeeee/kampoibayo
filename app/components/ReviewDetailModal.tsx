"use client";

import {
  MapPin,
  Calendar,
  CheckCircle,
  X,
} from "lucide-react";
import Image from "next/image";
import { renderStars, formatDate } from "./ReviewCard";
import type { ReviewWithPhotos } from "./ReviewCard";
import { MAX_REVIEW_PHOTOS_PREVIEW } from "../lib/constants/ui";

interface ReviewDetailModalProps {
  review: ReviewWithPhotos;
  onClose: () => void;
}

const ReviewDetailModal = ({ review, onClose }: ReviewDetailModalProps) => {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            {renderStars(review.rating)}
            {review.approved && (
              <span className="flex items-center gap-1 text-green-400 text-xs">
                <CheckCircle className="w-3 h-3" /> Approved
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="Close review"
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <p className="text-foreground/80 italic text-sm leading-relaxed">
            &ldquo;{review.review_text}&rdquo;
          </p>

          {/* Photos */}
          {review.review_photos && review.review_photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {review.review_photos.slice(0, MAX_REVIEW_PHOTOS_PREVIEW).map((photo) => (
                <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={photo.photo_url}
                    alt={photo.caption || "Review photo"}
                    fill
                    className="object-cover"
                    sizes="150px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border">
          <p className="font-bold text-primary text-sm">- {review.guest_name}</p>
          {review.guest_location && (
            <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
              <MapPin className="w-3 h-3" />
              <span>{review.guest_location}</span>
            </div>
          )}
          {review.created_at && (
            <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(review.created_at)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailModal;
