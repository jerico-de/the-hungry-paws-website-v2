// =====================
// File Validation
// =====================
function validateFile(file, type = "image") {
  const imageTypes = ["image/jpeg", "image/png", "image/webp"];
  const docTypes = ["application/pdf"];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (file.size > maxSize) return "File is too large. Maximum size is 10MB.";
  if (type === "image" && !imageTypes.includes(file.type)) return "Only JPG, PNG, or WEBP images are allowed.";
  if (type === "pdf" && !docTypes.includes(file.type)) return "Only PDF files are allowed.";
  return null;
}

// =====================
// Upload to S3
// =====================
async function uploadToS3(file, endpoint) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(endpoint, { method: "POST", body: formData });
  const data = await res.json();

  if (!res.ok || !data.success) throw new Error(data.error || "Upload failed");
  return data.fileName; // S3 key — save this to DB
}

// =====================
// Get Signed URL
// =====================
async function getSignedUrl(fileName) {
  const res = await fetch(`/api/file?name=${encodeURIComponent(fileName)}`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error("Could not retrieve file URL");
  return data.url;
}
