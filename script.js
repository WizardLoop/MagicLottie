let animation = null;

const lottieContainer = document.getElementById('lottie-preview');
const fileInput = document.getElementById('file-input');
const jsonEditor = document.getElementById('json-editor');
const exportJsonBtn = document.getElementById('export-json');
const exportTgsBtn = document.getElementById('export-tgs');
const refreshBtn = document.getElementById('refresh');

function clearLottie() {
  if (animation) {
    try { animation.destroy(); } catch {}
    lottieContainer.innerHTML = '';
    animation = null;
  }
}

function showError(msg) {
  alert(msg);
  console.error(msg);
}

function renderLottie(jsonString) {
  clearLottie();
  let json;
  try {
    json = JSON.parse(jsonString);
  } catch (e) {
    showError('Invalid JSON: ' + e.message);
    return;
  }
  try {
    animation = lottie.loadAnimation({
      container: lottieContainer,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: json,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet',
        clearCanvas: true,
        progressiveLoad: true,
        className: 'lottie-svg'
      }
    });
    animation.addEventListener('DOMLoaded', function () {
      console.log('Lottie animation loaded!');
    });
    animation.addEventListener('data_failed', function () {
      showError('Failed to render animation: Lottie data error');
    });
    animation.addEventListener('error', function (e) {
      showError('Lottie error: ' + e.message);
    });
  } catch (e) {
    showError('Failed to load animation: ' + e.message);
  }
}

fileInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();

  if (file.name.endsWith('.tgs')) {
    reader.onload = () => {
      try {
        const compressed = new Uint8Array(reader.result);
        let decompressed;
        try {
          decompressed = pako.ungzip(compressed, { to: 'string' });
        } catch (decompErr) {
          try {
            const decoder = new TextDecoder("utf-8");
            decompressed = decoder.decode(pako.ungzip(compressed));
          } catch {
            throw decompErr;
          }
        }
        jsonEditor.value = decompressed;
        renderLottie(decompressed);
      } catch (err) {
        showError("Invalid TGS file: " + (err.message || err));
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    reader.onload = () => {
      jsonEditor.value = reader.result;
      renderLottie(reader.result);
    };
    reader.readAsText(file);
  }
});

refreshBtn.addEventListener('click', () => {
  renderLottie(jsonEditor.value);
});

// Export as JSON
exportJsonBtn.addEventListener('click', () => {
  const data = jsonEditor.value;
  try {
    JSON.parse(data); // Validate before export
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "animation.json";
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    showError('Cannot export: Invalid JSON');
  }
});

// Export as TGS (gzip)
exportTgsBtn.addEventListener('click', () => {
  try {
    const json = JSON.parse(jsonEditor.value);
    const stringData = JSON.stringify(json);
    const compressed = pako.gzip(stringData);
    const blob = new Blob([compressed], { type: "application/gzip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "animation.tgs";
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    showError('Cannot export: Invalid JSON for TGS');
  }
});
