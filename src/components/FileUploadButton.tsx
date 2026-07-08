import { useRef, type ReactNode } from 'react';

interface FileUploadButtonProps {
  accept?: string;
  onFile: (file: File) => void;
  className?: string;
  children: ReactNode;
}

export default function FileUploadButton({
  accept = 'image/*',
  onFile,
  className = '',
  children,
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
      <button type="button" onClick={() => inputRef.current?.click()} className={className}>
        {children}
      </button>
    </>
  );
}
