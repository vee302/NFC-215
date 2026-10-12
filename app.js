// ===================================================
// NTAG215 Smart Card Landing Page Controller
// ===================================================

const DEFAULT_PROFILE = {
  name: "Alex Santos",
  title: "Content Creator & Tech Enthusiast",
  bio: "Tap any link below to connect with me across socials! ✨",
  fb: "https://facebook.com/yourprofile",
  ig: "@yourinstagram",
  tt: "@yourtiktok",
  phone: "+1 234 567 8900"
};

// State
let profileData = { ...DEFAULT_PROFILE };

// DOM Elements
const profileNameEl = document.getElementById("profileName");
const profileTitleEl = document.getElementById("profileTitle");
const profileBioEl = document.getElementById("profileBio");

const fbLinkEl = document.getElementById("fbLink");
const fbHandleEl = document.getElementById("fbHandle");

const igLinkEl = document.getElementById("igLink");
const igHandleEl = document.getElementById("igHandle");

const ttLinkEl = document.getElementById("ttLink");
const ttHandleEl = document.getElementById("ttHandle");

// Buttons & Modals
const saveContactBtn = document.getElementById("saveContactBtn");
const showQrBtn = document.getElementById("showQrBtn");
const shareCardBtn = document.getElementById("shareCardBtn");
const openEditorBtn = document.getElementById("openEditorBtn");

const qrModal = document.getElementById("qrModal");
const closeQrModal = document.getElementById("closeQrModal");
const qrImageElement = document.getElementById("qrImageElement");
const qrUrlText = document.getElementById("qrUrlText");
const copyModalUrlBtn = document.getElementById("copyModalUrlBtn");

const editorModal = document.getElementById("editorModal");
const closeEditorModal = document.getElementById("closeEditorModal");
const profileForm = document.getElementById("profileForm");
const resetEditorBtn = document.getElementById("resetEditorBtn");

// Form Inputs
const inputName = document.getElementById("inputName");
const inputTitle = document.getElementById("inputTitle");
const inputBio = document.getElementById("inputBio");
const inputFb = document.getElementById("inputFb");
const inputIg = document.getElementById("inputIg");
const inputTt = document.getElementById("inputTt");
const inputPhone = document.getElementById("inputPhone");

// Toast
const toastNotification = document.getElementById("toastNotification");
const toastMessage = document.getElementById("toastMessage");

// ===================================================
// Initialization
// ===================================================
function init() {
  loadSavedProfile();
  parseUrlParams();
  renderProfile();
  attachEvents();
}

// Format clean links & handles
function sanitizeSocialUrl(type, rawValue) {
  if (!rawValue) return { url: "#", handle: "" };
  let val = rawValue.trim();
  
  if (type === "fb") {
    if (val.startsWith("http://") || val.startsWith("https://")) {
      const match = val.replace(/https?:\/\/(www\.)?facebook\.com\/?/, "");
      return { url: val, handle: "fb.com/" + (match || "profile") };
    }
    return { url: `https://facebook.com/${val.replace(/^@/, '')}`, handle: `fb.com/${val.replace(/^@/, '')}` };
  }

  if (type === "ig") {
    if (val.startsWith("http://") || val.startsWith("https://")) {
      const match = val.replace(/https?:\/\/(www\.)?instagram\.com\/?/, "").replace(/\/$/, "");
      return { url: val, handle: "@" + (match || "instagram") };
    }
    const clean = val.replace(/^@/, "");
    return { url: `https://instagram.com/${clean}`, handle: `@${clean}` };
  }

  if (type === "tt") {
    if (val.startsWith("http://") || val.startsWith("https://")) {
      const match = val.replace(/https?:\/\/(www\.)?tiktok\.com\/@?/, "").replace(/\/$/, "");
      return { url: val, handle: "@" + (match || "tiktok") };
    }
    const clean = val.replace(/^@/, "");
    return { url: `https://tiktok.com/@${clean}`, handle: `@${clean}` };
  }

  return { url: val, handle: val };
}

// Render to DOM
function renderProfile() {
  profileNameEl.textContent = profileData.name;
  profileTitleEl.textContent = profileData.title;
  profileBioEl.textContent = profileData.bio;

  // Social Links
  const fb = sanitizeSocialUrl("fb", profileData.fb);
  fbLinkEl.href = fb.url;
  fbHandleEl.textContent = fb.handle;

  const ig = sanitizeSocialUrl("ig", profileData.ig);
  igLinkEl.href = ig.url;
  igHandleEl.textContent = ig.handle;

  const tt = sanitizeSocialUrl("tt", profileData.tt);
  ttLinkEl.href = tt.url;
  ttHandleEl.textContent = tt.handle;
}

