document.getElementById("csvFileInput").addEventListener("change", handleFile);
document.getElementById("downloadBtn").addEventListener("click", downloadCSV);

let transformedData = [];

function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  console.log("📂 File selected:", file.name);

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    console.log("📄 Raw file content loaded.");
    transformedData = transformCSV(text);
    displayTable(transformedData);
    document.getElementById("downloadBtn").disabled =
      transformedData.length === 0;
  };
  reader.readAsText(file);
}

function transformCSV(csvText) {
  const lines = csvText.trim().split("\n");
  const header = lines[0].trim();
  const output = [];

  console.log("🔍 Processing header:", header);

  if (!header.toLowerCase().includes("equities")) {
    console.error("❌ 'Equities' column not found.");
    return [];
  }

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;

    console.log(`🔹 Raw line [${i}]:`, raw);

    // Remove "logo"
    const cleaned = raw.replace(/\blogo\b/i, "").trim();
    console.log(`   🔧 Cleaned:`, cleaned);

    // Match first UPPERCASE word as symbol and remaining as company
    const match = cleaned.match(/^([A-Z]+)\s+(.*)$/);
    if (match) {
      const symbol = match[1];
      const company = match[2].trim();
      console.log(`   ✅ Extracted → Symbol: ${symbol}, Company: ${company}`);
      output.push({ Symbol: symbol, Company: company });
    } else {
      console.warn(`   ⚠️ Could not parse line:`, cleaned);
    }
  }

  console.log("✅ Transformation complete. Rows:", output.length);
  return output;
}

function displayTable(data) {
  const table = document.getElementById("csvTable");
  table.innerHTML = "";

  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const thead = table.insertRow();
  headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    thead.appendChild(th);
  });

  data.forEach((row) => {
    const tr = table.insertRow();
    headers.forEach((key) => {
      const td = tr.insertCell();
      td.textContent = row[key];
    });
  });
}

function downloadCSV() {
  if (!transformedData.length) return;

  const headers = Object.keys(transformedData[0]);
  const rows = transformedData.map((obj) => headers.map((key) => obj[key]));

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "Transformed.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
