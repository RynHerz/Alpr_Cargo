'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, Truck, User, FileText, CheckCircle2 } from 'lucide-react';
import { DetectionResult } from '@alpr/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EditVehicleModalProps {
  result: DetectionResult | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: DetectionResult) => void;
}

export const EditVehicleModal: React.FC<EditVehicleModalProps> = ({
  result,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formattedPlate, setFormattedPlate] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<string>('Mobil');
  const [status, setStatus] = useState<DetectionResult['status']>('registered');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [loadStatus, setLoadStatus] = useState<string>('Penuh (Full Load)');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (result) {
      setFormattedPlate(result.formattedPlate || result.plateNumber || '');
      setVehicleType(result.vehicleType || 'Mobil');
      setStatus(result.status || 'unknown');
      setExpiryDate(result.expiryDate || '');
      setNotes(result.notes || '');

      const m = result.cargoManifest;
      setDriverName(m?.driverName || '');
      setDriverPhone(m?.driverPhone || '');
      setCompanyName(m?.companyName || '');
      setDocumentNumber(m?.documentNumber || '');
      setDestination(m?.destination || '');
      setLoadStatus(m?.loadStatus || 'Penuh (Full Load)');
    }
  }, [result]);

  if (!isOpen || !result) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPlate = formattedPlate.trim().toUpperCase();
    const updatedManifest = {
      ...(result.cargoManifest || {
        items: [],
        inspectionStatus: 'Sesuai (Approved)' as const,
      }),
      driverName: driverName.trim() || 'Pengemudi',
      driverPhone: driverPhone.trim() || undefined,
      companyName: companyName.trim() || undefined,
      documentNumber: documentNumber.trim() || undefined,
      destination: destination.trim() || undefined,
      loadStatus: loadStatus as any,
      updatedAt: Date.now(),
    };

    const updatedResult: DetectionResult = {
      ...result,
      plateNumber: cleanPlate.replace(/\s+/g, ''),
      formattedPlate: cleanPlate,
      vehicleType: vehicleType as any,
      status: status,
      expiryDate: expiryDate.trim() || undefined,
      notes: notes.trim() || undefined,
      cargoManifest: updatedManifest,
    };

    onSave(updatedResult);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative z-50 w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Edit Data Kendaraan & Manifes</h3>
          </div>
          <Button
            variant="ghost"
            size="iconSm"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Plat & Jenis Kendaraan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Plat Nomor Kendaraan</label>
              <Input
                value={formattedPlate}
                onChange={(e) => setFormattedPlate(e.target.value)}
                placeholder="misal: B 1234 ABC"
                required
                className="font-mono uppercase font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Jenis Kendaraan</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Mobil">Mobil Pribadi</option>
                <option value="Motor">Sepeda Motor</option>
                <option value="Truk / Bus">Truk / Bus</option>
                <option value="Pickup / Box">Pickup / Box</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Status Akses & Masa Berlaku */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Status Hak Akses Gerbang</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="registered">TERDAFTAR (Akses Reguler)</option>
                <option value="vip">VIP (Akses Prioritas)</option>
                <option value="blacklist">BLACKLIST (Dilarang Masuk)</option>
                <option value="unknown">TAMU / BELUM TERDAFTAR</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Masa Berlaku Plat (Bulan.Tahun)</label>
              <Input
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                placeholder="misal: 08.29"
                className="font-mono"
              />
            </div>
          </div>

          {/* Pengemudi & Kontak */}
          <div className="border-t border-border pt-3 space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" /> Informasi Pengemudi & Vendor
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Nama Pengemudi</label>
                <Input
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Nama supir..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">No. Handphone / WhatsApp</label>
                <Input
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="0812..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Perusahaan / Vendor / Ekspedisi</label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="PT Logistik..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">No. Surat Jalan / Resi / DO</label>
                <Input
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="SJ-2026-..."
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Manifes Kargo & Status Muatan */}
          <div className="border-t border-border pt-3 space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-primary" /> Manifes Muatan Kargo
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Status Muatan</label>
                <select
                  value={loadStatus}
                  onChange={(e) => setLoadStatus(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Penuh (Full Load)">Penuh (Full Load)</option>
                  <option value="Parsial (Half Load)">Parsial (Half Load)</option>
                  <option value="Kosong (Empty)">Kosong (Empty)</option>
                  <option value="Muatan Khusus / B3">Muatan Khusus / B3</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Tujuan / Lokasi Bongkar</label>
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Gudang A, Dermaga 2..."
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Catatan Petugas / Notes</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan inspeksi fisik atau gerbang..."
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="border-t border-border pt-4 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" size="sm" className="gap-1.5 bg-primary text-primary-foreground">
              <Save className="w-3.5 h-3.5" /> Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
