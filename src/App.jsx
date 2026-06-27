import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Plus, Gift, Users, Settings, Trash2, ArrowLeft, Check, X, Phone, History } from 'lucide-react';

const STORAGE_KEY = 'libreria_fidelizacion_v1';

const initialState = {
  config: { pesosPorPunto: 100, nombreNegocio: 'Mi Librería' },
  clientes: [],
  premios: []
};

export default function App() {
  const [data, setData] = useState(initialState);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState('inicio');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDni, setSelectedDni] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch (e) {}
    setLoaded(true);
  }, []);

  const save = (newData) => {
    setData(newData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (e) {
      showToast('Error al guardar', 'error');
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const registerClient = (cliente) => {
    if (data.clientes.find(c => c.dni === cliente.dni)) {
      showToast('Ya existe un cliente con ese DNI', 'error');
      return false;
    }
    const nuevo = {
      ...cliente,
      puntosAcumulados: 0,
      puntosCanjeados: 0,
      fechaAlta: new Date().toISOString(),
      historial: []
    };
    save({ ...data, clientes: [...data.clientes, nuevo] });
    showToast(`Cliente ${cliente.nombre} registrado`);
    return true;
  };

  const addPurchase = (dni, monto) => {
    const puntos = Math.floor(monto / data.config.pesosPorPunto);
    const clientes = data.clientes.map(c => {
      if (c.dni === dni) {
        return {
          ...c,
          puntosAcumulados: c.puntosAcumulados + puntos,
          historial: [
            { fecha: new Date().toISOString(), tipo: 'compra', monto, puntos, descripcion: `Compra $${monto.toLocaleString('es-AR')} → +${puntos} pts` },
            ...c.historial
          ]
        };
      }
      return c;
    });
    save({ ...data, clientes });
    showToast(`+${puntos} puntos sumados`);
  };

  const redeemPrize = (dni, premio) => {
    const cliente = data.clientes.find(c => c.dni === dni);
    const saldo = cliente.puntosAcumulados - cliente.puntosCanjeados;
    if (saldo < premio.puntos) { showToast('Puntos insuficientes', 'error'); return; }
    const clientes = data.clientes.map(c => {
      if (c.dni === dni) {
        return {
          ...c,
          puntosCanjeados: c.puntosCanjeados + premio.puntos,
          historial: [
            { fecha: new Date().toISOString(), tipo: 'canje', puntos: -premio.puntos, descripcion: `Canje: ${premio.nombre} (-${premio.puntos} pts)` },
            ...c.historial
          ]
        };
      }
      return c;
    });
    save({ ...data, clientes });
    showToast(`Canje realizado: ${premio.nombre}`);
  };

  const deleteClient = (dni) => {
    if (!confirm('¿Eliminar este cliente y todo su historial?')) return;
    save({ ...data, clientes: data.clientes.filter(c => c.dni !== dni) });
    setSelectedDni(null);
    setView('clientes');
    showToast('Cliente eliminado');
  };

  const addPrize = (nombre, puntos) => {
    const nuevo = { id: Date.now().toString(), nombre, puntos: parseInt(puntos) };
    save({ ...data, premios: [...data.premios, nuevo].sort((a, b) => a.puntos - b.puntos) });
    showToast('Premio agregado');
  };

  const deletePrize = (id) => save({ ...data, premios: data.premios.filter(p => p.id !== id) });

  const updateConfig = (newConfig) => {
    save({ ...data, config: { ...data.config, ...newConfig } });
    showToast('Configuración actualizada');
  };

  const saldoCliente = (c) => c.puntosAcumulados - c.puntosCanjeados;

  const filteredClientes = searchTerm.trim()
    ? data.clientes.filter(c => {
        const term = searchTerm.toLowerCase();
        return c.dni.includes(term) || c.nombre.toLowerCase().includes(term);
      })
    : data.clientes;

  const clienteActual = selectedDni ? data.clientes.find(c => c.dni === selectedDni) : null;

  if (!loaded) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-500">Cargando...</div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">📚 {data.config.nombreNegocio}</h1>
          <p className="text-indigo-100 text-sm">Programa de puntos · {data.clientes.length} clientes</p>
        </div>
      </header>

      <nav className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex">
          {[
            { id: 'inicio', label: 'Inicio', icon: Search },
            { id: 'clientes', label: 'Clientes', icon: Users },
            { id: 'premios', label: 'Premios', icon: Gift },
            { id: 'config', label: 'Config', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setView(id); setSelectedDni(null); }}
              className={`flex-1 py-3 px-2 text-sm font-medium flex flex-col items-center gap-1 transition-colors ${view === id ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
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
                <p className="text-4xl font-bold">{saldoCliente(clienteActual)} <span className="text-lg font-normal">pts</span></p>
                <div className="flex gap-4 mt-3 text-sm text-indigo-100">
                  <span>Acumulados: {clienteActual.puntosAcumulados}</span>
                  <span>Canjeados: {clienteActual.puntosCanjeados}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowAddPurchase(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"><Plus size={18} /> Sumar compra</button>
                <button onClick={() => setShowRedeem(true)} className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"><Gift size={18} /> Canjear</button>
              </div>
            </div>

            {data.premios.length > 0 && (() => {
              const saldo = saldoCliente(clienteActual);
              const proximo = data.premios.find(p => p.puntos > saldo);
              if (!proximo) return null;
              return (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-amber-900">🎯 Le faltan <strong>{proximo.puntos - saldo} pts</strong> para: <strong>{proximo.nombre}</strong></p>
                </div>
              );
            })()}

            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="font-bold mb-3 flex items-center gap-2"><History size={18} /> Historial</h3>
              {clienteActual.historial.length === 0 ? <p className="text-slate-400 text-sm">Sin movimientos aún</p> : (
                <div className="space-y-2">
                  {clienteActual.historial.map((h, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b last:border-b-0">
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
                      className="w-full bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center transition-colors">
                      <div className="text-left"><p className="font-semibold">{c.nombre}</p><p className="text-xs text-slate-500">DNI {c.dni}</p></div>
                      <div className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-lg text-sm">{saldoCliente(c)} pts</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setShowRegister(true)} className="w-full bg-white hover:bg-slate-50 border-2 border-dashed border-slate-300 text-slate-600 font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors">
              <UserPlus size={20} /> Registrar nuevo cliente
            </button>
            {data.clientes.length === 0 && (
              <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-2xl p-6 text-center">
                <p className="text-indigo-900 font-medium mb-1">¡Bienvenido!</p>
                <p className="text-indigo-700 text-sm">Empezá registrando tu primer cliente y, en Premios, cargá lo que vas a ofrecer.</p>
              </div>
            )}
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
                {filteredClientes.sort((a, b) => saldoCliente(b) - saldoCliente(a)).map(c => (
                  <button key={c.dni} onClick={() => setSelectedDni(c.dni)} className="w-full bg-white hover:shadow-md rounded-xl p-4 flex justify-between items-center shadow-sm transition-shadow">
                    <div className="text-left"><p className="font-semibold">{c.nombre}</p><p className="text-xs text-slate-500">DNI {c.dni}</p></div>
                    <div className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-lg">{saldoCliente(c)} pts</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'premios' && (
          <div>
            <AddPrizeForm onAdd={addPrize} />
            {data.premios.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center mt-4">
                <Gift className="mx-auto mb-2 text-amber-600" size={32} />
                <p className="text-amber-900 font-medium">Aún no cargaste premios</p>
                <p className="text-amber-700 text-sm mt-1">Cargá los premios que tus clientes podrán canjear con sus puntos.</p>
              </div>
            ) : (
              <div className="space-y-2 mt-4">
                {data.premios.map(p => (
                  <div key={p.id} className="bg-white rounded-xl p-4 flex justify-between items-center shadow-sm">
                    <div><p className="font-semibold">{p.nombre}</p><p className="text-sm text-indigo-600 font-bold">{p.puntos} pts</p></div>
                    <button onClick={() => deletePrize(p.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'config' && <ConfigPanel config={data.config} onUpdate={updateConfig} clientes={data.clientes} />}
      </main>

      {showRegister && (
        <RegisterModal initialDni={/^\d+$/.test(searchTerm) ? searchTerm : ''} onClose={() => setShowRegister(false)}
          onRegister={(c) => { if (registerClient(c)) { setShowRegister(false); setSearchTerm(''); setSelectedDni(c.dni); } }} />
      )}
      {showAddPurchase && clienteActual && (
        <AddPurchaseModal cliente={clienteActual} pesosPorPunto={data.config.pesosPorPunto} onClose={() => setShowAddPurchase(false)}
          onAdd={(monto) => { addPurchase(clienteActual.dni, monto); setShowAddPurchase(false); }} />
      )}
      {showRedeem && clienteActual && (
        <RedeemModal cliente={clienteActual} saldo={saldoCliente(clienteActual)} premios={data.premios} onClose={() => setShowRedeem(false)}
          onRedeem={(premio) => { redeemPrize(clienteActual.dni, premio); setShowRedeem(false); }} />
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

function AddPurchaseModal({ cliente, pesosPorPunto, onClose, onAdd }) {
  const [monto, setMonto] = useState('');
  const m = parseFloat(monto) || 0;
  const puntos = Math.floor(m / pesosPorPunto);
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
                className={`w-full p-4 rounded-xl flex justify-between items-center border-2 transition-colors ${puede ? 'border-amber-300 bg-amber-50 hover:bg-amber-100 cursor-pointer' : 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'}`}>
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

function ConfigPanel({ config, onUpdate, clientes }) {
  const [pesosPorPunto, setPesosPorPunto] = useState(config.pesosPorPunto);
  const [nombreNegocio, setNombreNegocio] = useState(config.nombreNegocio);

  const exportar = () => {
    const csv = [
      ['DNI', 'Nombre', 'Telefono', 'Acumulados', 'Canjeados', 'Saldo'].join(','),
      ...clientes.map(c => [c.dni, c.nombre, c.telefono || '', c.puntosAcumulados, c.puntosCanjeados, c.puntosAcumulados - c.puntosCanjeados].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="font-bold mb-4">Configuración</h3>
        <div className="space-y-3">
          <Field label="Nombre del negocio" value={nombreNegocio} onChange={setNombreNegocio} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pesos por punto</label>
            <input type="number" value={pesosPorPunto} onChange={(e) => setPesosPorPunto(parseInt(e.target.value) || 100)}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-500" />
            <p className="text-xs text-slate-500 mt-1">Actual: ${pesosPorPunto.toLocaleString('es-AR')} = 1 punto</p>
          </div>
          <button onClick={() => onUpdate({ pesosPorPunto: parseInt(pesosPorPunto), nombreNegocio })}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl">Guardar cambios</button>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="font-bold mb-2">Respaldo de datos</h3>
        <p className="text-sm text-slate-600 mb-3">Descargá un CSV con todos tus clientes y saldos. Hacelo cada tanto.</p>
        <button onClick={exportar} className="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold py-2 rounded-xl">Exportar clientes a CSV</button>
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
