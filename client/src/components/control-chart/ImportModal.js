import React, { useState, useRef, useEffect } from 'react';
import importApi from '../../services/importApi.js';

const e = React.createElement;

export default function ImportModal({
  isOpen,
  onClose,
  onPublishToScenario,
  scenarios = [],
  activeScenarioId = null
}) {
  const [activeTab, setActiveTab] = useState('TEXT'); // 'TEXT', 'JSON', 'PDF', 'IMAGE'
  const [selectedFile, setSelectedFile] = useState(null);
  const [rawInput, setRawInput] = useState('');
  const [targetType, setTargetType] = useState('NEW_SCENARIO');
  const [targetScenarioId, setTargetScenarioId] = useState(activeScenarioId || '');
  const [targetScenarioName, setTargetScenarioName] = useState('Imported Simulation Corridor');
  const [sourceType, setSourceType] = useState('USER_PROVIDED');
  const [sourceAuthority, setSourceAuthority] = useState('CONTROLLER_INPUT');
  const [authorityLevel, setAuthorityLevel] = useState('SECONDARY');
  
  // Pipeline Processing & Preview State
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [currentJob, setCurrentJob] = useState(null);
  const [expandedTrainIdx, setExpandedTrainIdx] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [publishedInfo, setPublishedInfo] = useState(null);
  const [confirmedApproval, setConfirmedApproval] = useState(false);
  const [copyStatus, setCopyStatus] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (activeScenarioId) {
      setTargetScenarioId(activeScenarioId);
    }
  }, [activeScenarioId]);

  if (!isOpen) return null;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrorMsg(null);
    setSelectedFile(null);
    if (tab === 'PDF') {
      setSourceType('OFFICIAL_PUBLICATION');
      setSourceAuthority('OFFICIAL_RAILWAY_PUBLICATION');
      setAuthorityLevel('SECONDARY');
    } else if (tab === 'IMAGE') {
      setSourceType('OCR_EXTRACTED');
      setSourceAuthority('CONTROLLER_INPUT');
      setAuthorityLevel('SECONDARY');
    } else {
      setSourceType('USER_PROVIDED');
      setSourceAuthority('CONTROLLER_INPUT');
      setAuthorityLevel('SECONDARY');
    }
  };

  const handleFileSelect = (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (file) {
      setSelectedFile(file);
      setErrorMsg(null);
    }
  };

  const handleDragOver = (ev) => {
    ev.preventDefault();
  };

  const handleDrop = (ev) => {
    ev.preventDefault();
    const file = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setErrorMsg(null);
    }
  };

  const handleLoadSampleData = () => {
    if (activeTab === 'TEXT') {
      setRawInput(
`12601 CHENNAI CENTRAL - COIMBATORE MAIL
MAS 21:00
KPD 22:15 22:20
JTJ 23:35 23:40
SA 01:40 01:45
ED 03:20 03:25
CBE 05:10

20643 VANDE BHARAT EXPRESS
MAS 06:00
KPD 07:13 07:15
SA 09:18 09:20
ED 10:08 10:10
CBE 11:50`
      );
    } else if (activeTab === 'JSON') {
      setRawInput(JSON.stringify({
        trains: [
          {
            trainNumber: "12601",
            trainName: "Mangalore Mail",
            serviceFrequency: "DAILY",
            serviceDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
            origin: { stationCode: "MAS", stationName: "Chennai Central" },
            destination: { stationCode: "CBE", stationName: "Coimbatore" },
            stops: [
              { sequence: 1, stationCode: "MAS", stationName: "Chennai Central", arrival: null, departure: "21:00", dayOffset: 0 },
              { sequence: 2, stationCode: "KPD", stationName: "Katpadi", arrival: "22:15", departure: "22:20", dayOffset: 0 },
              { sequence: 3, stationCode: "JTJ", stationName: "Jolarpettai", arrival: "23:35", departure: "23:40", dayOffset: 0 },
              { sequence: 4, stationCode: "SA", stationName: "Salem", arrival: "01:40", departure: "01:45", dayOffset: 1 },
              { sequence: 5, stationCode: "ED", stationName: "Erode", arrival: "03:20", departure: "03:25", dayOffset: 1 },
              { sequence: 6, stationCode: "CBE", stationName: "Coimbatore", arrival: "05:10", departure: null, dayOffset: 1 }
            ]
          }
        ]
      }, null, 2));
    }
  };

  const handleStartIngestion = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    setCurrentJob(null);
    setIsPublished(false);
    setPublishedInfo(null);
    setConfirmedApproval(false);

    try {
      const payload = {
        format: activeTab,
        sourceType,
        sourceAuthority,
        authorityLevel,
        targetType,
        targetScenarioId: targetType === 'EXISTING_SCENARIO' ? targetScenarioId : null,
        targetScenarioName: targetScenarioName || 'Imported Simulation Schedule'
      };

      if (selectedFile) {
        payload.file = selectedFile;
      } else if (rawInput && rawInput.trim()) {
        payload.rawInput = rawInput.trim();
      } else {
        throw new Error('Please select a file or paste timetable content to proceed.');
      }

      const res = await importApi.uploadTimetable(payload);
      if (res) {
        setCurrentJob(res.data || res);
      } else {
        throw new Error('Server returned an empty or invalid response');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Import ingestion failed';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!currentJob) return;
    if (currentJob.counts?.errors > 0 || (currentJob.errors && currentJob.errors.length > 0)) {
      alert('Cannot publish timetable with validation errors. Please resolve errors before publishing.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await importApi.publishImport(currentJob.importId, {
        targetScenarioId: targetType === 'EXISTING_SCENARIO' ? targetScenarioId : null,
        targetScenarioName
      });

      setIsPublished(true);
      setPublishedInfo(res.data);
      if (onPublishToScenario) {
        onPublishToScenario(res.data);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Publishing failed';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderConfidenceBadge = (confidenceClass, score) => {
    const pct = Math.round((score || 1.0) * 100);
    if (confidenceClass === 'HIGH_CONFIDENCE' || pct >= 95) {
      return e('span', { className: 'bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded text-[10px]' }, `HIGH (${pct}%)`);
    }
    if (confidenceClass === 'MEDIUM_CONFIDENCE' || pct >= 80) {
      return e('span', { className: 'bg-amber-950 text-amber-300 border border-amber-700 px-1.5 py-0.5 rounded text-[10px]' }, `MED (${pct}%)`);
    }
    return e('span', { className: 'bg-rose-950 text-rose-300 border border-rose-700 px-1.5 py-0.5 rounded text-[10px]' }, `LOW (${pct}%)`);
  };

  const renderMatchStatusBadge = (status) => {
    switch (status) {
      case 'MATCHED':
        return e('span', { className: 'bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded text-[9px]' }, 'MATCHED');
      case 'REVIEW_REQUIRED':
        return e('span', { className: 'bg-amber-950 text-amber-400 border border-amber-800 px-1.5 py-0.2 rounded text-[9px]' }, 'REVIEW REQ');
      case 'CONFLICT':
        return e('span', { className: 'bg-purple-950 text-purple-400 border border-purple-800 px-1.5 py-0.2 rounded text-[9px]' }, 'CONFLICT');
      case 'NEW_UNKNOWN':
      default:
        return e('span', { className: 'bg-rose-950 text-rose-400 border border-rose-800 px-1.5 py-0.2 rounded text-[9px]' }, 'UNKNOWN');
    }
  };

  const renderCodeComparisonBadge = (stop) => {
    const isSame = stop.isSameStationCode || (stop.originalStationCode && stop.normalizedStationCode && stop.originalStationCode.trim().toUpperCase() === stop.normalizedStationCode.trim().toUpperCase());
    if (isSame) {
      return e('span', { className: 'bg-emerald-950/80 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap' }, '✓ SAME');
    }
    if (stop.matchStatus === 'NEW_UNKNOWN') {
      return e('span', { className: 'bg-rose-950/80 text-rose-300 border border-rose-700 px-1.5 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap' }, '✕ UNKNOWN');
    }
    return e('span', { className: 'bg-amber-950/80 text-amber-300 border border-amber-700 px-1.5 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap' }, '⇄ MAPPED');
  };

  const copyToClipboard = async (text, key) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const tempTextarea = document.createElement('textarea');
        tempTextarea.value = text;
        tempTextarea.style.position = 'fixed';
        tempTextarea.style.opacity = '0';
        document.body.appendChild(tempTextarea);
        tempTextarea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextarea);
      }
      setCopyStatus(key);
      setTimeout(() => setCopyStatus(null), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleCopyTableTSV = (train) => {
    if (!train || !train.stops) return;
    const headers = ['Seq', 'Input Code', 'Input Name', 'Matched Master Code', 'Matched Station Name', 'Code Match', 'Arr', 'Dep', 'Day Offset', 'Abs Min', 'Confidence', 'Match Status'];
    const rows = train.stops.map(s => {
      const isSame = s.isSameStationCode || (s.originalStationCode && s.normalizedStationCode && s.originalStationCode.trim().toUpperCase() === s.normalizedStationCode.trim().toUpperCase());
      const matchType = isSame ? 'SAME' : (s.matchStatus === 'NEW_UNKNOWN' ? 'UNKNOWN' : 'MAPPED');
      return [
        s.sequence,
        s.originalStationCode || s.normalizedStationCode || '',
        s.originalStationName || '',
        s.normalizedStationCode || '',
        s.normalizedStationName || '',
        matchType,
        s.arrival || '--:--',
        s.departure || '--:--',
        s.dayOffset ?? 0,
        s.absoluteMinutesDeparture || s.absoluteMinutesArrival || '--',
        `${Math.round((s.confidence || 1.0) * 100)}%`,
        s.matchStatus || 'MATCHED'
      ].join('\t');
    });
    const content = [headers.join('\t'), ...rows].join('\n');
    copyToClipboard(content, 'TABLE_TSV');
  };

  const handleCopyTimetableText = (train) => {
    if (!train || !train.stops) return;
    const lines = [`${train.trainNumber} ${train.trainName}`];
    train.stops.forEach(s => {
      const code = s.originalStationCode || s.normalizedStationCode;
      const arr = s.arrival || '--:--';
      const dep = s.departure || '--:--';
      const daySuffix = (s.dayOffset > 0) ? ` Day ${s.dayOffset + 1}` : '';
      lines.push(`${s.sequence} ${code} ${arr} ${dep}${daySuffix}`);
    });
    copyToClipboard(lines.join('\n'), 'TRAIN_TEXT');
  };

  const handleCopyTrainJSON = (train) => {
    if (!train) return;
    copyToClipboard(JSON.stringify(train, null, 2), 'TRAIN_JSON');
  };

  const handleCopyFullReport = (job) => {
    if (!job) return;
    const reportLines = [
      `==================================================`,
      `INDIAN RAILWAYS TIMETABLE IMPORT PREVIEW REPORT`,
      `==================================================`,
      `Import ID: ${job.importId}`,
      `Status: ${job.status}`,
      `Authority Level: ${job.authorityLevel || 'SECONDARY'} (${job.sourceAuthority || 'CONTROLLER_INPUT'})`,
      `Summary: Trains: ${job.counts?.trains || 0} | Stations: ${job.counts?.stations || 0} | Stops: ${job.counts?.stops || 0} | Warnings: ${job.counts?.warnings || 0} | Errors: ${job.counts?.errors || 0}`,
      ``
    ];

    if (job.warnings && job.warnings.length > 0) {
      reportLines.push(`SYSTEM WARNINGS & ADVISORIES (${job.warnings.length}):`);
      job.warnings.forEach(w => reportLines.push(`  • ${w}`));
      reportLines.push(``);
    }

    if (job.errors && job.errors.length > 0) {
      reportLines.push(`CHRONOLOGICAL & TOPOLOGY ERRORS (${job.errors.length}):`);
      job.errors.forEach(err => reportLines.push(`  ❌ ${err}`));
      reportLines.push(``);
    }

    (job.parsedData || []).forEach(tr => {
      reportLines.push(`--------------------------------------------------`);
      reportLines.push(`TRAIN #${tr.trainNumber} - ${tr.trainName}`);
      reportLines.push(`Frequency: ${tr.serviceFrequency} | Days: ${tr.serviceDays?.join(', ')}`);
      reportLines.push(`Stops:`);
      (tr.stops || []).forEach(s => {
        const isSame = s.isSameStationCode || (s.originalStationCode && s.normalizedStationCode && s.originalStationCode.trim().toUpperCase() === s.normalizedStationCode.trim().toUpperCase());
        const matchType = isSame ? 'SAME' : (s.matchStatus === 'NEW_UNKNOWN' ? 'UNKNOWN' : 'MAPPED');
        reportLines.push(`  ${String(s.sequence).padStart(2, ' ')}. [Input: ${(s.originalStationCode || s.normalizedStationCode).padEnd(5, ' ')}] -> [Master: ${(s.normalizedStationCode || '').padEnd(5, ' ')}] ${(s.normalizedStationName || '').padEnd(28, ' ')} | Arr: ${(s.arrival || '--:--').padEnd(5, ' ')} Dep: ${(s.departure || '--:--').padEnd(5, ' ')} Day: +${s.dayOffset} | Match: ${matchType} (${s.matchStatus})`);
      });
      reportLines.push(``);
    });

    copyToClipboard(reportLines.join('\n'), 'FULL_REPORT');
  };

  const handleCopyStopRow = (stop, idx) => {
    const isSame = stop.isSameStationCode || (stop.originalStationCode && stop.normalizedStationCode && stop.originalStationCode.trim().toUpperCase() === stop.normalizedStationCode.trim().toUpperCase());
    const matchType = isSame ? 'SAME' : (stop.matchStatus === 'NEW_UNKNOWN' ? 'UNKNOWN' : 'MAPPED');
    const line = `Seq ${stop.sequence}: Input [${stop.originalStationCode || stop.normalizedStationCode}] -> Matched [${stop.normalizedStationCode}] ${stop.normalizedStationName} | Code Match: ${matchType} | Arr: ${stop.arrival || '--:--'} | Dep: ${stop.departure || '--:--'} | Day: +${stop.dayOffset} | Conf: ${Math.round((stop.confidence || 1.0) * 100)}%`;
    copyToClipboard(line, `STOP_${idx}`);
  };

  return e('div', { className: 'fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 backdrop-blur-md font-mono select-none' },
    e('div', { className: 'bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-xs text-slate-200' },
      
      // Header
      e('div', { className: 'bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between' },
        e('div', { className: 'flex items-center space-x-3' },
          e('span', { className: 'text-cyan-400 font-bold text-sm tracking-wide' }, '📥 TIMETABLE / MASTER CHART INGESTION & RECONCILIATION ENGINE'),
          e('span', { className: 'bg-amber-950/80 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-800 font-semibold' }, 'NON-AUTHORITATIVE INGESTION'),
          e('span', { className: 'bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded border border-slate-700 font-semibold' }, 'ISOLATED SIMULATION TARGET')
        ),
        e('button', {
          onClick: onClose,
          className: 'text-slate-400 hover:text-white text-base font-bold px-2 py-1 rounded hover:bg-slate-800 transition-colors'
        }, '✕')
      ),

      // Scrollable Body
      e('div', { className: 'p-4 overflow-y-auto flex-1 space-y-4' },
        
        // Validation Protocol banner
        e('div', { className: 'bg-cyan-950/40 border border-cyan-800/60 p-2.5 rounded-lg flex items-center justify-between text-[11px] text-cyan-300' },
          e('span', null, 
            e('strong', { className: 'text-cyan-200 mr-1' }, 'Validation Protocol:'),
            'Station codes will be matched against official Southern Railway topology. Imports are published only into simulation scenarios; master data is never overwritten.'
          )
        ),

        // Input Format & Provenance Config
        e('div', { className: 'grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800' },
          
          // Format Tabs
          e('div', { className: 'md:col-span-5 space-y-2' },
            e('span', { className: 'text-[10px] text-slate-400 font-bold uppercase tracking-wider block' }, 'Input Format'),
            e('div', { className: 'grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded border border-slate-800' },
              [
                { id: 'TEXT', label: 'TEXT', aria: 'CSV Format' },
                { id: 'JSON', label: 'JSON', aria: 'JSON Format' },
                { id: 'PDF', label: 'PDF', aria: 'GTFS Format' },
                { id: 'IMAGE', label: 'IMAGE', aria: 'OCR / Image Scan' }
              ].map(tab =>
                e('button', {
                  key: tab.id,
                  'aria-label': tab.aria,
                  title: tab.aria,
                  onClick: () => handleTabChange(tab.id),
                  className: `py-1.5 rounded text-[11px] font-bold text-center transition-all ${
                    activeTab === tab.id 
                      ? 'bg-cyan-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }, tab.label)
              )
            )
          ),

          // Source Authority
          e('div', { className: 'md:col-span-3 space-y-2' },
            e('span', { className: 'text-[10px] text-slate-400 font-bold uppercase tracking-wider block' }, 'Source Authority'),
            e('select', {
              value: sourceType,
              onChange: (ev) => setSourceType(ev.target.value),
              className: 'w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500'
            },
              e('option', { value: 'USER_PROVIDED' }, 'User / Controller Input'),
              e('option', { value: 'OFFICIAL_PUBLICATION' }, 'Official Timetable (TAAG/WTT)'),
              e('option', { value: 'GOVERNMENT_OPEN_DATA' }, 'Government Open Data Portal'),
              e('option', { value: 'SECONDARY_REFERENCE' }, 'Secondary Reference Source'),
              e('option', { value: 'OCR_EXTRACTED' }, 'Scanned Graphic / OCR Extraction')
            )
          ),

          // Target Scenario Scope
          e('div', { className: 'md:col-span-4 space-y-2' },
            e('span', { className: 'text-[10px] text-slate-400 font-bold uppercase tracking-wider block' }, 'Target Scenario'),
            e('select', {
              value: targetType,
              onChange: (ev) => setTargetType(ev.target.value),
              className: 'w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500'
            },
              e('option', { value: 'NEW_SCENARIO' }, 'New Simulation Scenario'),
              e('option', { value: 'EXISTING_SCENARIO' }, 'Active Simulation Scenario'),
              e('option', { value: 'REFERENCE_DATASET' }, 'Reference Timetable Snapshot')
            ),
            targetType === 'EXISTING_SCENARIO' && scenarios.length > 0 &&
              e('select', {
                value: targetScenarioId,
                onChange: (ev) => setTargetScenarioId(ev.target.value),
                className: 'w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-cyan-200 focus:outline-none'
              },
                scenarios.map(sc =>
                  e('option', { key: sc.scenarioId || sc._id, value: sc.scenarioId || sc._id }, sc.name || sc.scenarioId)
                )
              ),
            targetType === 'NEW_SCENARIO' &&
              e('input', {
                type: 'text',
                value: targetScenarioName,
                onChange: (ev) => setTargetScenarioName(ev.target.value),
                placeholder: 'Scenario Name',
                className: 'w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-cyan-200 focus:outline-none'
              })
          )
        ),

        // Upload and text area
        e('div', { className: 'space-y-2' },
          e('div', { className: 'flex items-center justify-between' },
            e('span', { className: 'text-[11px] font-bold text-slate-300' },
              activeTab === 'TEXT' ? 'Paste Structured Timetable or CSV Data:' :
              activeTab === 'JSON' ? 'Paste JSON Timetable Payload:' :
              activeTab === 'PDF' ? 'Upload Timetable PDF Document (Digital or Scanned):' :
              'Upload Timetable Matrix Image (PNG, JPG, WebP):'
            ),
            e('button', {
              onClick: handleLoadSampleData,
              className: 'text-[10px] text-cyan-400 hover:text-cyan-300 underline font-medium'
            }, 'Load Valid Southern Railway Corridor Sample')
          ),

          // Drag and drop zone
          (activeTab === 'PDF' || activeTab === 'IMAGE' || selectedFile) &&
            e('div', {
              onDragOver: handleDragOver,
              onDrop: handleDrop,
              onClick: () => fileInputRef.current && fileInputRef.current.click(),
              className: `border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                selectedFile
                  ? 'border-cyan-500 bg-cyan-950/20'
                  : 'border-slate-700 hover:border-slate-500 bg-slate-950/40'
              }`
            },
              e('input', {
                ref: fileInputRef,
                type: 'file',
                accept: activeTab === 'PDF' ? '.pdf,application/pdf' :
                        activeTab === 'IMAGE' ? 'image/png,image/jpeg,image/webp' :
                        activeTab === 'JSON' ? '.json,application/json' : '.txt,.csv,text/plain,text/csv',
                onChange: handleFileSelect,
                className: 'hidden'
              }),
              selectedFile
                ? e('div', { className: 'space-y-1' },
                    e('div', { className: 'text-cyan-400 font-bold text-xs' }, `📄 ${selectedFile.name}`),
                    e('div', { className: 'text-slate-400 text-[10px]' }, `${(selectedFile.size / 1024).toFixed(1)} KB — Click or drag to replace`)
                  )
                : e('div', { className: 'space-y-1' },
                    e('div', { className: 'text-slate-300 text-xs font-semibold' }, `Drag and drop ${activeTab} file here, or browse`),
                    e('div', { className: 'text-slate-500 text-[10px]' }, 'Max file size: 10 MB. PDF limit: 15 pages.')
                  )
            ),

          // Textarea for TEXT and JSON
          (activeTab === 'TEXT' || activeTab === 'JSON') &&
            e('textarea', {
              value: rawInput,
              onChange: (ev) => setRawInput(ev.target.value),
              placeholder: activeTab === 'TEXT'
                ? 'Example:\n12601 CHENNAI MAIL\nMAS 21:00\nKPD 22:15 22:20\nJTJ 23:35 23:40\nSA 01:40 01:45\nCBE 05:10'
                : '{\n  "trains": [\n    {\n      "trainNumber": "12601",\n      "trainName": "Mangalore Mail",\n      "stops": [ ... ]\n    }\n  ]\n}',
              rows: 6,
              className: 'w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-[11px] font-mono text-cyan-200 focus:outline-none focus:border-cyan-500'
            })
        ),

        // Action Trigger Banner
        e('div', { className: 'flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800' },
          e('div', { className: 'flex items-center space-x-2 text-slate-400 text-[11px]' },
            e('span', { className: 'inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse' }),
            e('span', null, 'Universal Pipeline: Tokenize → Normalize → Reconcile Stations → Validate → Verify')
          ),
          e('button', {
            onClick: handleStartIngestion,
            disabled: isProcessing || (!selectedFile && !rawInput.trim()),
            className: `px-4 py-2 rounded font-bold text-xs tracking-wider transition-all ${
              isProcessing || (!selectedFile && !rawInput.trim())
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg hover:shadow-cyan-500/20'
            }`
          }, isProcessing ? '⏳ INGESTING & VALIDATING...' : '▶ PARSE & VALIDATE TIMETABLE')
        ),

        // Error Banner
        errorMsg &&
          e('div', { className: 'bg-rose-950/70 border border-rose-800 text-rose-200 p-3 rounded-lg flex items-start space-x-2' },
            e('span', { className: 'text-base font-bold text-rose-400' }, '⚠️'),
            e('div', { className: 'text-xs space-y-1' },
              e('div', { className: 'font-bold' }, 'Validation / Parsing Error'),
              e('div', { className: 'text-rose-300 text-[11px] whitespace-pre-wrap' }, errorMsg)
            )
          ),

        // Preview & Reconciliation Report Section
        currentJob &&
          e('div', { className: 'space-y-3 bg-slate-950/80 p-3.5 rounded-lg border border-slate-700' },
            
            // Metrics Strip
            e('div', { className: 'flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800' },
              e('div', { className: 'flex items-center space-x-2' },
                e('span', { className: 'font-bold text-cyan-300 text-xs' }, 'IMPORT PREVIEW:'),
                e('span', { className: 'bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]' }, `ID: ${currentJob.importId}`),
                e('span', {
                  className: `px-2 py-0.5 rounded text-[10px] font-bold ${
                    currentJob.status === 'FAILED' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                    currentJob.status === 'REVIEW_REQUIRED' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`
                }, `STATUS: ${currentJob.status}`)
              ),
              e('div', { className: 'flex items-center space-x-3 text-[11px]' },
                e('span', null, 'Trains: ', e('b', { className: 'text-cyan-400' }, currentJob.counts?.trains || 0)),
                e('span', null, 'Stations: ', e('b', { className: 'text-cyan-400' }, currentJob.counts?.stations || 0)),
                e('span', null, 'Stops: ', e('b', { className: 'text-cyan-400' }, currentJob.counts?.stops || 0)),
                e('span', null, 'Warnings: ', e('b', { className: 'text-amber-400' }, currentJob.counts?.warnings || 0)),
                e('span', null, 'Errors: ', e('b', { className: 'text-rose-400' }, currentJob.counts?.errors || 0))
              )
            ),

            // Warnings List
            currentJob.warnings && currentJob.warnings.length > 0 &&
              e('div', { className: 'bg-amber-950/40 border border-amber-900 text-amber-200 p-2.5 rounded text-[11px] space-y-1' },
                e('div', { className: 'font-bold text-amber-400' }, `⚠️ System Advisories & Normalization Notices (${currentJob.warnings.length}):`),
                e('ul', { className: 'list-disc list-inside space-y-0.5 text-amber-300/90 max-h-24 overflow-y-auto' },
                  currentJob.warnings.map((w, idx) => e('li', { key: idx }, w))
                )
              ),

            // Errors List
            currentJob.errors && currentJob.errors.length > 0 &&
              e('div', { className: 'bg-rose-950/50 border border-rose-900 text-rose-200 p-2.5 rounded text-[11px] space-y-1' },
                e('div', { className: 'font-bold text-rose-400' }, `❌ Chronological or Topology Errors (${currentJob.errors.length}):`),
                e('ul', { className: 'list-disc list-inside space-y-0.5 text-rose-300 max-h-28 overflow-y-auto' },
                  currentJob.errors.map((errItem, idx) => e('li', { key: idx }, errItem))
                )
              ),

            // Train selector tabs if multiple trains
            currentJob.parsedData && currentJob.parsedData.length > 1 &&
              e('div', { className: 'flex space-x-1.5 overflow-x-auto pb-1' },
                currentJob.parsedData.map((tr, idx) =>
                  e('button', {
                    key: idx,
                    onClick: () => setExpandedTrainIdx(idx),
                    className: `px-3 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-colors ${
                      expandedTrainIdx === idx
                        ? 'bg-cyan-700 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`
                  }, `🚆 ${tr.trainNumber} - ${tr.trainName}`)
                )
              ),

            // Table of stops
            currentJob.parsedData && currentJob.parsedData[expandedTrainIdx] &&
              e('div', { className: 'border border-slate-800 rounded-lg overflow-hidden select-text' },
                e('div', { className: 'bg-slate-900 px-3 py-2 font-bold text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800' },
                  e('div', { className: 'flex flex-wrap items-center space-x-2' },
                    e('span', { className: 'text-cyan-300' }, `🚆 Train #${currentJob.parsedData[expandedTrainIdx].trainNumber}: ${currentJob.parsedData[expandedTrainIdx].trainName}`),
                    e('span', { className: 'text-slate-400 text-[10px]' },
                      `(${currentJob.parsedData[expandedTrainIdx].serviceFrequency || 'DAILY'} | Days: ${currentJob.parsedData[expandedTrainIdx].serviceDays?.join(',') || 'ALL'})`
                    )
                  ),
                  e('div', { className: 'flex items-center space-x-1.5' },
                    e('button', {
                      type: 'button',
                      title: 'Copy table as Tab-Separated Values (for Excel / Spreadsheets)',
                      onClick: () => handleCopyTableTSV(currentJob.parsedData[expandedTrainIdx]),
                      className: `px-2 py-1 rounded text-[10px] font-semibold flex items-center space-x-1 transition-colors ${
                        copyStatus === 'TABLE_TSV'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`
                    }, copyStatus === 'TABLE_TSV' ? '✓ Copied TSV!' : '📋 Copy Table (TSV)'),

                    e('button', {
                      type: 'button',
                      title: 'Copy timetable in standard text format',
                      onClick: () => handleCopyTimetableText(currentJob.parsedData[expandedTrainIdx]),
                      className: `px-2 py-1 rounded text-[10px] font-semibold flex items-center space-x-1 transition-colors ${
                        copyStatus === 'TRAIN_TEXT'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`
                    }, copyStatus === 'TRAIN_TEXT' ? '✓ Copied Text!' : '📋 Copy Text'),

                    e('button', {
                      type: 'button',
                      title: 'Copy train data as JSON',
                      onClick: () => handleCopyTrainJSON(currentJob.parsedData[expandedTrainIdx]),
                      className: `px-2 py-1 rounded text-[10px] font-semibold flex items-center space-x-1 transition-colors ${
                        copyStatus === 'TRAIN_JSON'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`
                    }, copyStatus === 'TRAIN_JSON' ? '✓ Copied JSON!' : '📋 Copy JSON')
                  )
                ),
                e('div', { className: 'overflow-x-auto max-h-64 overflow-y-auto' },
                  e('table', { className: 'w-full text-left text-[11px]' },
                    e('thead', { className: 'bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800' },
                      e('tr', null,
                        e('th', { className: 'p-2 w-10 text-center' }, 'Seq'),
                        e('th', { className: 'p-2' }, 'Input Code'),
                        e('th', { className: 'p-2' }, 'Matched Master Station'),
                        e('th', { className: 'p-2 text-center' }, 'Code Match'),
                        e('th', { className: 'p-2' }, 'Arr'),
                        e('th', { className: 'p-2' }, 'Dep'),
                        e('th', { className: 'p-2 text-center' }, 'Day'),
                        e('th', { className: 'p-2 text-center' }, 'Abs Min'),
                        e('th', { className: 'p-2' }, 'Confidence'),
                        e('th', { className: 'p-2' }, 'Match Status'),
                        e('th', { className: 'p-2 text-center w-12' }, 'Copy')
                      )
                    ),
                    e('tbody', { className: 'divide-y divide-slate-800/60 font-mono select-text' },
                      currentJob.parsedData[expandedTrainIdx].stops?.map((stop, sIdx) =>
                        e('tr', { key: sIdx, className: 'hover:bg-slate-800/40' },
                          e('td', { className: 'p-2 text-center font-bold text-slate-400' }, stop.sequence),
                          e('td', { className: 'p-2' },
                            e('span', { className: 'font-bold text-cyan-300' }, stop.originalStationCode || stop.normalizedStationCode),
                            stop.originalStationName && stop.originalStationName !== stop.originalStationCode &&
                              e('span', { className: 'text-slate-500 text-[10px] ml-1' }, `(${stop.originalStationName})`)
                          ),
                          e('td', { className: 'p-2' },
                            e('span', { className: 'text-slate-200' }, stop.normalizedStationName),
                            e('span', { className: 'text-slate-500 text-[10px] ml-1' }, `[${stop.normalizedStationCode}]`)
                          ),
                          e('td', { className: 'p-2 text-center' }, renderCodeComparisonBadge(stop)),
                          e('td', { className: 'p-2 text-slate-300' }, stop.arrival || '—'),
                          e('td', { className: 'p-2 text-slate-300' }, stop.departure || '—'),
                          e('td', { className: 'p-2 text-center text-slate-300' }, stop.dayOffset),
                          e('td', { className: 'p-2 text-center text-slate-400' }, stop.absoluteMinutesDeparture || stop.absoluteMinutesArrival || '—'),
                          e('td', { className: 'p-2' }, renderConfidenceBadge(stop.confidenceClass, stop.confidence)),
                          e('td', { className: 'p-2' }, renderMatchStatusBadge(stop.matchStatus)),
                          e('td', { className: 'p-2 text-center' },
                            e('button', {
                              type: 'button',
                              title: 'Copy this stop line to clipboard',
                              onClick: () => handleCopyStopRow(stop, sIdx),
                              className: `p-1 rounded text-[10px] transition-colors ${
                                copyStatus === `STOP_${sIdx}`
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                              }`
                            }, copyStatus === `STOP_${sIdx}` ? '✓' : '📋')
                          )
                        )
                      )
                    )
                  )
                )
              ),

            // Approval & Publish Controls
            e('div', { className: 'bg-slate-900 p-3.5 rounded-lg border border-cyan-900/50 space-y-3 mt-3' },
              e('div', { className: 'flex items-start space-x-2 text-slate-300 text-xs' },
                e('input', {
                  type: 'checkbox',
                  id: 'confirmApprovalCheckbox',
                  checked: confirmedApproval,
                  onChange: (ev) => setConfirmedApproval(ev.target.checked),
                  className: 'mt-0.5 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500'
                }),
                e('label', { htmlFor: 'confirmApprovalCheckbox', className: 'cursor-pointer select-none' },
                  e('span', { className: 'font-bold text-cyan-300' }, 'Human Approval Confirmation: '),
                  'I have verified the extracted timetable sequences, midnight offsets, and station alignments. ',
                  e('span', { className: 'text-amber-300 block text-[10px] font-semibold mt-0.5' },
                    '"This import will not modify authoritative railway master data."'
                  )
                )
              ),

              e('div', { className: 'flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800' },
                e('div', { className: 'flex flex-wrap items-center gap-1.5' },
                  e('button', {
                    type: 'button',
                    onClick: () => handleCopyFullReport(currentJob),
                    className: `px-2.5 py-1 rounded text-[10px] font-semibold transition-colors flex items-center space-x-1 ${
                      copyStatus === 'FULL_REPORT'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                    }`
                  }, copyStatus === 'FULL_REPORT' ? '✓ Copied Full Report!' : '📋 Copy Full Report'),

                  e('button', {
                    type: 'button',
                    onClick: () => copyToClipboard(JSON.stringify(currentJob.parsedData || [], null, 2), 'ALL_JSON'),
                    className: `px-2.5 py-1 rounded text-[10px] font-semibold transition-colors flex items-center space-x-1 ${
                      copyStatus === 'ALL_JSON'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`
                  }, copyStatus === 'ALL_JSON' ? '✓ Copied JSON Data!' : '📋 Copy All JSON'),

                  e('a', {
                    href: importApi.getExportUrl(currentJob.importId, 'json'),
                    target: '_blank',
                    rel: 'noreferrer',
                    className: 'px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 transition-colors'
                  }, 'Export File (JSON)'),
                  e('a', {
                    href: importApi.getExportUrl(currentJob.importId, 'csv'),
                    target: '_blank',
                    rel: 'noreferrer',
                    className: 'px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 transition-colors'
                  }, 'Export File (CSV)')
                ),

                e('div', { className: 'flex items-center space-x-2' },
                  e('button', {
                    onClick: onClose,
                    className: 'px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold'
                  }, 'Cancel'),
                  e('button', {
                    onClick: handlePublish,
                    disabled: isProcessing || !confirmedApproval || (currentJob.counts?.errors > 0) || (currentJob.errors && currentJob.errors.length > 0),
                    className: `px-4 py-1.5 rounded text-xs font-bold tracking-wide transition-all ${
                      isProcessing || !confirmedApproval || (currentJob.counts?.errors > 0) || (currentJob.errors && currentJob.errors.length > 0)
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg hover:shadow-emerald-500/20'
                    }`
                  }, isProcessing ? '⏳ PUBLISHING...' : '✅ APPROVE & PUBLISH TO SCENARIO')
                )
              )
            ),

            // Published Alert
            isPublished &&
              e('div', { className: 'bg-emerald-950/80 border border-emerald-600 p-3 rounded-lg text-emerald-200 text-xs flex items-center justify-between' },
                e('div', null,
                  e('div', { className: 'font-bold text-emerald-300' }, '🎉 TIMETABLE PUBLISHED SUCCESSFULLY'),
                  e('div', { className: 'text-[11px] text-emerald-400' },
                    `Published to Scenario: ${publishedInfo?.targetScenarioId || ''} | Snapshot: ${publishedInfo?.publishedSnapshotId || ''}`
                  )
                ),
                e('button', {
                  onClick: onClose,
                  className: 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded text-xs'
                }, 'View in Master Chart')
              )
          )
      )
    )
  );
}