// Load from LocalStorage
function loadSavedProfile() {
  try {
    const saved = localStorage.getItem("nfc_card_profile");
    if (saved) {
      profileData = { ...profileData, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn("Could not load from localStorage", e);
  }
}

// Support prefilling via URL parameters (e.g. ?name=Alex&fb=alexp&ig=alexp&tt=alexp)
function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("name")) profileData.name = params.get("name");
  if (params.has("title")) profileData.title = params.get("title");
  if (params.has("bio")) profileData.bio = params.get("bio");
  if (params.has("fb")) profileData.fb = params.get("fb");
  if (params.has("ig")) profileData.ig = params.get("ig");
  if (params.has("tt")) profileData.tt = params.get("tt");
  if (params.has("phone")) profileData.phone = params.get("phone");
}

// Show Toast
let toastTimer = null;
function showToast(msg) {
  toastMessage.textContent = msg;
  toastNotification.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastNotification.classList.remove("show");
  }, 2600);
}

// ===================================================
// Interactive Features
// ===================================================

// 1. Download vCard for Phone Contacts
function downloadVCard() {
  const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${profileData.name}
TITLE:${profileData.title}
TEL;TYPE=CELL:${profileData.phone || ''}
URL:${window.location.href}
NOTE:Facebook: ${profileData.fb}\\nInstagram: ${profileData.ig}\\nTikTok: ${profileData.tt}
END:VCARD`;

  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${profileData.name.replace(/\s+/g, '_')}_contact.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("Contact card (.vcf) ready to save!");
}

// 2. QR Code Generation
function openQrModal() {
  const currentUrl = window.location.href;
  qrUrlText.textContent = currentUrl;
  
  // Use high-speed QR image service
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&color=000000&bgcolor=ffffff&data=${encodeURIComponent(currentUrl)}`;
  qrImageElement.src = qrUrl;

  qrModal.classList.add("open");
  qrModal.setAttribute("aria-hidden", "false");
}

function closeQrModalView() {
  qrModal.classList.remove("open");
  qrModal.setAttribute("aria-hidden", "true");
}

// 3. Share Card Link
async function shareCard() {
  const currentUrl = window.location.href;
  const shareData = {
    title: `${profileData.name} - Digital Business Card`,
    text: `Connect with ${profileData.name} on Facebook, Instagram, and TikTok!`,
    url: currentUrl
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (err) {
      // Fallback to clipboard if user cancels or unsupported
    }
  }

  // Fallback copy to clipboard
  navigator.clipboard.writeText(currentUrl).then(() => {
    showToast("Link copied to clipboard!");
  }).catch(() => {
    showToast("Link copied from URL bar!");
  });
}

// 4. Editor Form
function openEditor() {
  inputName.value = profileData.name;
  inputTitle.value = profileData.title;
  inputBio.value = profileData.bio;
  inputFb.value = profileData.fb;
  inputIg.value = profileData.ig;
  inputTt.value = profileData.tt;
  inputPhone.value = profileData.phone;

  editorModal.classList.add("open");
  editorModal.setAttribute("aria-hidden", "false");
}

function closeEditor() {
  editorModal.classList.remove("open");
  editorModal.setAttribute("aria-hidden", "true");
}

function saveEditorData(e) {
  e.preventDefault();
  profileData.name = inputName.value.trim() || DEFAULT_PROFILE.name;
  profileData.title = inputTitle.value.trim() || DEFAULT_PROFILE.title;
  profileData.bio = inputBio.value.trim() || DEFAULT_PROFILE.bio;
  profileData.fb = inputFb.value.trim() || DEFAULT_PROFILE.fb;
  profileData.ig = inputIg.value.trim() || DEFAULT_PROFILE.ig;
  profileData.tt = inputTt.value.trim() || DEFAULT_PROFILE.tt;
  profileData.phone = inputPhone.value.trim() || DEFAULT_PROFILE.phone;

  try {
    localStorage.setItem("nfc_card_profile", JSON.stringify(profileData));
  } catch (err) {
    console.warn("Storage error", err);
  }

  renderProfile();
  closeEditor();
  showToast("Profile updated successfully!");
}

function resetEditorData() {
  if (confirm("Reset all profile details to default?")) {
    profileData = { ...DEFAULT_PROFILE };
    localStorage.removeItem("nfc_card_profile");
    renderProfile();
    closeEditor();
    showToast("Profile reset to default!");
  }
}

// ===================================================
// Event Listeners
// ===================================================
function attachEvents() {
  saveContactBtn.addEventListener("click", downloadVCard);
  showQrBtn.addEventListener("click", openQrModal);
  closeQrModal.addEventListener("click", closeQrModalView);
  
  copyModalUrlBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Link copied to clipboard!");
  });

  shareCardBtn.addEventListener("click", shareCard);
  
  openEditorBtn.addEventListener("click", openEditor);
  closeEditorModal.addEventListener("click", closeEditor);
  profileForm.addEventListener("submit", saveEditorData);
  resetEditorBtn.addEventListener("click", resetEditorData);

  // Close modals clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === qrModal) closeQrModalView();
    if (e.target === editorModal) closeEditor();
  });

  // Escape key to close modals
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeQrModalView();
      closeEditor();
    }
  });
}

// Launch
document.addEventListener("DOMContentLoaded", init);
