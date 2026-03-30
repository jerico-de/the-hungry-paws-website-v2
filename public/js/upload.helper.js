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

// =====================
// Vet Card Preview Modal
// =====================
async function showVetCardPreview(s3Key) {
  // Remove any existing modal
  document.getElementById("vetCardPreviewModal")?.remove();

  const modal = document.createElement("div");
  modal.id = "vetCardPreviewModal";
  modal.style.cssText = `
    position:fixed;inset:0;z-index:99999;
    background:rgba(0,0,0,0.82);
    display:flex;align-items:center;justify-content:center;
    padding:20px;
    animation:vcFadeIn .2s ease;
    font-family:"Segoe UI",Tahoma,sans-serif;
  `;

  // Inject keyframes once
  if (!document.getElementById("vcModalStyle")) {
    const s = document.createElement("style");
    s.id = "vcModalStyle";
    s.textContent = `
      @keyframes vcFadeIn{from{opacity:0}to{opacity:1}}
      @keyframes vcSlideUp{from{opacity:0;transform:translateY(24px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
      #vetCardPreviewModal .vc-box{
        background:#fff;border-radius:18px;
        max-width:780px;width:100%;max-height:90vh;
        display:flex;flex-direction:column;
        box-shadow:0 32px 80px rgba(0,0,0,0.45);
        animation:vcSlideUp .24s cubic-bezier(.34,1.3,.64,1);
        overflow:hidden;
      }
      #vetCardPreviewModal .vc-header{
        display:flex;align-items:center;justify-content:space-between;
        padding:16px 20px;border-bottom:1.5px solid #f0e0e8;
        flex-shrink:0;
      }
      #vetCardPreviewModal .vc-title{
        font-size:.95rem;font-weight:700;color:#9d174d;
        display:flex;align-items:center;gap:8px;
      }
      #vetCardPreviewModal .vc-close{
        width:32px;height:32px;border-radius:50%;
        border:none;background:#fee2e2;color:#991b1b;
        font-size:1rem;cursor:pointer;
        display:flex;align-items:center;justify-content:center;
        transition:background .15s;
      }
      #vetCardPreviewModal .vc-close:hover{background:#fca5a5;}
      #vetCardPreviewModal .vc-body{
        flex:1;overflow:auto;
        display:flex;align-items:center;justify-content:center;
        background:#f9f4f7;min-height:200px;
      }
      #vetCardPreviewModal .vc-img{
        max-width:100%;max-height:72vh;
        object-fit:contain;border-radius:0;
        display:block;
      }
      #vetCardPreviewModal .vc-pdf{
        width:100%;height:72vh;border:none;
      }
      #vetCardPreviewModal .vc-loading{
        display:flex;flex-direction:column;align-items:center;gap:12px;
        color:#9d174d;padding:40px;
      }
      #vetCardPreviewModal .vc-spinner{
        width:36px;height:36px;border:3px solid #f9c0d2;
        border-top-color:#d44d7c;border-radius:50%;
        animation:spin .7s linear infinite;
      }
      @keyframes spin{to{transform:rotate(360deg)}}
      #vetCardPreviewModal .vc-footer{
        padding:12px 20px;border-top:1.5px solid #f0e0e8;
        display:flex;justify-content:flex-end;gap:10px;flex-shrink:0;
      }
      #vetCardPreviewModal .vc-open-btn{
        padding:8px 18px;border-radius:20px;border:none;
        background:#d44d7c;color:#fff;font-weight:600;
        font-size:.85rem;cursor:pointer;
        font-family:"Segoe UI",Tahoma,sans-serif;
        transition:background .15s;
      }
      #vetCardPreviewModal .vc-open-btn:hover{background:#b83d6a;}
      #vetCardPreviewModal .vc-cancel-btn{
        padding:8px 18px;border-radius:20px;
        border:1.5px solid #e0e0e0;background:none;
        color:#777;font-weight:600;font-size:.85rem;
        cursor:pointer;font-family:"Segoe UI",Tahoma,sans-serif;
        transition:border-color .15s;
      }
      #vetCardPreviewModal .vc-cancel-btn:hover{border-color:#aaa;}
    `;
    document.head.appendChild(s);
  }

  modal.innerHTML = `
    <div class="vc-box">
      <div class="vc-header">
        <div class="vc-title">💉 Vaccine / Vet Card</div>
        <button class="vc-close" id="vcCloseBtn">✕</button>
      </div>
      <div class="vc-body" id="vcBody">
        <div class="vc-loading">
          <div class="vc-spinner"></div>
          <span>Loading file…</span>
        </div>
      </div>
      <div class="vc-footer">
        <button class="vc-cancel-btn" id="vcCancelBtn">Close</button>
        <button class="vc-open-btn" id="vcOpenTabBtn">Open in New Tab ↗</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";

  const close = () => {
    modal.remove();
    document.body.style.overflow = "";
  };

  document.getElementById("vcCloseBtn").onclick = close;
  document.getElementById("vcCancelBtn").onclick = close;
  modal.addEventListener("click", e => { if (e.target === modal) close(); });

  try {
    const url = await getSignedUrl(s3Key);

    // Wire up "open in new tab" button
    document.getElementById("vcOpenTabBtn").onclick = () => window.open(url, "_blank");

    const isPDF = s3Key.toLowerCase().endsWith(".pdf") ||
                  s3Key.includes("application/pdf") ||
                  url.includes(".pdf");

    const body = document.getElementById("vcBody");

    if (isPDF) {
      body.innerHTML = `<iframe class="vc-pdf" src="${url}"></iframe>`;
    } else {
      const img = document.createElement("img");
      img.className = "vc-img";
      img.alt = "Vet Card";
      img.onload = () => { body.innerHTML = ""; body.appendChild(img); };
      img.onerror = () => {
        body.innerHTML = `
          <div class="vc-loading" style="color:#991b1b;">
            <span style="font-size:2rem;">⚠️</span>
            <span>Could not load image. Try opening in a new tab.</span>
          </div>`;
      };
      img.src = url;
    }
  } catch (err) {
    document.getElementById("vcBody").innerHTML = `
      <div class="vc-loading" style="color:#991b1b;">
        <span style="font-size:2rem;">❌</span>
        <span>Could not load vet card.</span>
      </div>`;
  }
}
