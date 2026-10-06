import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, CameraOff, AlertCircle, RefreshCw } from 'lucide-react';

export default function BarcodeScanner({ onScanSuccess, isScanningActive }) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const scannerRef = useRef(null);
  const html5QrcodeScanner = useRef(null);

  const startScanner = async () => {
    setCameraError(null);
    try {
      if (!html5QrcodeScanner.current) {
        html5QrcodeScanner.current = new Html5Qrcode("reader");
      }

      const config = {
        fps: 10,
        qrbox: { width: 260, height: 160 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.CODE_128
        ]
      };

      await html5QrcodeScanner.current.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          onScanSuccess(decodedText);
        },
        () => {
          // Ignore parse errors on every frame
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error("Chyba při spuštění kamery:", err);
      let errorMsg = "Kameru se nepodařilo spustit.";
      if (err?.name === "NotAllowedError" || String(err).includes("Permission")) {
        errorMsg = "Povolte prosím přístup ke kameře v nastavení prohlížeče.";
      } else if (err?.name === "NotFoundError" || String(err).includes("DevicesNotFoundError")) {
        errorMsg = "Nebylo nalezeno žádné kamerové zařízení.";
      } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        errorMsg = "Kamera vyžaduje zabezpečené připojení HTTPS.";
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
    if (isScanningActive && !isScanning) {
      startScanner();
    } else if (!isScanningActive && isScanning) {
      stopScanner();
    }

    return () => {
      if (html5QrcodeScanner.current && html5QrcodeScanner.current.isScanning) {
        html5QrcodeScanner.current.stop().catch(() => {});
      }
    };
  }, [isScanningActive]);

  return (
    <div className="w-full flex flex-col items-center bg-white p-4 rounded-xl shadow-md border border-slate-200">
      <div className="relative w-full max-w-md bg-slate-900 rounded-lg overflow-hidden min-h-[260px] flex items-center justify-center">
        <div id="reader" className="w-full"></div>

        {!isScanning && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center bg-slate-800">
            <Camera className="w-16 h-16 text-emerald-400 mb-3 animate-pulse" />
            <p className="font-semibold text-lg mb-1">Kamera je připravena</p>
            <p className="text-slate-300 text-sm mb-4">Naměřte čárový kód nebo ISBN na zadní straně knihy</p>
            <button
              onClick={startScanner}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg transition duration-200"
            >
              <Camera className="w-5 h-5" /> Zapnout skener
            </button>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-red-950 text-red-100">
            <AlertCircle className="w-12 h-12 text-red-400 mb-2" />
            <p className="font-semibold text-base mb-2">{cameraError}</p>
            <p className="text-xs text-red-300 mb-4">
              Můžete také použít ruční vyhledávání podle ISBN nebo názvu níže.
            </p>
            <button
              onClick={startScanner}
              className="bg-red-800 hover:bg-red-700 text-white font-medium text-sm px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Zkusit znovu
            </button>
          </div>
        )}
      </div>

      {isScanning && (
        <div className="mt-3 flex items-center justify-between w-full max-w-md px-2 text-sm text-slate-600">
          <span className="flex items-center gap-2 text-emerald-600 font-medium">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Skener je aktivní...
          </span>
          <button
            onClick={stopScanner}
            className="text-xs text-slate-500 hover:text-slate-800 underline flex items-center gap-1"
          >
            <CameraOff className="w-3.5 h-3.5" /> Vypnout kameru
          </button>
        </div>
      )}
    </div>
  );
}
