'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Navbar, ActiveTab } from '../components/Navbar';
import { VehicleInspector } from '../components/VehicleInspector';
import { CargoManifestDashboard } from '../components/CargoManifestDashboard';
import { DetectionHistory } from '../components/DetectionHistory';
import { PlateDetailModal } from '../components/PlateDetailModal';
import { AccessManagerModal } from '../components/AccessManagerModal';
import { GatePassSlipModal } from '../components/GatePassSlipModal';
import { EditVehicleModal } from '../components/EditVehicleModal';
import { DetectionResult, WhitelistRule } from '@alpr/shared-types';
import { INITIAL_WHITELIST_RULES, DEMO_SAMPLES } from '../lib/alpr/sampleData';
import { getOcrWorker } from '../lib/alpr/ocrEngine';
import { loadOnnxModel } from '../lib/alpr/onnxDetector';
import { loadCharDetector } from '../lib/alpr/charDetector';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const LOCAL_STORAGE_KEYS = {
  HISTORY: 'alpr_history',
  WHITELIST: 'alpr_whitelist',
  SOUND: 'alpr_sound',
};

const MAX_LOCAL_HISTORY = 50;

function saveLocalHistory(data: DetectionResult[]): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = data.slice(0, MAX_LOCAL_HISTORY);
    localStorage.setItem(LOCAL_STORAGE_KEYS.HISTORY, JSON.stringify(trimmed));
  } catch (err) {
    try {
      const compact = data.slice(0, 25).map((item) => ({
        ...item,
        sourceImage: item.sourceImage && item.sourceImage.length > 200000 ? item.plateCropImage : item.sourceImage,
      }));
      localStorage.setItem(LOCAL_STORAGE_KEYS.HISTORY, JSON.stringify(compact));
    } catch (e2) {
      console.warn('LocalStorage quota reached, could not persist full history:', e2);
    }
  }
}

function loadLocalHistory(): DetectionResult[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.HISTORY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch (err) {
    console.warn('Failed to parse history from localStorage:', err);
    return null;
  }
}

function saveLocalWhitelist(rules: WhitelistRule[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.WHITELIST, JSON.stringify(rules));
  } catch (err) {
    console.warn('Failed to save whitelist to localStorage:', err);
  }
}

