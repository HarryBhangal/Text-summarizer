async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab found.");
  return tab;
}

async function getSelectedTextFromPage(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const sel = window.getSelection?.();
      const txt = sel ? String(sel.toString() || "").trim() : "";
      return txt;
    },
  });
  return (result || "").trim();
}

async function postSummary(endpoint, text) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const detail = data?.detail ? String(data.detail) : `HTTP ${res.status}`;
    throw new Error(detail);
  }

  const summary = data?.summary;
  if (typeof summary !== "string") throw new Error("Unexpected response from backend.");
  return summary;
}

function setStatus(el, msg, kind) {
  el.textContent = msg || "";
  el.classList.remove("error", "ok");
  if (kind) el.classList.add(kind);
}

function setPill(el, label, kind) {
  el.textContent = label || "Idle";
  el.classList.remove("ok", "warn", "err");
  if (kind) el.classList.add(kind);
}

function wire() {
  const endpointEl = document.getElementById("endpoint");
  const inputEl = document.getElementById("inputText");
  const outputEl = document.getElementById("outputText");
  const btnSummarize = document.getElementById("btnSummarize");
  const btnPaste = document.getElementById("btnPaste");
  const btnCopy = document.getElementById("btnCopy");
  const btnClear = document.getElementById("btnClear");
  const statusEl = document.getElementById("status");
  const pillEl = document.getElementById("statusPill");

  setPill(pillEl, "Idle");

  async function pasteSelection() {
    setPill(pillEl, "Reading", "warn");
    setStatus(statusEl, "Reading selection…");
    const tab = await getActiveTab();
    const selected = await getSelectedTextFromPage(tab.id);
    if (!selected) {
      setPill(pillEl, "No selection", "warn");
      setStatus(statusEl, "No selection found. Highlight text on the page first.", "error");
      return;
    }
    inputEl.value = selected;
    setPill(pillEl, "Ready", "ok");
    setStatus(statusEl, `Loaded ${selected.length} chars from selection.`, "ok");
  }

  btnPaste.addEventListener("click", () => {
    pasteSelection().catch((e) => {
      setPill(pillEl, "Error", "err");
      setStatus(statusEl, e.message || String(e), "error");
    });
  });

  btnClear.addEventListener("click", () => {
    inputEl.value = "";
    outputEl.value = "";
    setPill(pillEl, "Idle");
    setStatus(statusEl, "");
  });

  btnCopy.addEventListener("click", async () => {
    try {
      const text = String(outputEl.value || "").trim();
      if (!text) {
        setStatus(statusEl, "Nothing to copy yet.", "error");
        return;
      }
      await navigator.clipboard.writeText(text);
      setStatus(statusEl, "Copied summary to clipboard.", "ok");
    } catch (e) {
      setStatus(statusEl, e?.message || "Copy failed. Try selecting and Ctrl+C.", "error");
    }
  });

  btnSummarize.addEventListener("click", () => {
    (async () => {
      const endpoint = String(endpointEl.value || "").trim();
      const text = String(inputEl.value || "").trim();
      if (!endpoint) {
        setPill(pillEl, "Missing endpoint", "err");
        setStatus(statusEl, "Set the backend endpoint first.", "error");
        return;
      }
      if (!text) {
        await pasteSelection();
        if (!String(inputEl.value || "").trim()) return;
      }

      btnSummarize.disabled = true;
      btnPaste.disabled = true;
      btnCopy.disabled = true;
      btnClear.disabled = true;
      outputEl.value = "";
      setPill(pillEl, "Summarizing", "warn");
      setStatus(statusEl, "Summarizing… (first run may download the model)");

      let summary;
      try {
        summary = await postSummary(endpoint, String(inputEl.value || "").trim());
      } catch (e) {
        const msg = e?.name === "AbortError" ? "Timed out. Is the backend running / downloading the model?" : (e?.message || String(e));
        setPill(pillEl, "Error", "err");
        setStatus(statusEl, msg, "error");
        return;
      }
      outputEl.value = summary;
      setPill(pillEl, "Done", "ok");
      setStatus(statusEl, "Done.", "ok");
    })().catch((e) => {
      setPill(pillEl, "Error", "err");
      setStatus(statusEl, e.message || String(e), "error");
    })
      .finally(() => {
        btnSummarize.disabled = false;
        btnPaste.disabled = false;
        btnCopy.disabled = false;
        btnClear.disabled = false;
      });
  });

  // Best-effort: prefill with current selection when popup opens.
  pasteSelection().catch(() => {
    setPill(pillEl, "Idle");
  });
}

document.addEventListener("DOMContentLoaded", wire);

