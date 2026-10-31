import React, { useState } from 'react';

interface SafeProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export const SafeProductImage: React.FC<SafeProductImageProps> = ({
  src,
  alt,
  className = "w-full h-full object-contain",
  containerClassName = "w-full h-full flex items-center justify-center bg-white"
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={`${containerClassName} border border-[#e5f1f3] rounded-xl p-2 text-center text-[#9ca3af]`}>
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="material-symbols-outlined text-2xl text-[#cbd5e1]">image_not_supported</span>
          <span className="text-[10px] leading-tight font-medium text-[#6b7280]">
            Image unavailable
          </span>
          <span className="text-[9px] text-[#9ca3af]">暂无图片</span>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <img
        src={src}
        alt={alt}
        className={className}
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </div>
  );
};
