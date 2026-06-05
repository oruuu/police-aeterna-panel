'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  ClipboardList,
  Database,
  Edit3,
  FileClock,
  Gavel,
  LayoutDashboard,
  Lock,
  LogOut,
  Plus,
  Radio,
  Search,
  Shield,
  Trash2,
  UserCog,
  UserRound,
  Users,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Role = 'SUPER_ADMIN' | 'KAPOLRI' | 'WAKAPOLRI' | 'COMMAND' | 'PROVOST' | 'OFFICER' | 'CADET';
type Pasal = { id?: string; kode: string; tentang: string; denda: number; bulan: number; kategori: 'Ringan' | 'Sedang' | 'Berat' | 'Persidangan' };
type Code = { id?: string; kode: string; arti: string };
type Member = {
  id?: string;
  discord_id?: string;
  discord_name?: string;
  nama_rp: string;
  callsign: string;
  pangkat: string;
  divisi: string;
  role: Role;
  status: 'ACTIVE' | 'SUSPENDED' | 'OFF_DUTY';
};
type Audit = { id?: string; actor_name: string; action: string; target: string; detail: string; created_at?: string };

const defaultPasal: Pasal[] = [
  { kode: '1.1', tentang: 'Tidak Memiliki KTD / Tidak Membawa KTD', denda: 2000, bulan: 5, kategori: 'Ringan' },
  { kode: '1.2', tentang: 'Melakukan Penipuan Terhadap Warga', denda: 2000, bulan: 5, kategori: 'Ringan' },
  { kode: '1.3', tentang: 'Melakukan Pemalakan Terhadap Warga', denda: 2000, bulan: 5, kategori: 'Ringan' },
  { kode: '1.4', tentang: 'Memberi Informasi Palsu Kepada Petugas Kepolisian', denda: 4000, bulan: 10, kategori: 'Ringan' },
  { kode: '2.9', tentang: 'Mengkonsumsi Narkoba / Narkotika', denda: 5000, bulan: 10, kategori: 'Ringan' },
  { kode: '3.0', tentang: 'Penganiayaan / Pemukulan Terhadap Warga', denda: 5000, bulan: 10, kategori: 'Sedang' },
  { kode: '3.8', tentang: 'Membawa Narkoba Dan Narkotika', denda: 6000, bulan: 15, kategori: 'Sedang' },
  { kode: '4.6', tentang: 'Pencurian Kendaraan Ilegal / Carsteal', denda: 5000, bulan: 5, kategori: 'Sedang' },
  { kode: '5.3', tentang: 'Pengedaran Senjata Api Ilegal', denda: 8000, bulan: 20, kategori: 'Berat' },
  { kode: '5.7', tentang: 'Kepemilikan Laras Panjang / Sniper Ilegal', denda: 20000, bulan: 20, kategori: 'Berat' },
  { kode: '6.8', tentang: 'Perampokan Warung Bersenjata', denda: 8000, bulan: 15, kategori: 'Berat' },
  { kode: '7.4', tentang: 'Perampokan Bank', denda: 10000, bulan: 20, kategori: 'Berat' },
  { kode: '7.7', tentang: 'Korupsi Instansi', denda: 0, bulan: 999, kategori: 'Persidangan' },
];

const defaultCodes: Code[] = [
  { kode: '1-1', arti: 'Hubungi per telepon' },
  { kode: '1-4', arti: 'Ingin bicara di udara / langsung' },
  { kode: '2-1', arti: 'Identitas Orang / Suspek' },
  { kode: '2-2', arti: 'Identitas Kendaraan' },
  { kode: '3-1', arti: 'Kasus Pembegalan' },
  { kode: '3-1P', arti: 'Kasus Perampokan' },
  { kode: '3-2', arti: 'Kasus Peperangan' },
  { kode: '8-6', arti: 'Dimengerti' },
  { kode: '10-2', arti: 'Menanyakan posisi / menginformasikan posisi' },
  { kode: '10-4', arti: 'Diterima / roger that' },
  { kode: '10-13', arti: 'Anggota terlumpuhkan' },
  { kode: '10-200', arti: 'Membutuhkan backup polisi di ...' },
  { kode: '10-700', arti: 'Membutuhkan medis di ...' },
  { kode: '10-999', arti: 'Peperangan besar / naikkan ke Siaga 1' },
];