function loadLocalWhitelist(): WhitelistRule[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.WHITELIST);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch (err) {
    console.warn('Failed to parse whitelist from localStorage:', err);
    return null;
  }
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('inspect');
  const [history, setHistory] = useState<DetectionResult[]>([]);
  const [whitelistRules, setWhitelistRules] = useState<WhitelistRule[]>(INITIAL_WHITELIST_RULES);
  const [ocrReady, setOcrReady] = useState<boolean>(false);
  const [onnxReady, setOnnxReady] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedPlateDetail, setSelectedPlateDetail] = useState<DetectionResult | null>(null);
  const [selectedGatePassResult, setSelectedGatePassResult] = useState<DetectionResult | null>(null);
  const [selectedEditResult, setSelectedEditResult] = useState<DetectionResult | null>(null);
  const [isAccessManagerOpen, setIsAccessManagerOpen] = useState<boolean>(false);

  // Pre-warm Tesseract.js WASM worker and 2-Stage ONNX models on page load
  useEffect(() => {
    getOcrWorker()
      .then(() => {
        setOcrReady(true);
      })
      .catch((err) => {
        console.error('OCR Worker warming notice:', err);
      });

    Promise.allSettled([
      loadOnnxModel('/models/plate_detector.onnx'),
      loadCharDetector('/models/char_detector.onnx'),
    ]).then((results) => {
      const anyLoaded = results.some((r) => r.status === 'fulfilled');
      setOnnxReady(anyLoaded);
    });
  }, []);

  // Load persisted history & whitelist (LocalStorage + Backend API sync)
  useEffect(() => {
    // 1. Immediately hydrate from LocalStorage for instant UI and offline resiliency
    const localHistory = loadLocalHistory();
    const initialSeedHistory: DetectionResult[] = DEMO_SAMPLES.slice(0, 3).map((sample, idx) => ({
      id: `seed-${sample.id}`,
      timestamp: Date.now() - (idx + 1) * 1800000,
      sourceImage: sample.dataUrl,
      plateCropImage: sample.dataUrl,
      plateNumber: sample.plate.replace(/\s+/g, ''),
      formattedPlate: sample.plate,
      expiryDate: sample.expiry,
      confidence: 94 + idx * 2,
      bbox: { x: 20, y: 20, width: 440, height: 140 },
      method: 'cv_contour',
      vehicleType: sample.vehicle,
      status: idx === 0 ? 'vip' : idx === 1 ? 'blacklist' : 'registered',
      notes: sample.name,
      processingTimeMs: 140 + idx * 25,
      cargoManifest: sample.defaultManifest,
    }));

    if (localHistory && localHistory.length > 0) {
      setHistory(localHistory);
    } else {
      setHistory(initialSeedHistory);
      saveLocalHistory(initialSeedHistory);
    }

    const localWhitelist = loadLocalWhitelist();
    if (localWhitelist && localWhitelist.length > 0) {
      setWhitelistRules(localWhitelist);
    } else {
      setWhitelistRules(INITIAL_WHITELIST_RULES);
      saveLocalWhitelist(INITIAL_WHITELIST_RULES);
    }

    // 2. Asynchronously sync with Backend API if reachable
    fetch(`${API_BASE_URL}/api/detections`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: DetectionResult[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setHistory(data);
          saveLocalHistory(data);
        } else {
          // If backend is empty on first load, seed with current local items
          const toSeed = localHistory && localHistory.length > 0 ? localHistory : initialSeedHistory;
          toSeed.forEach((seedItem) => {
            fetch(`${API_BASE_URL}/api/detections`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(seedItem),
            }).catch(() => {});
          });
        }
      })
      .catch(() => {
        // Harmless fallback when backend is not deployed / unreachable
        console.info('Backend API unavailable. Continuing in offline mode with LocalStorage persistence.');
      });

    fetch(`${API_BASE_URL}/api/whitelist`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: WhitelistRule[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setWhitelistRules(data);
          saveLocalWhitelist(data);
        } else {
          const rulesToSeed = localWhitelist && localWhitelist.length > 0 ? localWhitelist : INITIAL_WHITELIST_RULES;
          rulesToSeed.forEach((rule) => {
            fetch(`${API_BASE_URL}/api/whitelist`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(rule),
            }).catch(() => {});
          });
        }
      })
      .catch(() => {
        // Whitelist API offline: harmless since local storage is active
      });

    // 3. Local Sound Preference
    try {
      const savedSound = localStorage.getItem(LOCAL_STORAGE_KEYS.SOUND);
      if (savedSound !== null) {
        setSoundEnabled(savedSound === 'true');
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, []);

  // Handle new or updated detection result
  const handleNewDetection = (result: DetectionResult) => {
    const existingIndex = history.findIndex(
      (h) => h.id === result.id || (h.formattedPlate === result.formattedPlate && result.timestamp - h.timestamp < 3000)
    );

    let updated: DetectionResult[];
    if (existingIndex >= 0) {
      updated = [...history];
      updated[existingIndex] = result;
    } else {
      updated = [result, ...history];
    }

    setHistory(updated);
    saveLocalHistory(updated);

    // Save to Backend API if reachable
    fetch(`${API_BASE_URL}/api/detections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    }).catch(() => {});

    if (result.status === 'vip' && existingIndex < 0) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {}
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    saveLocalHistory([]);

    fetch(`${API_BASE_URL}/api/detections`, {
      method: 'DELETE',
    }).catch(() => {});
  };

  const handleAddRule = (rule: WhitelistRule) => {
    const updated = [rule, ...whitelistRules.filter((r) => r.plateNumber !== rule.plateNumber)];
    setWhitelistRules(updated);
    saveLocalWhitelist(updated);

    fetch(`${API_BASE_URL}/api/whitelist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    }).catch(() => {});
  };

  const handleDeleteRule = (plateNumber: string) => {
    const updated = whitelistRules.filter((r) => r.plateNumber !== plateNumber);
    setWhitelistRules(updated);
    saveLocalWhitelist(updated);

    fetch(`${API_BASE_URL}/api/whitelist/${encodeURIComponent(plateNumber)}`, {
      method: 'DELETE',
    }).catch(() => {});
  };

  const handleDeleteDetection = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    saveLocalHistory(updated);

    fetch(`${API_BASE_URL}/api/detections/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(() => {});
  };

  const handleSaveEditedDetection = (updatedResult: DetectionResult) => {
    const updated = history.map((item) => (item.id === updatedResult.id ? updatedResult : item));
    setHistory(updated);
    saveLocalHistory(updated);

    fetch(`${API_BASE_URL}/api/detections/${encodeURIComponent(updatedResult.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedResult),
    }).catch(() => {});
  };

  const handleUpdateStatusFromDetail = (
    plateNumber: string,
    status: WhitelistRule['status'],
    ownerName: string,
    notes?: string
  ) => {
    handleAddRule({
      plateNumber,
      ownerName,
      status,
      vehicleType: 'Mobil',
      notes,
      addedAt: Date.now(),
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        historyCount={history.length}
        ocrReady={ocrReady}
        onnxReady={onnxReady}
        soundEnabled={soundEnabled}
        setSoundEnabled={(val) => {
          setSoundEnabled(val);
          localStorage.setItem(LOCAL_STORAGE_KEYS.SOUND, String(val));
        }}
        onOpenAccessManager={() => setIsAccessManagerOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'inspect' && (
          <VehicleInspector
            onNewDetection={handleNewDetection}
            whitelistRules={whitelistRules}
            soundEnabled={soundEnabled}
            onOpenPlateDetail={(res) => setSelectedPlateDetail(res)}
            onOpenGatePassSlip={(res) => setSelectedGatePassResult(res)}
          />
        )}

        {activeTab === 'manifest' && (
          <CargoManifestDashboard
            history={history}
            onOpenGatePassSlip={(res) => setSelectedGatePassResult(res)}
            onOpenPlateDetail={(res) => setSelectedPlateDetail(res)}
          />
        )}

        {activeTab === 'history' && (
          <DetectionHistory
            history={history}
            onClearHistory={handleClearHistory}
            onOpenPlateDetail={(res) => setSelectedPlateDetail(res)}
            onOpenGatePassSlip={(res) => setSelectedGatePassResult(res)}
            onEditDetection={(res) => setSelectedEditResult(res)}
            onDeleteDetection={handleDeleteDetection}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border bg-card/60 py-4 px-6 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ALPR Cargo AI • Sistem Deteksi Plat Nomor & Manifes Muatan Logistik</span>
          <span className="font-mono text-[11px] text-muted-foreground">
            Client-Side AI Inference • High Efficiency Logistics Checkpoint
          </span>
        </div>
      </footer>

      {/* Modals */}
      <PlateDetailModal
        result={selectedPlateDetail}
        onClose={() => setSelectedPlateDetail(null)}
        onUpdateStatus={handleUpdateStatusFromDetail}
        onOpenGatePassSlip={(res) => setSelectedGatePassResult(res)}
        onEditDetection={(res) => setSelectedEditResult(res)}
      />

      <GatePassSlipModal
        result={selectedGatePassResult}
        onClose={() => setSelectedGatePassResult(null)}
      />

      <AccessManagerModal
        isOpen={isAccessManagerOpen}
        onClose={() => setIsAccessManagerOpen(false)}
        rules={whitelistRules}
        onAddRule={handleAddRule}
        onDeleteRule={handleDeleteRule}
      />

      <EditVehicleModal
        isOpen={!!selectedEditResult}
        result={selectedEditResult}
        onClose={() => setSelectedEditResult(null)}
        onSave={handleSaveEditedDetection}
      />
    </div>
  );
}
