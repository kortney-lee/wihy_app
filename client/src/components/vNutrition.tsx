import React, { useState } from "react";
import { openFoodFactsAPI } from '../services/openFoodFactsAPI';

const VNutrition: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [barcode, setBarcode] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
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
    if (!barcode.trim()) {
      setError("Please enter a barcode");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const result = await openFoodFactsAPI.getProductByBarcode(barcode.trim());
      
      if (result.success) {
        setResult(result);
      } else {
        throw new Error(result.message || 'Product not found');
      }
    } catch (err: any) {
      console.error('Barcode lookup failed:', err);
      setError(err.message || "Barcode lookup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleProductSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await openFoodFactsAPI.searchProducts(query.trim(), 5);
      
      if (result.success && result.products) {
        console.log('Found products:', result.products);
        // Handle search results (maybe show in a dropdown or list)
      } else {
        console.log('No products found');
      }
    } catch (err: any) {
      console.error('Product search failed:', err);
      setError('Product search failed');
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
    <div className="vnutrition-container">
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

      {error && <div className="error-message">{error}</div>}
      
      {result && (
        <div className="nutrition-result">
          <h3>{result.item}</h3>
          <p><strong>Calories:</strong> {result.calories_per_serving} per serving</p>
          <p><strong>Protein:</strong> {result.macros?.protein}</p>
          <p><strong>Carbs:</strong> {result.macros?.carbs}</p>
          <p><strong>Fat:</strong> {result.macros?.fat}</p>
          <p><strong>Processing Level:</strong> {result.processed_level}</p>
          {result.verdict && <p><strong>Details:</strong> {result.verdict}</p>}
        </div>
      )}
    </div>
  );
};

export default VNutrition;