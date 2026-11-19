import { useEffect, useState } from 'react';
import { BookmarkPlus, RotateCcw, Trash2 } from 'lucide-react';
import { useFilters } from '@/lib/filters';
import { Button } from './ui/button';
import { Input } from './ui/input';

type Preset = { name: string; region: string; range: string; category: string; dataStatus: string; issueType: string };
export function FilterPresets() {
  const f = useFilters();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('rg-presets') ?? '[]');
      if (Array.isArray(saved)) setPresets(saved.filter((p): p is Preset => p && ['name', 'region', 'range', 'category', 'dataStatus', 'issueType'].every((key) => typeof p[key] === 'string')));
    } catch { /* Ignore unavailable or invalid storage. */ }
  }, []);
  const persist = (next: Preset[]) => {
    setPresets(next);
    try { localStorage.setItem('rg-presets', JSON.stringify(next)); setError(''); } catch { setError('Presets could not be saved on this device.'); }
  };
  const apply = (p: Omit<Preset, 'name'>) => {
    f.setRegion(p.region); f.setRange(p.range); f.setCategory(p.category); f.setDataStatus(p.dataStatus); f.setIssueType(p.issueType);
  };
  return <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2 md:px-6">
    <select aria-label="Saved filters" value={selected} onChange={(e) => { setSelected(e.target.value); const p = presets.find((p) => p.name === e.target.value); if (p) apply(p); }} className="h-8 max-w-48 rounded-md border border-input bg-secondary px-2 text-xs">
      <option value="">Saved filters</option>{presets.map((p) => <option key={p.name}>{p.name}</option>)}
    </select>
    <Input aria-label="Preset name" placeholder="Preset name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} className="h-8 w-36 text-xs" />
    <Button size="icon" variant="ghost" title="Save filters" aria-label="Save filters" disabled={!name.trim()} onClick={() => {
      const next = { name: name.trim(), region: f.region, range: f.range, category: f.category, dataStatus: f.dataStatus, issueType: f.issueType };
      persist([...presets.filter((p) => p.name !== next.name), next]); setSelected(next.name); setName('');
    }}><BookmarkPlus /></Button>
    <Button size="icon" variant="ghost" title="Delete preset" aria-label="Delete preset" disabled={!selected} onClick={() => { persist(presets.filter((p) => p.name !== selected)); setSelected(''); }}><Trash2 /></Button>
    <Button size="icon" variant="ghost" title="Reset filters" aria-label="Reset filters" onClick={() => { apply({ region: 'all', range: '7d', category: 'all', dataStatus: 'all', issueType: 'all' }); setSelected(''); }}><RotateCcw /></Button>
    {error && <p role="alert" className="text-xs text-critical">{error}</p>}
  </div>;
}