const roles: Role[] = ['SUPER_ADMIN', 'KAPOLRI', 'WAKAPOLRI', 'COMMAND', 'PROVOST', 'OFFICER', 'CADET'];
const nav = [
  ['dashboard', LayoutDashboard, 'Dashboard Kapolri'],
  ['pasal', Gavel, 'Kalkulator Pasal'],
  ['codes', Radio, 'Sandi Angka'],
  ['members', Users, 'Database Anggota'],
  ['admin', Database, 'Admin Data'],
  ['audit', FileClock, 'Audit Log'],
] as const;

function roleRank(role?: Role) {
  return { SUPER_ADMIN: 100, KAPOLRI: 90, WAKAPOLRI: 80, COMMAND: 70, PROVOST: 60, OFFICER: 30, CADET: 10 }[role || 'CADET'];
}
function canManage(role?: Role) { return roleRank(role) >= 70; }
function canViewAudit(role?: Role) { return roleRank(role) >= 60; }
function badge(k: string) {
  return k === 'Ringan'
    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
    : k === 'Sedang'
      ? 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/25'
      : k === 'Berat'
        ? 'bg-red-500/15 text-red-300 border border-red-500/25'
        : 'bg-purple-500/15 text-purple-300 border border-purple-500/25';
}

export default function Page() {
  const [tab, setTab] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [myProfile, setMyProfile] = useState<Member | null>(null);
  const [pasal, setPasal] = useState<Pasal[]>(defaultPasal);
  const [codes, setCodes] = useState<Code[]>(defaultCodes);
  const [members, setMembers] = useState<Member[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<Pasal[]>([]);
  const [form, setForm] = useState<Pasal>({ kode: '', tentang: '', denda: 0, bulan: 0, kategori: 'Ringan' });
  const [codeForm, setCodeForm] = useState<Code>({ kode: '', arti: '' });
  const [memberForm, setMemberForm] = useState<Member>({ nama_rp: '', callsign: '', pangkat: '', divisi: 'Patrol', role: 'OFFICER', status: 'ACTIVE' });

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) await ensureProfile(data.user);
      await loadDb();
    });
  }, []);

  async function loginDiscord() {
    if (!supabase) return alert('Supabase belum disetting. Isi .env.local dulu.');
    await supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: location.origin } });
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setMyProfile(null);
  }

  async function ensureProfile(authUser: any) {
    if (!supabase) return;
    const discordId = authUser.user_metadata?.provider_id || authUser.identities?.[0]?.identity_data?.id || authUser.id;
    const discordName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.user_metadata?.preferred_username || 'Discord User';
    const { data } = await supabase.from('members').select('*').eq('discord_id', discordId).maybeSingle();
    if (data) {
      setMyProfile(data as Member);
      return;
    }
    const { count } = await supabase.from('members').select('id', { count: 'exact', head: true });
    const firstMember: Member = {
      discord_id: discordId,
      discord_name: discordName,
      nama_rp: discordName,
      callsign: 'UNSET',
      pangkat: 'Cadet',
      divisi: 'Patrol',
      role: (count || 0) === 0 ? 'SUPER_ADMIN' : 'CADET',
      status: 'ACTIVE',
    };
    await supabase.from('members').insert(firstMember);
    setMyProfile(firstMember);
    await addAudit('LOGIN_DISCORD', 'members', `Akun Discord dibuat: ${discordName}`);
  }

  async function addAudit(action: string, target: string, detail: string) {
    const actor = myProfile?.nama_rp || user?.user_metadata?.full_name || user?.email || 'System';
    const row = { actor_name: actor, action, target, detail };
    if (supabase) await supabase.from('audit_logs').insert(row);
    setAudits((old) => [{ ...row, created_at: new Date().toISOString() }, ...old]);
  }

  async function loadDb() {
    if (!supabase) return;
    const [p, c, m, a] = await Promise.all([
      supabase.from('pasal').select('*').order('kode'),
      supabase.from('ten_codes').select('*').order('kode'),
      supabase.from('members').select('*').order('created_at', { ascending: false }),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    if (p.data?.length) setPasal(p.data as Pasal[]);
    if (c.data?.length) setCodes(c.data as Code[]);
    if (m.data) setMembers(m.data as Member[]);
    if (a.data) setAudits(a.data as Audit[]);
  }

  async function savePasal() {
    if (!canManage(myProfile?.role)) return alert('Akses ditolak. Minimal COMMAND.');
    const data = { ...form, denda: Number(form.denda), bulan: Number(form.bulan) };
    if (!data.kode || !data.tentang) return alert('Kode dan isi pasal wajib diisi.');
    if (supabase) await supabase.from('pasal').upsert(data, { onConflict: 'kode' });
    else setPasal([...pasal.filter((x) => x.kode !== data.kode), data]);
    await addAudit('UPSERT_PASAL', 'pasal', `Pasal ${data.kode} disimpan`);
    setForm({ kode: '', tentang: '', denda: 0, bulan: 0, kategori: 'Ringan' });
    await loadDb();
  }

  async function delPasal(kode: string) {
    if (!canManage(myProfile?.role)) return alert('Akses ditolak. Minimal COMMAND.');
    if (!confirm('Hapus pasal ini?')) return;
    if (supabase) await supabase.from('pasal').delete().eq('kode', kode);
    else setPasal(pasal.filter((x) => x.kode !== kode));
    await addAudit('DELETE_PASAL', 'pasal', `Pasal ${kode} dihapus`);
    await loadDb();
  }

  async function saveCode() {
    if (!canManage(myProfile?.role)) return alert('Akses ditolak. Minimal COMMAND.');
    if (!codeForm.kode || !codeForm.arti) return alert('Kode dan arti wajib diisi.');
    if (supabase) await supabase.from('ten_codes').upsert(codeForm, { onConflict: 'kode' });
    else setCodes([...codes.filter((x) => x.kode !== codeForm.kode), codeForm]);
    await addAudit('UPSERT_TEN_CODE', 'ten_codes', `Sandi ${codeForm.kode} disimpan`);
    setCodeForm({ kode: '', arti: '' });
    await loadDb();
  }

  async function delCode(kode: string) {
    if (!canManage(myProfile?.role)) return alert('Akses ditolak. Minimal COMMAND.');
    if (!confirm('Hapus sandi angka ini?')) return;
    if (supabase) await supabase.from('ten_codes').delete().eq('kode', kode);
    else setCodes(codes.filter((x) => x.kode !== kode));
    await addAudit('DELETE_TEN_CODE', 'ten_codes', `Sandi ${kode} dihapus`);
    await loadDb();
  }

  async function saveMember() {
    if (!canManage(myProfile?.role)) return alert('Akses ditolak. Minimal COMMAND.');
    if (!memberForm.nama_rp || !memberForm.callsign) return alert('Nama RP dan callsign wajib diisi.');
    if (supabase) await supabase.from('members').upsert(memberForm, { onConflict: 'id' });
    await addAudit('UPSERT_MEMBER', 'members', `Anggota ${memberForm.nama_rp} disimpan dengan role ${memberForm.role}`);
    setMemberForm({ nama_rp: '', callsign: '', pangkat: '', divisi: 'Patrol', role: 'OFFICER', status: 'ACTIVE' });
    await loadDb();
  }

  async function delMember(id?: string, name?: string) {
    if (!id) return;
    if (!canManage(myProfile?.role)) return alert('Akses ditolak. Minimal COMMAND.');
    if (!confirm('Hapus anggota ini?')) return;
    if (supabase) await supabase.from('members').delete().eq('id', id);
    await addAudit('DELETE_MEMBER', 'members', `Anggota ${name || id} dihapus`);
    await loadDb();
  }

  const filtered = pasal.filter((p) => (p.kode + ' ' + p.tentang + ' ' + p.kategori).toLowerCase().includes(q.toLowerCase()));
  const total = useMemo(() => picked.reduce((a, p) => ({ denda: a.denda + p.denda, bulan: a.bulan + p.bulan }), { denda: 0, bulan: 0 }), [picked]);
  const officerCount = members.filter((m) => m.status === 'ACTIVE').length;
  const highCases = pasal.filter((p) => p.kategori === 'Berat' || p.kategori === 'Persidangan').length;

  return (
    <main className="min-h-screen bg-grid bg-[#050914] text-slate-100">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,#0b3b86_0,transparent_38%),radial-gradient(circle_at_right,#1e1b4b_0,transparent_32%)] opacity-70" />
      <div className="relative max-w-7xl mx-auto p-4 md:p-8">
        <header className="card rounded-3xl p-5 mb-5 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="Aeterna Police" width={86} height={86} className="rounded-2xl bg-white/5" />
            <div>
              <p className="text-blue-300 font-black tracking-[.3em] text-xs">AETERNA POLICE DEPARTMENT</p>
              <h1 className="text-2xl md:text-4xl font-black">Police Management System</h1>
              <p className="text-slate-400">Discord login, role permission, database anggota, dashboard Kapolri, dan audit log.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {user ? (
              <>
                <span className="badge bg-blue-500/15 text-blue-300"><Shield size={14} /> {myProfile?.role || 'CADET'}</span>
                <button onClick={logout} className="btn bg-slate-800"><LogOut size={16} /> Logout</button>
              </>
            ) : (
              <button onClick={loginDiscord} className="btn btn-primary"><UserRound size={18} /> Login Discord</button>
            )}
          </div>
        </header>

        {!user && (
          <section className="card rounded-3xl p-8 mb-5 text-center">
            <Lock className="mx-auto mb-3 text-blue-300" size={42} />
            <h2 className="text-2xl font-black">Masuk pakai Discord</h2>
            <p className="text-slate-400 mt-2 mb-5">Semua akun anggota APD ditautkan ke Discord. Role permission diatur dari database anggota.</p>
            <button onClick={loginDiscord} className="btn btn-primary mx-auto"><UserRound size={18} /> Login dengan Discord</button>
          </section>
        )}

        <div className="grid lg:grid-cols-[280px_1fr] gap-5">
          <aside className="card rounded-3xl p-3 h-fit sticky top-4">
            {nav.map(([id, Icon, label]) => {
              const locked = (id === 'admin' || id === 'members') && !canManage(myProfile?.role);
              const auditLocked = id === 'audit' && !canViewAudit(myProfile?.role);
              return (
                <button key={id} disabled={locked || auditLocked} onClick={() => setTab(id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl mb-2 text-left font-bold disabled:opacity-40 disabled:cursor-not-allowed ${tab === id ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-300'}`}>
                  <Icon size={18} />{label}
                </button>
              );
            })}
          </aside>

          <section className="space-y-5">
            {tab === 'dashboard' && (
              <div className="space-y-5">
                <div className="grid md:grid-cols-4 gap-4">
                  <Stat icon={<Users />} title="Anggota Aktif" val={officerCount} />
                  <Stat icon={<Gavel />} title="Total Pasal" val={pasal.length} />
                  <Stat icon={<Activity />} title="Pasal Berat" val={highCases} />
                  <Stat icon={<FileClock />} title="Audit Log" val={audits.length} />
                </div>
                <div className="grid lg:grid-cols-2 gap-5">
                  <Panel title="Komposisi Role" icon={<BarChart3 />}>
                    {roles.map((r) => <Bar key={r} label={r} value={members.filter((m) => m.role === r).length} max={Math.max(1, members.length)} />)}
                  </Panel>
                  <Panel title="Aktivitas Terbaru" icon={<FileClock />}>
                    <div className="space-y-2 max-h-80 overflow-auto">{audits.slice(0, 8).map((a, i) => <div key={a.id || i} className="rounded-xl bg-slate-950/50 border border-white/10 p-3"><b>{a.action}</b><p className="text-sm text-slate-400">{a.actor_name} — {a.detail}</p></div>)}</div>
                  </Panel>
                </div>
              </div>
            )}

            {tab === 'pasal' && (
              <div className="card rounded-3xl p-5">
                <div className="flex gap-3 mb-4">
                  <div className="relative flex-1"><Search className="absolute left-3 top-3 text-slate-500" size={18} /><input className="input pl-10" placeholder="Cari kode / isi pasal / kategori..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
                  <button className="btn bg-red-600" onClick={() => setPicked([])}>Reset</button>
                </div>
                <div className="grid gap-3">{filtered.map((p) => <div key={p.kode} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"><div><span className={`badge ${badge(p.kategori)}`}>{p.kategori}</span><h3 className="text-lg font-black mt-2">Pasal {p.kode}</h3><p className="text-slate-300">{p.tentang}</p><p className="text-slate-500 text-sm">Denda ${p.denda.toLocaleString('id-ID')} • {p.bulan} Bulan</p></div><button onClick={() => setPicked([...picked, p])} className="btn btn-primary"><Plus size={16} /> Tambah</button></div>)}</div>
                <div className="mt-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4"><b>Total: ${total.denda.toLocaleString('id-ID')} • {total.bulan} Bulan</b><pre className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{picked.map((p) => `- Pasal ${p.kode}: ${p.tentang}`).join('\n') || 'Belum ada pasal dipilih.'}</pre></div>
              </div>
            )}

            {tab === 'codes' && <div className="card rounded-3xl p-5 grid gap-3">{codes.map((c) => <div key={c.kode} className="rounded-2xl bg-slate-950/50 border border-white/10 p-4"><b className="text-blue-300">{c.kode}</b><span className="text-slate-300"> — {c.arti}</span></div>)}</div>}

            {tab === 'members' && canManage(myProfile?.role) && (
              <div className="grid xl:grid-cols-[420px_1fr] gap-5">
                <Panel title="Form Anggota" icon={<UserCog />}>
                  <input className="input" placeholder="Nama RP" value={memberForm.nama_rp} onChange={(e) => setMemberForm({ ...memberForm, nama_rp: e.target.value })} />
                  <input className="input" placeholder="Callsign" value={memberForm.callsign} onChange={(e) => setMemberForm({ ...memberForm, callsign: e.target.value })} />
                  <input className="input" placeholder="Pangkat" value={memberForm.pangkat} onChange={(e) => setMemberForm({ ...memberForm, pangkat: e.target.value })} />
                  <input className="input" placeholder="Divisi" value={memberForm.divisi} onChange={(e) => setMemberForm({ ...memberForm, divisi: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <select className="input" value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value as Role })}>{roles.map((r) => <option key={r}>{r}</option>)}</select>
                    <select className="input" value={memberForm.status} onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value as Member['status'] })}><option>ACTIVE</option><option>OFF_DUTY</option><option>SUSPENDED</option></select>
                  </div>
                  <button onClick={saveMember} className="btn btn-primary mt-2">Simpan Anggota</button>
                </Panel>
                <Panel title="Database Anggota" icon={<Users />}>
                  <div className="space-y-2 max-h-[620px] overflow-auto">{members.map((m) => <div key={m.id || m.callsign} className="rounded-2xl bg-slate-950/50 border border-white/10 p-4 flex justify-between gap-3"><div><b>{m.callsign} — {m.nama_rp}</b><p className="text-sm text-slate-400">{m.pangkat} • {m.divisi} • {m.discord_name || 'Belum tertaut Discord'}</p><span className="badge bg-blue-500/10 text-blue-300 mt-2">{m.role}</span></div><div className="flex gap-2"><button onClick={() => setMemberForm(m)}><Edit3 size={17} /></button><button onClick={() => delMember(m.id, m.nama_rp)}><Trash2 size={17} /></button></div></div>)}</div>
                </Panel>
              </div>
            )}

            {tab === 'admin' && canManage(myProfile?.role) && (
              <div className="grid xl:grid-cols-2 gap-5">
                <Panel title="Admin Pasal" icon={<Gavel />}>
                  <input className="input" placeholder="Kode" value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} />
                  <input className="input" placeholder="Tentang" value={form.tentang} onChange={(e) => setForm({ ...form, tentang: e.target.value })} />
                  <div className="grid grid-cols-3 gap-2"><input className="input" type="number" placeholder="Denda" value={form.denda} onChange={(e) => setForm({ ...form, denda: Number(e.target.value) })} /><input className="input" type="number" placeholder="Bulan" value={form.bulan} onChange={(e) => setForm({ ...form, bulan: Number(e.target.value) })} /><select className="input" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value as Pasal['kategori'] })}><option>Ringan</option><option>Sedang</option><option>Berat</option><option>Persidangan</option></select></div>
                  <button onClick={savePasal} className="btn btn-primary mt-2">Simpan Pasal</button>
                  <div className="mt-4 max-h-96 overflow-auto space-y-2">{pasal.map((p) => <div key={p.kode} className="flex justify-between gap-2 text-sm bg-slate-950/50 p-3 rounded-xl"><span>{p.kode} - {p.tentang}</span><span className="flex gap-2"><button onClick={() => setForm(p)}><Edit3 size={16} /></button><button onClick={() => delPasal(p.kode)}><Trash2 size={16} /></button></span></div>)}</div>
                </Panel>
                <Panel title="Admin Sandi Angka" icon={<Radio />}>
                  <input className="input" placeholder="Kode" value={codeForm.kode} onChange={(e) => setCodeForm({ ...codeForm, kode: e.target.value })} />
                  <input className="input" placeholder="Arti" value={codeForm.arti} onChange={(e) => setCodeForm({ ...codeForm, arti: e.target.value })} />
                  <button onClick={saveCode} className="btn btn-primary mt-2">Simpan Ten-Code</button>
                  <div className="mt-4 max-h-96 overflow-auto space-y-2">{codes.map((c) => <div key={c.kode} className="flex justify-between gap-2 text-sm bg-slate-950/50 p-3 rounded-xl"><span>{c.kode} - {c.arti}</span><span className="flex gap-2"><button onClick={() => setCodeForm(c)}><Edit3 size={16} /></button><button onClick={() => delCode(c.kode)}><Trash2 size={16} /></button></span></div>)}</div>
                </Panel>
              </div>
            )}

            {tab === 'audit' && canViewAudit(myProfile?.role) && (
              <Panel title="Audit Log" icon={<ClipboardList />}>
                <div className="space-y-2">{audits.map((a, i) => <div key={a.id || i} className="rounded-2xl bg-slate-950/50 border border-white/10 p-4"><div className="flex flex-wrap gap-2 justify-between"><b>{a.action}</b><span className="text-xs text-slate-500">{a.created_at ? new Date(a.created_at).toLocaleString('id-ID') : '-'}</span></div><p className="text-sm text-slate-400">Actor: {a.actor_name}</p><p className="text-slate-300">{a.detail}</p></div>)}</div>
              </Panel>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Stat({ title, val, icon }: { title: string; val: any; icon?: React.ReactNode }) {
  return <div className="card rounded-3xl p-5"><div className="text-blue-300 mb-3">{icon}</div><p className="text-slate-400 text-sm">{title}</p><b className="text-3xl font-black">{val}</b></div>;
}
function Panel({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return <div className="card rounded-3xl p-5"><h2 className="font-black text-xl mb-4 flex items-center gap-2 text-white"><span className="text-blue-300">{icon}</span>{title}</h2>{children}</div>;
}
function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const w = Math.max(4, Math.round((value / max) * 100));
  return <div className="mb-3"><div className="flex justify-between text-sm mb-1"><span>{label}</span><b>{value}</b></div><div className="h-3 bg-slate-900 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full" style={{ width: `${w}%` }} /></div></div>;
}
