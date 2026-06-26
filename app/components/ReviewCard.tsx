"use client";

import { Tables } from "../../database.types";
import {
  Star,
  MapPin,
  Calendar,
  CheckCircle,
} from "lucide-react";
import Image from "next/image";
import { MAX_REVIEW_PHOTOS_PREVIEW } from "../lib/constants/ui";

// ── Shared types ────────────────────────────────────────────────────

type GuestReview = Tables<"guest_reviews">;

export interface ReviewPhotoSimple {
  id: string;
  photo_url: string;
  caption: string | null;
  display_order: number | null;
}

export interface ReviewWithPhotos extends GuestReview {
  review_photos?: ReviewPhotoSimple[];
}

// ── Shared utilities ────────────────────────────────────────────────

export const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// ── ReviewCard props ────────────────────────────────────────────────

interface ReviewCardProps {
  review: ReviewWithPhotos;
  isTruncated: boolean;
  onViewMore: (review: ReviewWithPhotos) => void;
  onCheckTruncation: (el: HTMLParagraphElement | null, reviewId: string) => void;
}

// ── ReviewCard component ────────────────────────────────────────────

const ReviewCard = ({
  review,
  isTruncated,
  onViewMore,
  onCheckTruncation,
}: ReviewCardProps) => {
  return (
    <div className="group bg-card border border-border/60 hover:border-primary/40 p-4 xs:p-5 sm:p-6 lg:p-8 rounded-xl shadow-lg hover:bg-muted/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col">
      {/* Rating and Verification */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        {renderStars(review.rating)}
        <div className="flex items-center gap-2">
          {review.approved && (
            <div className="flex items-center gap-1 text-green-400 text-xs">
              <CheckCircle className="w-3 h-3" />
              <span>Approved</span>
            </div>
          )}
        </div>
      </div>

      {/* Review Text */}
      <div className="mb-4 sm:mb-6">
        <p
          ref={(el) => onCheckTruncation(el, review.id)}
          className="text-foreground/80 italic text-xs xs:text-sm sm:text-base leading-relaxed line-clamp-4"
        >
          &ldquo;{review.review_text}&rdquo;
        </p>
        {isTruncated && (
          <button
            type="button"
            onClick={() => onViewMore(review)}
            className="text-primary hover:text-primary/80 text-xs mt-1.5 transition-colors"
          >
            See more
          </button>
        )}
      </div>

      {/* Spacer — pushes photos + guest info to bottom on short reviews */}
      <div className="flex-1" />

      {/* Review Photos */}
      {review.review_photos &&
        review.review_photos.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <div className="grid grid-cols-3 gap-1.5 xs:gap-2 sm:gap-3">
              {review.review_photos
                .sort(
                  (a, b) =>
                    (a.display_order || 0) -
                    (b.display_order || 0)
                )
                .slice(0, MAX_REVIEW_PHOTOS_PREVIEW)
                .map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square overflow-hidden rounded-lg"
                  >
                    <Image
                      src={photo.photo_url}
                      alt={photo.caption || "Review photo"}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100px, (max-width: 1200px) 120px, 150px"
                    />
                  </div>
                ))}
            </div>
            {review.review_photos.length > 3 && (
              <p className="text-muted-foreground text-xs mt-2">
                +{review.review_photos.length - 3} more photo
                {review.review_photos.length - 3 > 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}

      {/* Guest Info */}
      <div className="border-t border-border pt-3 sm:pt-4 mt-auto">
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-0">
          <div>
            <p className="font-bold text-primary text-sm xs:text-base">
              - {review.guest_name}
            </p>
            {review.guest_location && (
              <div className="flex items-center gap-1 text-muted-foreground text-xs xs:text-sm mt-1">
                <MapPin className="w-3 h-3" />
                <span>{review.guest_location}</span>
              </div>
            )}
          </div>
          <div className="xs:text-right">
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(review.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
