import React, { useState } from "react";

const VNutrition: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [barcode, setBarcode] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] || null);
    setResult(null);
    setError(null);
  };

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value);
    setResult(null);
    setError(null);
  };

  const handleBarcodeLookup = async () => {
    if (!barcode) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      if (!res.ok) throw new Error("Product not found or API error");
      const data = await res.json();
      if (!data.product) throw new Error("No product found for this barcode");
      setResult({
        item: data.product.product_name,
        calories_per_serving: data.product.nutriments?.energy_kcal_serving,
        macros: {
          protein: data.product.nutriments?.proteins_serving,
          carbs: data.product.nutriments?.carbohydrates_serving,
          fat: data.product.nutriments?.fat_serving,
        },
        processed_level: data.product.nova_group,
        verdict: data.product.ingredients_text,
        snap_eligible: false, // OpenFoodFacts does not provide SNAP info
      });
    } catch (err: any) {
      setError(err.message || "Barcode lookup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vnutrition-upload">
      <h2>vNutrition: Image or Barcode to Nutrition</h2>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={loading}
      />
      <button onClick={handleUpload} disabled={!selectedFile || loading}>
        {loading ? "Analyzing..." : "Analyze Food Image"}
      </button>

      <div style={{ margin: "1em 0" }}>
        <input
          type="text"
          placeholder="Enter barcode/UPC"
          value={barcode}
          onChange={handleBarcodeChange}
          disabled={loading}
        />
        <button onClick={handleBarcodeLookup} disabled={!barcode || loading}>
          {loading ? "Looking up..." : "Lookup Barcode"}
        </button>
      </div>

      {error && <div style={{ color: "red" }}>{error}</div>}

      {result && (
        <div className="vnutrition-result">
          <h3>Detected: {result.item}</h3>
          <ul>
            <li>Calories per serving: {result.calories_per_serving}</li>
            <li>Protein: {result.macros.protein}</li>
            <li>Carbs: {result.macros.carbs}</li>
            <li>Fat: {result.macros.fat}</li>
            <li>Processed Level: {result.processed_level}</li>
            <li>
              SNAP Eligible:{" "}
              {result.snap_eligible ? "Yes" : "No"}
            </li>
            <li>
              Verdict: <b>{result.verdict}</b>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default VNutrition;