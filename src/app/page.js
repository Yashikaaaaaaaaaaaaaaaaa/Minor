"use client";
import { useState, useEffect } from "react";

export default function Page() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [cancelled, setCancelled] = useState(false);
  const [location, setLocation] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [locationDenied, setLocationDenied] = useState(false);

 const BACKEND_URL = "https://backendpneumo.onrender.com/predict";



  // Handle file change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setResult(null);
    setConfidence(0);
    setDoctors([]);
    if (file) setPreview(URL.createObjectURL(file));
  };

  // Ask for location permission
  const requestLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log("✅ Got location:", pos.coords);
          setLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
          setLocationDenied(false);
        },
        (err) => {
          console.error("❌ Location access denied:", err);
          setLocationDenied(true);
        }
      );
    } else {
      alert("Geolocation not supported in this browser.");
    }
  };

  // 🔍 Fetch nearby pulmonologists using OpenStreetMap Nominatim
  const fetchNearbyDoctors = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=pulmonologist&addressdetails=1&limit=6&countrycodes=in&viewbox=${lon - 0.05},${lat + 0.05},${lon + 0.05},${lat - 0.05}&bounded=1`
      );
      const data = await response.json();
      console.log("✅ Nearby pulmonologists:", data);
      setDoctors(data);
    } catch (error) {
      console.error("Error fetching nearby pulmonologists:", error);
    }
  };

  // Trigger doctor fetching when location is set after pneumonia detection
  useEffect(() => {
    if (location && result?.prediction?.toLowerCase().includes("pneumonia")) {
      fetchNearbyDoctors(location.lat, location.lon);
    }
  }, [location]);

  // Main prediction handler
  const handleSubmit = async () => {
    if (!selectedFile) {
      alert("Please select an X-ray image first!");
      return;
    }

    setLoading(true);
    setCancelled(false);
    setConfidence(0);

    // Simulate confidence loading
    let fakeConfidence = 0;
    const interval = setInterval(() => {
      if (fakeConfidence < 90 && !cancelled) {
        fakeConfidence += 5;
        setConfidence(fakeConfidence);
      } else {
        clearInterval(interval);
      }
    }, 300);

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Prediction request failed.");
      }

      const data = await response.json();
      setResult(data);
      setConfidence(parseFloat(data.confidence) || 100);

      // If pneumonia detected, try fetching nearby doctors
      if (data.prediction?.toLowerCase().includes("pneumonia")) {
        if (location) {
          fetchNearbyDoctors(location.lat, location.lon);
        } else {
          requestLocation();
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("⚠️ Error: Unable to get prediction. Please try again!");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setCancelled(true);
    setLoading(false);
    setConfidence(0);
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/normal.jpg')" }}
    >
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-md" />

      {/* Main Card */}
      <div className="relative z-10 w-[90%] max-w-md bg-white/40 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-2xl p-8 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Pneumonia Detection
        </h1>
        <p className="text-gray-600 text-sm mb-6">
          Upload a Chest X-ray to analyze using AI.
        </p>

        {/* Image Preview */}
        {preview && (
          <div className="mb-5">
            <img
              src={preview}
              alt="Preview"
              className="mx-auto rounded-xl border border-gray-300 shadow-lg w-full object-cover max-h-64"
            />
          </div>
        )}

        {/* Upload Input */}
        <input
          type="file"
          onChange={handleFileChange}
          accept="image/*"
          className="w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 
            file:rounded-full file:border-0 file:text-sm file:font-medium
            file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer mb-4"
        />

        {!loading && !result && (
          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-lg"
          >
            Upload & Analyze
          </button>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="mt-6 flex flex-col items-center">
            <div className="w-20 h-20 border-[6px] border-blue-300 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-700 text-sm mb-4">
              Analyzing X-ray for Pneumonia...
            </p>

            {/* Confidence Bar */}
            <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden mb-2">
              <div
                className="h-2 bg-blue-600 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${confidence}%` }}
              />
            </div>
            <p className="text-xs text-gray-700 mb-2">
              Confidence: {confidence}%
            </p>

            <button
              onClick={handleCancel}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div className="mt-6 bg-white/60 backdrop-blur-lg rounded-2xl shadow-inner p-5 border border-gray-200">
            <h2
              className={`text-lg font-semibold mb-2 ${
                result.prediction?.toLowerCase().includes("pneumonia")
                  ? "text-red-600"
                  : "text-blue-700"
              }`}
            >
              Prediction: {result.prediction}
            </h2>

            <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden mb-2">
              <div
                className={`h-2 ${
                  result.prediction?.toLowerCase().includes("pneumonia")
                    ? "bg-red-600"
                    : "bg-blue-600"
                } rounded-full transition-all duration-700 ease-in-out`}
                style={{
                  width: `${parseFloat(result.confidence) || 100}%`,
                }}
              />
            </div>
            <p className="text-sm text-gray-700 mb-1">
              Confidence: {result.confidence}%
            </p>

            <div className="text-sm text-gray-700 mt-2">
              <p>Normal: {result.probabilities?.NORMAL}</p>
              <p>Pneumonia: {result.probabilities?.PNEUMONIA}</p>
            </div>

            {/* Location Access */}
            {result.prediction?.toLowerCase().includes("pneumonia") &&
              !location &&
              !locationDenied && (
                <button
                  onClick={requestLocation}
                  className="mt-4 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
                >
                  Allow Location to Find Nearby Doctors
                </button>
              )}

            {/* Location Denied */}
            {locationDenied && (
              <p className="mt-3 text-sm text-red-600">
                Location access denied. Please enable location to find doctors
                near you.
              </p>
            )}

            {/* Nearby Doctors Section */}
            <div className="mt-6 w-full">
              {result.prediction?.toLowerCase().includes("pneumonia") &&
                location &&
                doctors.length === 0 &&
                !loading && (
                  <div className="flex items-center justify-center gap-2 bg-white/40 backdrop-blur-md rounded-xl p-3 shadow-inner border border-white/30 animate-pulse">
                    <svg
                      className="w-5 h-5 text-blue-600 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v4m0 8v4m8-8h-4m-8 0H4"
                      />
                    </svg>
                    <p className="text-sm text-gray-700 font-medium">
                      Searching for nearby doctors...
                    </p>
                  </div>
                )}

              {doctors.length > 0 && (
                <div className="mt-5 bg-white/40 backdrop-blur-lg rounded-2xl p-4 border border-white/30 shadow-lg transition-all duration-300 hover:shadow-xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    Nearby Doctors & Clinics
                  </h3>
                  <ul className="space-y-3">
                    {doctors.map((doc, i) => (
                      <li
                        key={i}
                        className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-800">
                            {doc.display_name.split(",")[0]}
                          </span>
                          <span className="text-xs text-gray-600 mt-1">
                            {doc.display_name
                              .split(",")
                              .slice(1, 3)
                              .join(", ")}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="relative z-10 mt-6 text-xs text-gray-700">
        Powered by AI Pneumonia Detection System
      </footer>
    </div>
  );
}
