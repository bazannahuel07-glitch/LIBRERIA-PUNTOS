import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Search, UserPlus, Plus, Gift, Users, Settings, Trash2, ArrowLeft, Check, X, Phone, History, Lock, LogOut } from 'lucide-react';
import { supabase } from './supabase';
import logo from './logo.jpeg';

const ADMIN_PASSWORD = 'Lib_410048';
const PESOS_POR_PUNTO = 100;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VistaCliente />} />
        <Route path="/admin" element={<VistaAdmin />} />
      </Routes>
    </BrowserRouter>
  );
}

function Header({ subtitulo }) {
  return (
    <header className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg">
      <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col items-center text-center">
        <img src={logo} alt="Logo" className="h-20 w-auto rounded-lg shadow-md mb-2 bg-white p-1" />
        {subtitulo && <p className="text-indigo-100 text-sm">{subtitulo}</p>}
      </div>
    </header>
  );
}

function VistaCliente() {
  const [dni, setDni] = useState('');
  const [cliente, setCliente] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [premios, setPremios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buscar = async () => {
    if (!dni.trim()) return;
    setLoading(true);
    setError('');
    setCliente(null);
    try {
      const { data: clienteData, error: err1 } = await supabase.from('clientes').select('*').eq('dni', dni.trim()).maybeSingle();
      if (err1) throw err1;
      if (!clienteData) {
        setError('No encontramos ningún cliente con ese DNI. Consultá al cobrar si querés registrarte.');
        setLoading(false);
        return;
      }
      const { data: historialData } = await supabase.from('historial').select('*').eq('dni', dni.trim()).order('fecha', { ascending: false });
      const { data: premiosData } = await supabase.from('premios').select('*').eq('activo', true).order('puntos', { ascending: true });
      setCliente(clienteData);
      setHistorial(historialData || []);
      setPremios(premiosData || []);
    } catch (e) {
      setError('Error al consultar. Intentá de nuevo.');
    }
    setLoading(false);
  };

  const saldo = cliente ? historial.reduce((acc, h) => acc + h.puntos, 0) : 0;

  const volver = () => { setCliente(null); setDni(''); setError(''); };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header subtitulo="Consultar mis puntos" />
      <main className="max-w-2xl mx-auto px-4 py-6">
        {!cliente ? (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Ingresá tu DNI</label>
            <input type="number" value={dni} onChange={(e) => setDni(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && buscar()}
              placeholder="Ej: 40123456"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-2xl font-bold text-center" autoFocus />
            <button onClick={buscar} disabled={loading || !dni.trim()}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
              <Search size={18} />{loading ? 'Buscando...' : 'Consultar mis puntos'}
            </button>
            {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">{error}</div>}
            <p className="text-xs text-slate-400 text-center mt-6">¿No estás registrado? Consultá al pagar tu próxima compra.</p>
          </div>
        ) : (
          <div>
            <button onClick={volver} className="flex items-center gap-1 text-indigo-600 mb-4 text-sm font-medium">
              <ArrowLeft size={16} /> Consultar otro DNI
            </button>
            <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
              <h2 className="text-2xl font-bold mb-1">Hola {cliente.nombre.split(' ')[0]}!</h2>
              <p className="text-slate-500 text-sm mb-4">DNI: {cliente.dni}</p>
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white text-center">
                <p className="text-indigo-100 text-sm">Tenés</p>
                <p className="text-5xl font-bold">{saldo}</p>
                <p className="text-indigo-100 text-lg">puntos disponibles</p>
              </div>
            </div>
            {premios.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
                <h3 className="font-bold mb-3 flex items-center gap-2"><Gift size={18} /> Premios que podés canjear</h3>
                <div className="space-y-2">
                  {premios.map(p => {
                    const puede = saldo >= p.puntos;
                    const faltan = p.puntos - saldo;
                    return (
                      <div key={p.id} className={`p-3 rounded-xl border-2 flex justify-between items-center ${puede ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                        <div>
                          <p className="font-medium">{p.nombre}</p>
                          <p className="text-xs text-slate-500">{puede ? '✓ Ya lo podés canjear' : `Te faltan ${faltan} pts`}</p>
                        </div>
                        <div className={`font-bold px-3 py-1 rounded-lg text-sm ${puede ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-700'}`}>{p.puntos} pts</div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 text-center mt-4">Para canjear, pedilo en el mostrador.</p>
              </div>
            )}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="font-bold mb-3 flex items-center gap-2"><History size={18} /> Mis movimientos</h3>
              {historial.length === 0 ? <p className="text-slate-400 text-sm">Aún no tenés movimientos.</p> : (
                <div className="space-y-2">
                  {historial.map(h => (
                    <div key={h.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div>
                        <p className="text-sm">{h.descripcion}</p>
                        <p className="text-xs text-slate-400">{new Date(h.fecha).toLocaleString('es-AR')}</p>
                      </div>
                      <span className={`font-semibold ${h.tipo === 'compra' ? 'text-emerald-600' : 'text-amber-600'}`}>{h.tipo === 'compra' ? '+' : ''}{h.puntos}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function VistaAdmin() {
  const [autenticado, setAutenticado] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { if (sessionStorage.getItem('admin_auth') === 'true') setAutenticado(true); }, []);

  const login = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true');
      setAutenticado(true);
      setError('');
    } else { setError('Contraseña incorrecta'); }
  };

  const logout = () => { sessionStorage.removeItem('admin_auth'); setAutenticado(false); setPassword(''); };

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header subtitulo="Panel de administración" />
        <main className="max-w-md mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-indigo-100 rounded-full p-4"><Lock className="text-indigo-600" size={32} /></div>
            </div>
            <h2 className="text-xl font-bold text-center mb-1">Acceso restringido</h2>
            <p className="text-sm text-slate-500 text-center mb-4">Ingresá la contraseña para continuar</p>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && login()}
              placeholder="Contraseña"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" autoFocus />
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            <button onClick={login} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl">Entrar</button>
          </div>
        </main>
      </div>
    );
  }

  return <PanelAdmin onLogout={logout} />;
}

function PanelAdmin({ onLogout }) {
  const [clientes, setClientes] = useState([]);
  const [premios, setPremios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('inicio');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDni, setSelectedDni] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [toast, setToast] = useState(null);
  const [clienteHistorial, setClienteHistorial] = useState([]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const { data: clientesData } = await supabase.from('clientes').select('*').order('nombre');
      const { data: premiosData } = await supabase.from('premios').select('*').eq('activo', true).order('puntos');
      const { data: historialData } = await supabase.from('historial').select('dni, puntos');
      const saldosPorDni = {};
      (historialData || []).forEach(h => { saldosPorDni[h.dni] = (saldosPorDni[h.dni] || 0) + h.puntos; });
      const clientesConSaldo = (clientesData || []).map(c => ({ ...c, saldo: saldosPorDni[c.dni] || 0 }));
      setClientes(clientesConSaldo);
      setPremios(premiosData || []);
    } catch (e) { showToast('Error al cargar datos', 'error'); }
    setLoading(false);
  };

  useEffect(() => { cargarDatos(); }, []);

  const cargarHistorialCliente = async (dni) => {
    const { data } = await supabase.from('historial').select('*').eq('dni', dni).order('fecha', { ascending: false });
    setClienteHistorial(data || []);
  };

  useEffect(() => { if (selectedDni) cargarHistorialCliente(selectedDni); }, [selectedDni]);

  const registerClient = async (cliente) => {
    if (clientes.find(c => c.dni === cliente.dni)) { showToast('Ya existe un cliente con ese DNI', 'error'); return false; }
    const { error } = await supabase.from('clientes').insert([cliente]);
    if (error) { showToast('Error al registrar', 'error'); return false; }
    showToast(`Cliente ${cliente.nombre} registrado`);
    await cargarDatos();
    return true;
  };

  const addPurchase = async (dni, monto) => {
    const puntos = Math.floor(monto / PESOS_POR_PUNTO);
    const descripcion = `Compra $${monto.toLocaleString('es-AR')} → +${puntos} pts`;
    const { error } = await supabase.from('historial').insert([{ dni, tipo: 'compra', monto, puntos, descripcion }]);
    if (error) { showToast('Error al sumar', 'error'); return; }
    showToast(`+${puntos} puntos sumados`);
    await cargarDatos();
    await cargarHistorialCliente(dni);
  };

  const redeemPrize = async (dni, premio) => {
    const cliente = clientes.find(c => c.dni === dni);
    if (cliente.saldo < premio.puntos) { showToast('Puntos insuficientes', 'error'); return; }
    const descripcion = `Canje: ${premio.nombre} (-${premio.puntos} pts)`;
    const { error } = await supabase.from('historial').insert([{ dni, tipo: 'canje', puntos: -premio.puntos, descripcion }]);
    if (error) { showToast('Error al canjear', 'error'); return; }
    showToast(`Canje realizado: ${premio.nombre}`);
    await cargarDatos();
    await cargarHistorialCliente(dni);
  };

  const deleteClient = async (dni) => {
    if (!confirm('¿Eliminar este cliente y todo su historial?')) return;
    await supabase.from('historial').delete().eq('dni', dni);
    await supabase.from('clientes').delete().eq('dni', dni);
    setSelectedDni(null);
    setView('clientes');
    showToast('Cliente eliminado');
    await cargarDatos();
  };

  const addPrize = async (nombre, puntos) => {
    const { error } = await supabase.from('premios').insert([{ nombre, puntos: parseInt(puntos), activo: true }]);
    if (error) { showToast('Error', 'error'); return; }
    showToast('Premio agregado');
    await cargarDatos();
  };

  const deletePrize = async (id) => {
    await supabase.from('premios').update({ activo: false }).eq('id', id);
    await cargarDatos();
  };

  const filteredClientes = searchTerm.trim()
    ? clientes.filter(c => { const term = searchTerm.toLowerCase(); return c.dni.includes(term) || c.nombre.toLowerCase().includes(term); })
    : clientes;

  const clienteActual = selectedDni ? clientes.find(c => c.dni === selectedDni) : null;
  const acumulados = clienteHistorial.filter(h => h.tipo === 'compra').reduce((a, h) => a + h.puntos, 0);
  const canjeados = Math.abs(clienteHistorial.filter(h => h.tipo === 'canje').reduce((a, h) => a + h.puntos, 0));

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-500">Cargando datos...</div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header subtitulo={`Panel admin · ${clientes.length} clientes`} />
      <nav className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex">
          {[
            { id: 'inicio', label: 'Inicio', icon: Search },
            { id: 'clientes', label: 'Clientes', icon: Users },
            { id: 'premios', label: 'Premios', icon: Gift },
            { id: 'config', label: 'Config', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setView(id); setSelectedDni(null); }}
              className={`flex-1 py-3 px-2 text-sm font-medium flex flex-col items-center gap-1 ${view === id ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
              <Icon size={18} />{label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-24">
        {clienteActual && (
          <div>
            <button onClick={() => { setSelectedDni(null); setView('clientes'); }} className="flex items-center gap-1 text-indigo-600 mb-4 text-sm font-medium">
              <ArrowLeft size={16} /> Volver
            </button>
            <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{clienteActual.nombre}</h2>
                  <p className="text-slate-500 text-sm">DNI: {clienteActual.dni}</p>
                  {clienteActual.telefono && <p className="text-slate-500 text-sm flex items-center gap-1 mt-1"><Phone size={12} /> {clienteActual.telefono}</p>}
                </div>
                <button onClick={() => deleteClient(clienteActual.dni)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={18} /></button>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white mb-4">
                <p className="text-indigo-100 text-sm">Saldo disponible</p>
                <p className="text-4xl font-bold">{clienteActual.saldo} <span className="text-lg font-normal">pts</span></p>
                <div className="flex gap-4 mt-3 text-sm text-indigo-100">
                  <span>Acumulados: {acumulados}</span>
                  <span>Canjeados: {canjeados}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowAddPurchase(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"><Plus size={18} /> Sumar compra</button>
                <button onClick={() => setShowRedeem(true)} className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"><Gift size={18} /> Canjear</button>
              </div>
            </div>

            {premios.length > 0 && (() => {
              const proximo = premios.find(p => p.puntos > clienteActual.saldo);
              if (!proximo) return null;
              return (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-amber-900">🎯 Le faltan <strong>{proximo.puntos - clienteActual.saldo} pts</strong> para: <strong>{proximo.nombre}</strong></p>
                </div>
              );
            })()}

            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="font-bold mb-3 flex items-center gap-2"><History size={18} /> Historial</h3>
              {clienteHistorial.length === 0 ? <p className="text-slate-400 text-sm">Sin movimientos aún</p> : (
                <div className="space-y-2">
                  {clienteHistorial.map(h => (
                    <div key={h.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div>
                        <p className="text-sm">{h.descripcion}</p>
                        <p className="text-xs text-slate-400">{new Date(h.fecha).toLocaleString('es-AR')}</p>
                      </div>
                      <span className={`font-semibold ${h.tipo === 'compra' ? 'text-emerald-600' : 'text-amber-600'}`}>{h.tipo === 'compra' ? '+' : ''}{h.puntos}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'inicio' && !clienteActual && (
          <div>
            <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Buscar cliente por DNI o nombre</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Ej: 40123456 o Juan"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-lg" autoFocus />
              </div>
              {searchTerm && filteredClientes.length === 0 && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-900 mb-3">No se encontró ningún cliente. ¿Querés registrarlo?</p>
                  <button onClick={() => setShowRegister(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2"><UserPlus size={16} /> Registrar nuevo cliente</button>
                </div>
              )}
              {searchTerm && filteredClientes.length > 0 && (
                <div className="mt-4 space-y-2">
                  {filteredClientes.slice(0, 10).map(c => (
                    <button key={c.dni} onClick={() => { setSelectedDni(c.dni); setSearchTerm(''); }}
                      className="w-full bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center">
                      <div className="text-left"><p className="font-semibold">{c.nombre}</p><p className="text-xs text-slate-500">DNI {c.dni}</p></div>
                      <div className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-lg text-sm">{c.saldo} pts</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setShowRegister(true)} className="w-full bg-white hover:bg-slate-50 border-2 border-dashed border-slate-300 text-slate-600 font-semibold py-4 rounded-2xl flex items-center justify-center gap-2">
              <UserPlus size={20} /> Registrar nuevo cliente
            </button>
          </div>
        )}

        {view === 'clientes' && !clienteActual && (
          <div>
            <div className="bg-white rounded-2xl shadow-md p-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-500" />
              </div>
            </div>
            {filteredClientes.length === 0 ? <p className="text-center text-slate-400 py-8">No hay clientes registrados</p> : (
              <div className="space-y-2">
                {filteredClientes.sort((a, b) => b.saldo - a.saldo).map(c => (
                  <button key={c.dni} onClick={() => setSelectedDni(c.dni)} className="w-full bg-white hover:shadow-md rounded-xl p-4 flex justify-between items-center shadow-sm">
                    <div className="text-left"><p className="font-semibold">{c.nombre}</p><p className="text-xs text-slate-500">DNI {c.dni}</p></div>
                    <div className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-lg">{c.saldo} pts</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'premios' && (
          <div>
            <AddPrizeForm onAdd={addPrize} />
            {premios.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center mt-4">
                <Gift className="mx-auto mb-2 text-amber-600" size={32} />
                <p className="text-amber-900 font-medium">Aún no cargaste premios</p>
              </div>
            ) : (
              <div className="space-y-2 mt-4">
                {premios.map(p => (
                  <div key={p.id} className="bg-white rounded-xl p-4 flex justify-between items-center shadow-sm">
                    <div><p className="font-semibold">{p.nombre}</p><p className="text-sm text-indigo-600 font-bold">{p.puntos} pts</p></div>
                    <button onClick={() => deletePrize(p.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'config' && <ConfigPanel clientes={clientes} onLogout={onLogout} onReload={cargarDatos} />}
      </main>

      {showRegister && (
        <RegisterModal initialDni={/^\d+$/.test(searchTerm) ? searchTerm : ''} onClose={() => setShowRegister(false)}
          onRegister={async (c) => { if (await registerClient(c)) { setShowRegister(false); setSearchTerm(''); setSelectedDni(c.dni); } }} />
      )}
      {showAddPurchase && clienteActual && (
        <AddPurchaseModal cliente={clienteActual} onClose={() => setShowAddPurchase(false)}
          onAdd={async (monto) => { await addPurchase(clienteActual.dni, monto); setShowAddPurchase(false); }} />
      )}
      {showRedeem && clienteActual && (
        <RedeemModal cliente={clienteActual} saldo={clienteActual.saldo} premios={premios} onClose={() => setShowRedeem(false)}
          onRedeem={async (premio) => { await redeemPrize(clienteActual.dni, premio); setShowRedeem(false); }} />
      )}

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl shadow-lg text-white font-medium flex items-center gap-2 z-50 ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
          {toast.type === 'error' ? <X size={18} /> : <Check size={18} />}{toast.msg}
        </div>
      )}
    </div>
  );
}

function RegisterModal({ onClose, onRegister, initialDni = '' }) {
  const [dni, setDni] = useState(initialDni);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const submit = () => {
    if (!dni.trim() || !nombre.trim()) { alert('DNI y nombre son obligatorios'); return; }
    onRegister({ dni: dni.trim(), nombre: nombre.trim(), telefono: telefono.trim() });
  };
  return (
    <Modal onClose={onClose} title="Nuevo cliente">
      <div className="space-y-3">
        <Field label="DNI *" value={dni} onChange={setDni} type="number" autoFocus={!initialDni} />
        <Field label="Nombre y apellido *" value={nombre} onChange={setNombre} autoFocus={!!initialDni} />
        <Field label="Teléfono (opcional)" value={telefono} onChange={setTelefono} type="tel" />
        <button onClick={submit} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl mt-2">Registrar</button>
      </div>
    </Modal>
  );
}

function AddPurchaseModal({ cliente, onClose, onAdd }) {
  const [monto, setMonto] = useState('');
  const m = parseFloat(monto) || 0;
  const puntos = Math.floor(m / PESOS_POR_PUNTO);
  return (
    <Modal onClose={onClose} title={`Sumar compra · ${cliente.nombre}`}>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Monto de la compra ($)</label>
          <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 text-2xl font-bold" placeholder="0" autoFocus />
        </div>
        {m > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <p className="text-sm text-emerald-700">Va a sumar</p>
            <p className="text-3xl font-bold text-emerald-700">+{puntos} pts</p>
          </div>
        )}
        <button onClick={() => m > 0 && onAdd(m)} disabled={m <= 0}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl">Confirmar</button>
      </div>
    </Modal>
  );
}

function RedeemModal({ cliente, saldo, premios, onClose, onRedeem }) {
  return (
    <Modal onClose={onClose} title={`Canjear · Saldo: ${saldo} pts`}>
      {premios.length === 0 ? <p className="text-slate-500 text-center py-4">Cargá premios en la pestaña Premios</p> : (
        <div className="space-y-2">
          {premios.map(p => {
            const puede = saldo >= p.puntos;
            return (
              <button key={p.id} onClick={() => puede && onRedeem(p)} disabled={!puede}
                className={`w-full p-4 rounded-xl flex justify-between items-center border-2 ${puede ? 'border-amber-300 bg-amber-50 hover:bg-amber-100' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                <span className="font-medium text-left">{p.nombre}</span>
                <span className={`font-bold px-3 py-1 rounded-lg ${puede ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-600'}`}>{p.puntos} pts</span>
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

function AddPrizeForm({ onAdd }) {
  const [nombre, setNombre] = useState('');
  const [puntos, setPuntos] = useState('');
  const submit = () => {
    if (!nombre.trim() || !puntos || parseInt(puntos) <= 0) return;
    onAdd(nombre.trim(), puntos); setNombre(''); setPuntos('');
  };
  return (
    <div className="bg-white rounded-2xl shadow-md p-4">
      <h3 className="font-bold mb-3">Agregar premio</h3>
      <div className="space-y-2">
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: 10 fotocopias gratis"
          className="w-full px-4 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-500" />
        <div className="flex gap-2">
          <input type="number" value={puntos} onChange={(e) => setPuntos(e.target.value)} placeholder="Puntos"
            className="flex-1 px-4 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-500" />
          <button onClick={submit} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-xl flex items-center gap-1"><Plus size={16} /> Agregar</button>
        </div>
      </div>
    </div>
  );
}

function ConfigPanel({ clientes, onLogout, onReload }) {
  const exportar = () => {
    const csv = [
      ['DNI', 'Nombre', 'Telefono', 'Saldo'].join(','),
      ...clientes.map(c => [c.dni, c.nombre, c.telefono || '', c.saldo].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="font-bold mb-2">Información</h3>
        <p className="text-sm text-slate-600">Sistema conectado a base de datos en la nube. Los datos se sincronizan entre todos tus dispositivos.</p>
        <p className="text-sm text-slate-600 mt-2">Regla actual: <strong>${PESOS_POR_PUNTO} = 1 punto</strong></p>
      </div>
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="font-bold mb-2">Respaldo de datos</h3>
        <p className="text-sm text-slate-600 mb-3">Descargá un CSV con todos tus clientes y saldos.</p>
        <button onClick={exportar} className="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold py-2 rounded-xl">Exportar clientes a CSV</button>
      </div>
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="font-bold mb-2">Recargar datos</h3>
        <p className="text-sm text-slate-600 mb-3">Si abriste el admin en otro dispositivo y cargaste cosas, tocá acá para actualizar.</p>
        <button onClick={onReload} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl">Recargar</button>
      </div>
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="font-bold mb-2">Sesión</h3>
        <button onClick={onLogout} className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-xl flex items-center justify-center gap-2">
          <LogOut size={18} /> Cerrar sesión admin
        </button>
      </div>
    </div>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-40 p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
          <h2 className="font-bold text-lg">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X size={20} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', autoFocus = false }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} autoFocus={autoFocus}
        className="w-full px-4 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
    </div>
  );
}
