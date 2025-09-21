import React, { useState, useRef, useCallback } from "react";
import { storage } from "./firebase"; // Make sure this path is correct
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import Loader from "./Loader"; // ✅ Added Loader import

// --- Utility Icons (as inline SVGs) ---
const UploadCloudIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);

const FileIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
  </svg>
);

const CloseIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const SendIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

// --- Success and Error Icons ---
const SuccessIcon = () => (
  <svg className="file-item__status-icon success" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg>
);

const ErrorIcon = () => (
  <svg className="file-item__status-icon error" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"></path></svg>
);


// --- FileUploader Component ---
export default function FileUploader() {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // ✅ new loader state
  const fileInputRef = useRef(null);

  const MAX_FILES = 10;

  const handleNewFiles = useCallback(
    (newFiles) => {
      const filesArray = Array.from(newFiles);
      const filesWithStatus = filesArray.map(file => ({
        file,
        progress: 0,
        status: 'pending',
        error: null,
      }));

      setFiles((prevFiles) => {
        const updatedFiles = [...prevFiles, ...filesWithStatus];
        if (updatedFiles.length > MAX_FILES) {
          console.warn(`Cannot upload more than ${MAX_FILES} files.`);
          return updatedFiles.slice(0, MAX_FILES);
        }
        return updatedFiles;
      });
    },
    [MAX_FILES]
  );

  const removeFile = (fileName) => {
    setFiles(prevFiles => prevFiles.filter((f) => f.file.name !== fileName));
  };

  const handleSend = (e) => {
    e.stopPropagation();
    const filesToUpload = files.filter(f => f.status === 'pending');
    if (filesToUpload.length === 0) return;

    setIsUploading(true); // ✅ show loader

    let completedUploads = 0;

    filesToUpload.forEach((fileWrapper) => {
      const { file } = fileWrapper;
      const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      setFiles(prevFiles => prevFiles.map(f => f.file.name === file.name ? { ...f, status: 'uploading' } : f));

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setFiles(prevFiles => prevFiles.map(f =>
            f.file.name === file.name ? { ...f, progress: progress } : f
          ));
        },
        (error) => {
          console.error(`Upload failed for ${file.name}:`, error);
          setFiles(prevFiles => prevFiles.map(f =>
            f.file.name === file.name ? { ...f, status: 'error', error: error.message } : f
          ));
          completedUploads++;
          if (completedUploads === filesToUpload.length) setIsUploading(false);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            console.log(`File ${file.name} available at`, downloadURL);
            setFiles(prevFiles => prevFiles.map(f =>
              f.file.name === file.name ? { ...f, status: 'success', progress: 100 } : f
            ));
            completedUploads++;
            if (completedUploads === filesToUpload.length) setIsUploading(false);
          });
        }
      );
    });
  };

  const onFileChange = (e) => {
    handleNewFiles(e.target.files);
    if(e.target.files[0].size > 5242880){
      alert("File size is to big. Keep it less than 5mb.")
      e.target.value = "";
      setFiles([])
    }
      
  };

  const onDropZoneClick = () => fileInputRef.current && fileInputRef.current.click();

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleNewFiles(e.dataTransfer.files);
    },
    [handleNewFiles]
  );

  return (
    <div className="file-uploader">
      <h1 className="file-uploader__title">PitchScope</h1>

      {isUploading && (
  <div className="loader-overlay">
    <Loader />
  </div>
)} {/* ✅ Show loader during uploads */}

      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        className="hidden-input"
        multiple
        accept=".pdf,.doc,.docx,.txt"
      />

      <div
        onClick={onDropZoneClick}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`drop-zone ${isDragging ? "dragging" : ""}`}
      >
        <div className="drop-zone__content">
          <UploadCloudIcon className="drop-zone__icon" />
          <p className="drop-zone__text">
            Drag & drop files here, or <span>browse</span>
          </p>
          <p className="drop-zone__hint">Maximum {MAX_FILES} files</p>
        </div>

        {files.length > 0 && (
          <button
            onClick={handleSend}
            className="send-button"
            aria-label="Send files"
            disabled={isUploading} // ✅ disable while uploading
          >
            <SendIcon className="send-button__icon" />
          </button>
        )}
      </div>

      {files.length > 0 && (
        <div className="files-preview">
          <h2 className="files-preview__title">Selected Files:</h2>
          <div className="files-preview__grid">
            {files.map((fileWrapper, index) => (
              <div key={index} className="file-item">
                <FileIcon className="file-item__icon" />
                <div className="file-item__details">
                  <span className="file-item__name" title={fileWrapper.file.name}>
                    {fileWrapper.file.name}
                  </span>
                  {fileWrapper.status === 'uploading' && (
                    <div className="progress-bar-container">
                      <div className="progress-bar" style={{ width: `${fileWrapper.progress}%` }}></div>
                    </div>
                  )}
                  {fileWrapper.status === 'error' && <p className="error-message">Upload failed</p>}
                </div>

                <div className="file-item__status">
                  {fileWrapper.status === 'success' && <SuccessIcon />}
                  {fileWrapper.status === 'error' && <ErrorIcon />}
                  {fileWrapper.status !== 'success' && fileWrapper.status !== 'error' && (
                    <button
                      onClick={() => removeFile(fileWrapper.file.name)}
                      className="file-item__remove-button"
                      aria-label={`Remove ${fileWrapper.file.name}`}
                    >
                      <CloseIcon className="file-item__remove-icon" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
