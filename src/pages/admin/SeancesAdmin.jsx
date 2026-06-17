import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  getSeances, createSeance, updateSeance,
  markAsPaid, markAsTerminee, cancelSeance, deleteSeance,
  parseDateFields,
} from '../../services/seancesService';

// ── Design constants (même palette que le portfolio) ──
const C = {
  bg: '#060612', bg2: '#0A0A1A', card: '#0D0D1E',
  red: '#FF1744', w: '#F0F0F5', grey: 'rgba(240,240,245,.45)',
  b05: 'rgba(255,255,255,.05)', b08: 'rgba(255,255,255,.08)',
  r08: 'rgba(255,23,68,.08)', r30: 'rgba(255,23,68,.3)',
  green: '#4CAF50', orange: '#FF9800', blue: '#2196F3',
};
const F = {
  h: "'Playfair Display', Georgia, serif",
  m: "'Space Mono', 'Courier New', monospace",
  b: "'Inter', 'Helvetica Neue', sans-serif",
};

const MOIS_LIST = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

const PAY_COLOR   = { payé: C.green, non_payé: C.red, en_attente: C.orange };
const PAY_LABEL   = { payé: 'Payé', non_payé: 'Non payé', en_attente: 'En attente' };
const SEA_COLOR   = { 'à_venir': C.blue, terminée: C.green, annulée: C.grey };
const SEA_LABEL   = { 'à_venir': 'À venir', terminée: 'Terminée', annulée: 'Annulée' };
const PAGE_SIZE   = 20;
const ADMIN_PASS  = import.meta.env.VITE_ADMIN_PASSWORD;

// ── Petits composants UI ──

const Badge = ({ color, label }) => (
  <span style={{
    display: 'inline-block', padding: '2px 10px',
    border: `1px solid ${color}`, color, background: `${color}18`,
    fontFamily: F.m, fontSize: '.55rem', letterSpacing: '.1em',
    whiteSpace: 'nowrap',
  }}>{label}</span>
);

const Btn = ({ onClick, children, variant = 'ghost', disabled = false, style = {} }) => {
  const variants = {
    ghost:   { background: 'transparent', border: `1px solid ${C.b08}`, color: C.grey },
    red:     { background: C.r08, border: `1px solid ${C.r30}`, color: C.red },
    green:   { background: 'rgba(76,175,80,.1)', border: '1px solid rgba(76,175,80,.4)', color: C.green },
    primary: { background: C.red, border: 'none', color: C.w },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variants[variant],
        padding: '5px 12px', fontFamily: F.m, fontSize: '.58rem', letterSpacing: '.1em',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .4 : 1,
        transition: 'opacity .2s', ...style,
      }}
    >{children}</button>
  );
};

const Input = ({ label, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {label && <span style={{ fontFamily: F.m, fontSize: '.55rem', color: C.grey, letterSpacing: '.12em' }}>{label}</span>}
    <input
      {...props}
      style={{
        background: C.card, border: `1px solid ${C.b08}`, color: C.w,
        padding: '8px 12px', fontFamily: F.b, fontSize: '.85rem',
        outline: 'none', width: '100%', boxSizing: 'border-box',
        ...props.style,
      }}
    />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {label && <span style={{ fontFamily: F.m, fontSize: '.55rem', color: C.grey, letterSpacing: '.12em' }}>{label}</span>}
    <select
      {...props}
      style={{
        background: C.card, border: `1px solid ${C.b08}`, color: C.w,
        padding: '8px 12px', fontFamily: F.b, fontSize: '.85rem',
        outline: 'none', width: '100%', cursor: 'pointer',
        ...props.style,
      }}
    >{children}</select>
  </div>
);

const Toast = ({ msg, type }) => (
  msg ? (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      background: type === 'error' ? C.red : C.green,
      color: C.w, padding: '10px 24px',
      fontFamily: F.m, fontSize: '.65rem', letterSpacing: '.12em', zIndex: 1000,
    }}>{msg}</div>
  ) : null
);

const Overlay = ({ onClose, children }) => (
  <div
    style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 20,
    }}
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div style={{
      background: C.bg2, border: `1px solid ${C.b08}`,
      width: '100%', maxWidth: 600, maxHeight: '90vh',
      overflowY: 'auto', padding: 32,
    }}>
      {children}
    </div>
  </div>
);

// ── Formulaire création / édition ──

const EMPTY_FORM = {
  client_prenom: '', client_nom: '', client_email: '',
  date_seance: '', heure_debut: '', heure_fin: '',
  type_seance: '', statut_paiement: 'non_payé',
  prix: '', statut_seance: 'à_venir', notes_interne: '',
};

