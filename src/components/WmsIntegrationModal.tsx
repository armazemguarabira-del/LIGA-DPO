import React, { useState } from 'react';
import {
  X,
  Database,
  Download,
  Upload,
  CheckCircle2,
  RefreshCw,
  Server,
  Layers,
  FileCode,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { storageService } from '../services/storageService';

interface WmsIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataImported: () => void;
}

export const WmsIntegrationModal: React.FC<WmsIntegrationModalProps> = ({
  isOpen,
  onClose,
  onDataImported,
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const dataStr = storageService.exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dpo_wms_export_${new Date().toISOString().substring(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    const dataStr = storageService.exportData();
    navigator.clipboard.writeText(dataStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    if (!jsonInput.trim()) {
      setImportStatus('Insira o payload JSON para sincronização.');
      return;
    }

    const success = storageService.importData(jsonInput);
    if (success) {
      setImportStatus('Sucesso: Dados sincronizados com o WMS / ERP!');
      onDataImported();
      setTimeout(() => {
        setImportStatus(null);
        onClose();
      }, 1200);
    } else {
      setImportStatus('Erro: O formato do payload WMS é inválido.');
    }
  };

  const handleResetToSeed = () => {
    if (confirm('Deseja resetar o banco de dados da Liga DPO para o estado original de demonstração?')) {
      storageService.resetAll();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Integração WMS / ERP & Gestão de Dados
              </h2>
              <p className="text-xs text-slate-400">
                Sincronização com SAP EWM, Manhattan, Totvs e Senior Logística
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Connector Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">SAP EWM</span>
                <span className="text-[10px] text-emerald-400">Conectado (API)</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Manhattan WMS</span>
                <span className="text-[10px] text-emerald-400">Sincronizado</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Totvs WMS</span>
                <span className="text-[10px] text-emerald-400">Ativo</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Senior Log</span>
                <span className="text-[10px] text-emerald-400">Pronto</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
          </div>

          {/* Export / Backup Options */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Exportação dos Dados da Liga DPO
            </h3>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={handleExport}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Baixar Arquivo JSON de Backup</span>
              </button>

              <button
                onClick={handleCopyJson}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado!' : 'Copiar Payload'}</span>
              </button>
            </div>
          </div>

          {/* Import / Batch Sync Input */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Importar / Sincronizar em Lote
            </h3>
            <textarea
              rows={4}
              placeholder="Cole aqui o JSON gerado pelo seu WMS / ERP para importar em lote..."
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />

            {importStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  importStatus.startsWith('Sucesso')
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                }`}
              >
                {importStatus.startsWith('Sucesso') ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span>{importStatus}</span>
              </div>
            )}

            <button
              onClick={handleImport}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Processar e Sincronizar Dados</span>
            </button>
          </div>

          {/* Reset Database to Demo Seed */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Precisa reiniciar os dados de teste da demonstração?
            </span>
            <button
              onClick={handleResetToSeed}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restaurar Dados Padrão DPO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
