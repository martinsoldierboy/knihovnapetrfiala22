import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, CameraOff, AlertCircle, RefreshCw, SwitchCamera } from 'lucide-react';

export default function BarcodeScanner({ onScanSuccess }) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const html5QrcodeScanner = useRef(null);

  useEffect(() => {
    // Get list of available camera devices (especially useful for Android devices with multiple cameras)
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back/environment camera if identifiable
          const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('zadní') || d.label.toLowerCase().includes('environment'));
          if (backCam) {
            setSelectedCameraId(backCam.id);
          } else {
            setSelectedCameraId(devices[devices.length - 1].id); // Usually rear camera is last on Android
          }
        }
      })
      .catch(() => {
        // Camera enumeration error ignored, will use constraint fallback
      });
  }, []);

  const startScanner = async () => {
    setCameraError(null);
    try {
      if (!html5QrcodeScanner.current) {
        html5QrcodeScanner.current = new Html5Qrcode("reader");
      }

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minDim = Math.min(viewfinderWidth, viewfinderHeight);
          return {
            width: Math.floor(minDim * 0.8),
            height: Math.floor(minDim * 0.5)
          };
        },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.CODE_128
        ]
      };

      const cameraConstraint = selectedCameraId
        ? selectedCameraId
        : { facingMode: "environment" };

      await html5QrcodeScanner.current.start(
        cameraConstraint,
        config,
        (decodedText) => {
          onScanSuccess(decodedText);
        },
        () => {
          // Frame parse error callback ignored
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error("Chyba při spuštění kamery na Androidu:", err);
      let errorMsg = "Kameru se nepodařilo spustit.";
      if (err?.name === "NotAllowedError" || String(err).includes("Permission")) {
        errorMsg = "Povolte prosím přístup ke kameře v prohlížeči telefonu Android.";
      } else if (err?.name === "NotFoundError" || String(err).includes("DevicesNotFoundError")) {
        errorMsg = "Nebylo nalezeno žádné kamerové zařízení.";
      } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        errorMsg = "Kamera v Androidu vyžaduje zabezpečené připojení HTTPS.";
      }
      setCameraError(errorMsg);
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrcodeScanner.current && isScanning) {
      try {
        await html5QrcodeScanner.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Chyba při zastavení skeneru:", err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrcodeScanner.current && html5QrcodeScanner.current.isScanning) {
        html5QrcodeScanner.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center bg-white p-3 sm:p-4 rounded-xl shadow-md border border-slate-200">
      <div className="relative w-full max-w-md bg-slate-900 rounded-xl overflow-hidden min-h-[280px] sm:min-h-[300px] flex items-center justify-center">
        <div id="reader" className="w-full h-full min-h-[280px]"></div>

        {!isScanning && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-5 text-center bg-slate-800">
            <Camera className="w-16 h-16 text-emerald-400 mb-3" />
            <p className="font-bold text-lg mb-1">Kamera Android je připravena</p>
            <p className="text-slate-300 text-sm mb-4 max-w-xs">
              Naměřte fotoaparát na čárový kód nebo ISBN na zadní straně knihy.
            </p>

            {cameras.length > 1 && (
              <div className="mb-4 w-full max-w-xs">
                <label className="text-xs text-slate-400 flex items-center justify-center gap-1 mb-1">
                  <SwitchCamera className="w-3.5 h-3.5" /> Výběr fotoaparátu:
                </label>
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="w-full text-xs bg-slate-700 text-white border border-slate-600 rounded-lg px-2 py-1.5 focus:outline-none"
                >
                  {cameras.map((cam) => (
                    <option key={cam.id} value={cam.id}>
                      {cam.label || `Fotoaparát ${cam.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={startScanner}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold px-7 py-3.5 rounded-xl flex items-center gap-2 shadow-lg transition duration-200 text-base active:scale-95 touch-manipulation"
            >
              <Camera className="w-6 h-6" /> Spustit skenování
            </button>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-5 bg-red-950 text-red-100">
            <AlertCircle className="w-12 h-12 text-red-400 mb-2" />
            <p className="font-semibold text-base mb-2">{cameraError}</p>
            <p className="text-xs text-red-300 mb-4">
              Můžete také použít ruční vyhledávání podle ISBN nebo názvu níže.
            </p>
            <button
              onClick={startScanner}
              className="bg-red-800 hover:bg-red-700 active:bg-red-900 text-white font-medium text-sm px-5 py-2.5 rounded-lg flex items-center gap-2 active:scale-95 touch-manipulation"
            >
              <RefreshCw className="w-4 h-4" /> Zkusit znovu
            </button>
          </div>
        )}
      </div>

      {isScanning && (
        <div className="mt-3 flex items-center justify-between w-full max-w-md px-1 text-sm text-slate-600">
          <span className="flex items-center gap-2 text-emerald-600 font-semibold text-xs sm:text-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Skenování probíhá...
          </span>
          <button
            onClick={stopScanner}
            className="text-xs text-slate-500 hover:text-slate-800 underline flex items-center gap-1 font-medium p-1 touch-manipulation"
          >
            <CameraOff className="w-4 h-4" /> Vypnout kameru
          </button>
        </div>
      )}
    </div>
  );
}