const SeanceForm = ({ initial = EMPTY_FORM, onSubmit, onClose, loading, title }) => {
  const [form, setForm] = useState(initial);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = e => {
    e.preventDefault();
    if (!form.client_prenom || !form.client_nom || !form.date_seance || !form.heure_debut)
      return alert('Prénom, nom, date et heure de début sont obligatoires.');
    onSubmit({ ...form, prix: parseFloat(form.prix) || 0 });
  };

  return (
    <form onSubmit={submit}>
      <h2 style={{ fontFamily: F.h, fontWeight: 700, fontSize: '1.4rem', color: C.w, margin: '0 0 24px' }}>
        {title}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Input label="PRÉNOM *" value={form.client_prenom} onChange={f('client_prenom')} required />
        <Input label="NOM *"    value={form.client_nom}    onChange={f('client_nom')}    required />
      </div>
      <Input label="EMAIL" type="email" value={form.client_email} onChange={f('client_email')} style={{ marginBottom: 12 }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Input label="DATE *"       type="date" value={form.date_seance} onChange={f('date_seance')} required />
        <Input label="HEURE DÉBUT *" type="time" value={form.heure_debut} onChange={f('heure_debut')} required />
        <Input label="HEURE FIN"    type="time" value={form.heure_fin}   onChange={f('heure_fin')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Input label="TYPE DE SÉANCE" value={form.type_seance} onChange={f('type_seance')} placeholder="ex: Portrait, Mariage..." />
        <Input label="PRIX (€)" type="number" min="0" step="0.01" value={form.prix} onChange={f('prix')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Select label="STATUT PAIEMENT" value={form.statut_paiement} onChange={f('statut_paiement')}>
          <option value="non_payé">Non payé</option>
          <option value="en_attente">En attente</option>
          <option value="payé">Payé</option>
        </Select>
        <Select label="STATUT SÉANCE" value={form.statut_seance} onChange={f('statut_seance')}>
          <option value="à_venir">À venir</option>
          <option value="terminée">Terminée</option>
          <option value="annulée">Annulée</option>
        </Select>
      </div>

      <div style={{ marginBottom: 20 }}>
        <span style={{ fontFamily: F.m, fontSize: '.55rem', color: C.grey, letterSpacing: '.12em', display: 'block', marginBottom: 4 }}>NOTES INTERNES</span>
        <textarea
          value={form.notes_interne} onChange={f('notes_interne')}
          rows={3}
          style={{
            background: C.card, border: `1px solid ${C.b08}`, color: C.w,
            padding: '8px 12px', fontFamily: F.b, fontSize: '.85rem',
            outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Btn onClick={onClose} variant="ghost">ANNULER</Btn>
        <Btn variant="primary" disabled={loading} style={{ padding: '8px 24px' }}>
          {loading ? 'ENREGISTREMENT...' : 'SAUVEGARDER'}
        </Btn>
      </div>
    </form>
  );
};

// ── Modal détail ──

const DetailModal = ({ seance, onClose, onPaid, onTerminee, onCancel, onEdit }) => (
  <Overlay onClose={onClose}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
      <h2 style={{ fontFamily: F.h, fontWeight: 700, fontSize: '1.4rem', color: C.w, margin: 0 }}>
        {seance.client_prenom} {seance.client_nom}
      </h2>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.grey, cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
      {[
        ['Email', seance.client_email],
        ['Date', `${seance.jour} ${seance.annee ? new Date(seance.date_seance).getDate() : ''} ${seance.mois} ${seance.annee}`],
        ['Heure', `${seance.heure_debut}${seance.heure_fin ? ' → ' + seance.heure_fin : ''}`],
        ['Type', seance.type_seance || '—'],
        ['Prix', seance.prix ? `${seance.prix} €` : '—'],
        ['Google Calendar', seance.google_event_id ? '✓ Lié' : '✕ Non lié'],
      ].map(([k, v]) => (
        <div key={k}>
          <div style={{ fontFamily: F.m, fontSize: '.52rem', color: C.grey, letterSpacing: '.2em', marginBottom: 4 }}>{k}</div>
          <div style={{ fontFamily: F.b, fontSize: '.9rem', color: C.w }}>{v}</div>
        </div>
      ))}
    </div>

    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
      <Badge color={PAY_COLOR[seance.statut_paiement]} label={PAY_LABEL[seance.statut_paiement]} />
      <Badge color={SEA_COLOR[seance.statut_seance]}   label={SEA_LABEL[seance.statut_seance]} />
    </div>

    {seance.notes_interne && (
      <div style={{ padding: '12px 16px', background: C.card, border: `1px solid ${C.b05}`, marginBottom: 20 }}>
        <div style={{ fontFamily: F.m, fontSize: '.52rem', color: C.grey, letterSpacing: '.2em', marginBottom: 6 }}>NOTES INTERNES</div>
        <div style={{ fontFamily: F.b, fontSize: '.85rem', color: 'rgba(240,240,245,.7)', whiteSpace: 'pre-wrap' }}>{seance.notes_interne}</div>
      </div>
    )}

    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {seance.statut_paiement !== 'payé'  && <Btn variant="green" onClick={() => onPaid(seance.id)}>✓ MARQUER PAYÉ</Btn>}
      {seance.statut_seance === 'à_venir' && <Btn variant="green" onClick={() => onTerminee(seance.id)}>✓ MARQUER TERMINÉE</Btn>}
      {seance.statut_seance === 'à_venir' && <Btn variant="red"   onClick={() => onCancel(seance.id)}>✕ ANNULER</Btn>}
      <Btn onClick={onEdit}>✏ MODIFIER</Btn>
      <Btn onClick={onClose} variant="ghost" style={{ marginLeft: 'auto' }}>FERMER</Btn>
    </div>
  </Overlay>
);

// ── Ligne tableau ──

const SeanceRow = ({ s, onPaid, onTerminee, onDetail }) => {
  const d = s.date_seance ? new Date(s.date_seance) : null;
  const dateStr = d
    ? `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
    : '—';

  return (
    <tr style={{ borderBottom: `1px solid ${C.b05}`, transition: 'background .15s' }}
      onMouseEnter={e => e.currentTarget.style.background = C.card}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <td style={td}>{s.client_prenom} {s.client_nom}</td>
      <td style={td}>{dateStr}</td>
      <td style={td}>{s.heure_debut || '—'}</td>
      <td style={td}>{s.type_seance || '—'}</td>
      <td style={{ ...td, textAlign: 'right' }}>{s.prix ? `${s.prix} €` : '—'}</td>
      <td style={td}><Badge color={PAY_COLOR[s.statut_paiement]}  label={PAY_LABEL[s.statut_paiement]} /></td>
      <td style={td}><Badge color={SEA_COLOR[s.statut_seance]}    label={SEA_LABEL[s.statut_seance]} /></td>
      <td style={{ ...td, whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {s.statut_paiement !== 'payé'  && <Btn variant="green" onClick={() => onPaid(s.id)}>PAYÉ</Btn>}
          {s.statut_seance === 'à_venir' && <Btn variant="green" onClick={() => onTerminee(s.id)}>TERMINÉE</Btn>}
          <Btn onClick={() => onDetail(s)}>DÉTAILS</Btn>
        </div>
      </td>
    </tr>
  );
};
const td = { padding: '10px 12px', fontFamily: F.b, fontSize: '.82rem', color: C.w, verticalAlign: 'middle' };

// ── Carte statistique ──

const StatCard = ({ label, value, color = C.w }) => (
  <div style={{
    padding: '16px 20px', border: `1px solid ${C.b05}`, background: C.card,
    display: 'flex', flexDirection: 'column', gap: 4,
  }}>
    <div style={{ fontFamily: F.m, fontSize: '.52rem', color: C.grey, letterSpacing: '.2em' }}>{label}</div>
    <div style={{ fontFamily: F.h, fontSize: '1.6rem', fontWeight: 700, color }}>{value}</div>
  </div>
);

// ── Auth Gate ──

const AuthGate = ({ onAuth }) => {
  const [pwd, setPwd] = useState('');
  const [err, setErr]  = useState(false);

  const check = () => {
    if (!ADMIN_PASS || pwd === ADMIN_PASS) {
      sessionStorage.setItem('admin_auth', '1');
      onAuth();
    } else {
      setErr(true);
      setTimeout(() => setErr(false), 2000);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 320, padding: 40, border: `1px solid ${C.b08}`, background: C.bg2 }}>
        <div style={{ fontFamily: F.h, fontWeight: 700, fontSize: '1.4rem', color: C.w, marginBottom: 8 }}>Admin</div>
        <div style={{ fontFamily: F.m, fontSize: '.6rem', color: C.grey, letterSpacing: '.2em', marginBottom: 24 }}>SÉANCES / GESTION</div>
        <Input label="MOT DE PASSE" type="password" value={pwd} onChange={e => setPwd(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()} style={{ marginBottom: 12 }} />
        {err && <div style={{ color: C.red, fontFamily: F.m, fontSize: '.6rem', marginBottom: 8 }}>Mot de passe incorrect.</div>}
        <Btn variant="primary" onClick={check} style={{ width: '100%', padding: '10px' }}>ACCÉDER</Btn>
      </div>
    </div>
  );
};

// ── Page principale ──

export default function SeancesAdmin() {
  const [authed, setAuthed] = useState(
    !ADMIN_PASS || sessionStorage.getItem('admin_auth') === '1'
  );
  const [filters, setFilters] = useState({ mois: '', annee: '', statutPaiement: '', statutSeance: '', client: '' });
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState({ msg: '', type: 'ok' });

  const qc = useQueryClient();

  const showToast = useCallback((msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'ok' }), 3000);
  }, []);

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['seances'] });
  }, [qc]);

  // ── Query ──
  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['seances', filters, page],
    queryFn: () => getSeances({ ...filters, page, pageSize: PAGE_SIZE }),
    enabled: authed,
    placeholderData: keepPreviousData,
  });

  const seances = result?.data || [];
  const total   = result?.count || 0;
  const pages   = Math.ceil(total / PAGE_SIZE);

  // ── Stats résumé ──
  const { data: statsData } = useQuery({
    queryKey: ['seances-stats'],
    queryFn: () => getSeances({ pageSize: 1000 }),
    enabled: authed,
  });
  const all = statsData?.data || [];
  const stats = {
    total:       all.length,
    totalRevenu: all.filter(s => s.statut_paiement === 'payé').reduce((s, x) => s + (x.prix || 0), 0),
    nonPayees:   all.filter(s => s.statut_paiement === 'non_payé' && s.statut_seance === 'à_venir').length,
    aVenir:      all.filter(s => s.statut_seance === 'à_venir').length,
  };

  // ── Mutations ──
  const mutOpts = (msg) => ({
    onSuccess: () => { invalidate(); showToast(msg); setDetail(null); },
    onError:   (e) => showToast(e.message, 'error'),
  });

  const mutCreate    = useMutation({ mutationFn: createSeance,    ...mutOpts('Séance créée.') });
  const mutUpdate    = useMutation({ mutationFn: ({ id, data }) => updateSeance(id, data), ...mutOpts('Séance mise à jour.') });
  const mutPaid      = useMutation({ mutationFn: markAsPaid,      ...mutOpts('Marquée comme payée.') });
  const mutTerminee  = useMutation({ mutationFn: markAsTerminee,  ...mutOpts('Marquée comme terminée.') });
  const mutCancel    = useMutation({ mutationFn: cancelSeance,    ...mutOpts('Séance annulée.') });
  const mutDelete    = useMutation({ mutationFn: deleteSeance,    ...mutOpts('Séance supprimée.') });

  const handleDelete = (id) => {
    if (!confirm('Supprimer définitivement cette séance ?')) return;
    mutDelete.mutate(id);
  };

  const setF = k => v => { setFilters(p => ({ ...p, [k]: v })); setPage(0); };

  if (!authed) return <AuthGate onAuth={() => setAuthed(true)} />;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.w, fontFamily: F.b }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: C.bg2, borderBottom: `1px solid ${C.b05}`,
        padding: '0 40px', display: 'flex', alignItems: 'center', gap: 16, height: 56,
      }}>
        <a href="/" style={{ fontFamily: F.h, fontWeight: 700, fontSize: '1rem', color: C.w, textDecoration: 'none', letterSpacing: '.1em' }}>
          Khun.MacJ
        </a>
        <span style={{ color: C.b08, fontSize: '1.2rem' }}>›</span>
        <span style={{ fontFamily: F.m, fontSize: '.6rem', color: C.grey, letterSpacing: '.2em' }}>GESTION DES SÉANCES</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Btn variant="primary" onClick={() => setCreating(true)}>+ NOUVELLE SÉANCE</Btn>
          {ADMIN_PASS && (
            <Btn onClick={() => { sessionStorage.removeItem('admin_auth'); setAuthed(false); }}>DÉCONNEXION</Btn>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 40px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 32 }}>
          <StatCard label="TOTAL SÉANCES"    value={stats.total}   />
          <StatCard label="À VENIR"          value={stats.aVenir}  color={C.blue} />
          <StatCard label="NON PAYÉES"       value={stats.nonPayees} color={C.red} />
          <StatCard label="REVENU ENCAISSÉ"  value={`${stats.totalRevenu.toFixed(0)} €`} color={C.green} />
        </div>

        {/* Filtres */}
        <div style={{
          display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20,
          padding: 16, background: C.bg2, border: `1px solid ${C.b05}`,
        }}>
          <div style={{ flex: '1 1 140px', minWidth: 140 }}>
            <Select label="MOIS" value={filters.mois} onChange={e => setF('mois')(e.target.value)}>
              <option value="">Tous les mois</option>
              {MOIS_LIST.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>
          <div style={{ flex: '0 0 100px' }}>
            <Select label="ANNÉE" value={filters.annee} onChange={e => setF('annee')(e.target.value)}>
              <option value="">Toutes</option>
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </Select>
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <Select label="PAIEMENT" value={filters.statutPaiement} onChange={e => setF('statutPaiement')(e.target.value)}>
              <option value="">Tous</option>
              <option value="payé">Payé</option>
              <option value="non_payé">Non payé</option>
              <option value="en_attente">En attente</option>
            </Select>
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <Select label="STATUT" value={filters.statutSeance} onChange={e => setF('statutSeance')(e.target.value)}>
              <option value="">Tous</option>
              <option value="à_venir">À venir</option>
              <option value="terminée">Terminée</option>
              <option value="annulée">Annulée</option>
            </Select>
          </div>
          <div style={{ flex: '2 1 200px' }}>
            <Input label="RECHERCHE CLIENT" value={filters.client}
              onChange={e => setF('client')(e.target.value)}
              placeholder="Nom, prénom ou email…" />
          </div>
          {Object.values(filters).some(Boolean) && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Btn onClick={() => { setFilters({ mois:'',annee:'',statutPaiement:'',statutSeance:'',client:'' }); setPage(0); }}>
                ✕ RESET
              </Btn>
            </div>
          )}
        </div>

        {/* Tableau */}
        <div style={{ border: `1px solid ${C.b05}`, overflow: 'auto' }}>
          {isError ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.red, fontFamily: F.m, fontSize: '.65rem' }}>
              Erreur de connexion Supabase. Vérifiez vos variables d'environnement.
            </div>
          ) : isLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.grey, fontFamily: F.m, fontSize: '.6rem', letterSpacing: '.2em' }}>
              CHARGEMENT...
            </div>
          ) : seances.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: C.grey, fontFamily: F.m, fontSize: '.6rem', letterSpacing: '.2em' }}>
              AUCUNE SÉANCE TROUVÉE
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ background: C.card, borderBottom: `1px solid ${C.b05}` }}>
                  {['Client','Date','Heure','Type','Prix','Paiement','Statut','Actions'].map(h => (
                    <th key={h} style={{
                      padding: '10px 12px', textAlign: 'left',
                      fontFamily: F.m, fontSize: '.52rem', color: C.grey, letterSpacing: '.15em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {seances.map(s => (
                  <SeanceRow
                    key={s.id} s={s}
                    onPaid={id => mutPaid.mutate(id)}
                    onTerminee={id => mutTerminee.mutate(id)}
                    onDetail={s => setDetail(s)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20, alignItems: 'center' }}>
            <Btn onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>‹ PRÉCÉDENT</Btn>
            <span style={{ fontFamily: F.m, fontSize: '.6rem', color: C.grey }}>
              Page {page + 1} / {pages} — {total} séances
            </span>
            <Btn onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}>SUIVANT ›</Btn>
          </div>
        )}

      </div>

      {/* Modal création */}
      {creating && (
        <Overlay onClose={() => setCreating(false)}>
          <SeanceForm
            title="Nouvelle séance"
            loading={mutCreate.isPending}
            onClose={() => setCreating(false)}
            onSubmit={data => mutCreate.mutate(data, { onSuccess: () => setCreating(false) })}
          />
        </Overlay>
      )}

      {/* Modal édition */}
      {editing && (
        <Overlay onClose={() => setEditing(null)}>
          <SeanceForm
            title="Modifier la séance"
            initial={{
              ...editing,
              date_seance: editing.date_seance ? editing.date_seance.split('T')[0] : '',
              prix: editing.prix?.toString() || '',
            }}
            loading={mutUpdate.isPending}
            onClose={() => setEditing(null)}
            onSubmit={data => mutUpdate.mutate(
              { id: editing.id, data },
              { onSuccess: () => setEditing(null) }
            )}
          />
        </Overlay>
      )}

      {/* Modal détail */}
      {detail && (
        <DetailModal
          seance={detail}
          onClose={() => setDetail(null)}
          onPaid={id  => mutPaid.mutate(id)}
          onTerminee={id => mutTerminee.mutate(id)}
          onCancel={id => { if (confirm('Annuler cette séance ?')) mutCancel.mutate(id); }}
          onEdit={() => { setEditing(detail); setDetail(null); }}
        />
      )}

      {/* Toast */}
      <Toast msg={toast.msg} type={toast.type} />

    </div>
  );
}
