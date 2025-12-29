import React, { useState, useEffect } from 'react';
import { FinanceService } from '../services/FinanceService';
import { Supplier } from '../types';
import { Plus, Trash2, Phone, Mail, User, Pencil, X, AlertTriangle, Loader2 } from 'lucide-react';

export function SuppliersView() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newSupplier, setNewSupplier] = useState({ name: '', contact: '', category: '', phone: '', email: '' });
    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });

    useEffect(() => {
        loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
        setIsLoading(true);
        try {
            const data = await FinanceService.getSuppliers();
            setSuppliers(data);
        } catch (error) {
            console.error('Error loading suppliers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingId(supplier.id);
        setNewSupplier({
            name: supplier.name,
            contact: supplier.contact,
            category: supplier.category,
            phone: supplier.phone || '',
            email: supplier.email || ''
        });
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setNewSupplier({ name: '', contact: '', category: '', phone: '', email: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (editingId) {
                await FinanceService.updateSupplier({ ...newSupplier, id: editingId });
            } else {
                await FinanceService.addSupplier(newSupplier);
            }
            handleCancel();
            await loadSuppliers();
        } catch (error) {
            console.error('Error saving supplier:', error);
            setIsLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        setConfirmDialog({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        if (confirmDialog.id) {
            setIsLoading(true);
            try {
                await FinanceService.deleteSupplier(confirmDialog.id);
                setConfirmDialog({ isOpen: false, id: null });
                await loadSuppliers();
            } catch (error) {
                console.error('Error deleting supplier:', error);
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Directorio de Proveedores</h3>
                <button
                    onClick={() => {
                        if (showForm) handleCancel();
                        else setShowForm(true);
                    }}
                    className={`flex items-center gap-2 ${showForm ? 'bg-[#1E293B]' : 'bg-[#19A8C7] shadow-[#19A8C7]/20'} hover:opacity-90 text-white px-4 py-2 rounded-xl transition-colors shadow-lg`}
                >
                    {showForm ? <X size={20} /> : <Plus size={20} />}
                    <span>{showForm ? 'Cancelar' : 'Nuevo Proveedor'}</span>
                </button>
            </div>

            {showForm && (
                <div className="bg-[#151E2B] p-6 rounded-2xl border border-[#1E293B] animate-fade-in shadow-xl">
                    <h4 className="text-white font-bold mb-4">{editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h4>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            placeholder="Nombre Empresa *"
                            required
                            className="bg-[#0B131F] text-white p-3 rounded-xl border border-[#1E293B] focus:border-[#19A8C7] outline-none"
                            value={newSupplier.name}
                            onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
                        />
                        <input
                            placeholder="Categoría (e.g. Carnes, Bebidas)"
                            required
                            className="bg-[#0B131F] text-white p-3 rounded-xl border border-[#1E293B] focus:border-[#19A8C7] outline-none"
                            value={newSupplier.category}
                            onChange={e => setNewSupplier({ ...newSupplier, category: e.target.value })}
                        />
                        <input
                            placeholder="Contacto Directo"
                            className="bg-[#0B131F] text-white p-3 rounded-xl border border-[#1E293B] focus:border-[#19A8C7] outline-none"
                            value={newSupplier.contact}
                            onChange={e => setNewSupplier({ ...newSupplier, contact: e.target.value })}
                        />
                        <input
                            placeholder="Teléfono"
                            className="bg-[#0B131F] text-white p-3 rounded-xl border border-[#1E293B] focus:border-[#19A8C7] outline-none"
                            value={newSupplier.phone}
                            onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                        />
                        <input
                            placeholder="Email"
                            className="bg-[#0B131F] text-white p-3 rounded-xl border border-[#1E293B] focus:border-[#19A8C7] outline-none md:col-span-2"
                            value={newSupplier.email}
                            onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })}
                        />
                        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                            <button type="button" onClick={handleCancel} className="text-[#a0a0b0] hover:text-white px-4 py-2">Cancelar</button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-[#19A8C7] text-white px-6 py-2 rounded-xl transition-transform hover:scale-105 font-bold shadow-lg shadow-[#19A8C7]/20 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isLoading && <Loader2 className="animate-spin" size={18} />}
                                {editingId ? 'Actualizar' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {isLoading && suppliers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-[#19A8C7] animate-spin" />
                    <p className="text-[#a0a0b0]">Cargando proveedores...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suppliers.map(supplier => (
                        <div key={supplier.id} className="bg-[#151E2B] p-5 rounded-2xl border border-[#1E293B] hover:border-[#19A8C7]/50 transition-all duration-300 group relative hover:shadow-lg hover:shadow-[#19A8C7]/10 hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-[10px] uppercase tracking-wider text-[#19A8C7] font-bold bg-[#19A8C7]/10 px-2 py-1 rounded-md mb-2 inline-block">
                                        {supplier.category}
                                    </span>
                                    <h4 className="text-lg font-bold text-white group-hover:text-[#19A8C7] transition-colors">{supplier.name}</h4>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(supplier)} className="text-[#a0a0b0] hover:text-[#19A8C7] p-2 transition-colors">
                                        <Pencil size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(supplier.id)} className="text-[#a0a0b0] hover:text-red-500 p-2 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                    <User size={16} className="text-[#19A8C7]/50" />
                                    <span>{supplier.contact}</span>
                                </div>
                                {supplier.phone && (
                                    <div className="flex items-center gap-3 text-sm text-gray-400">
                                        <Phone size={16} className="text-[#19A8C7]/50" />
                                        <span>{supplier.phone}</span>
                                    </div>
                                )}
                                {supplier.email && (
                                    <div className="flex items-center gap-3 text-sm text-gray-400">
                                        <Mail size={16} className="text-[#19A8C7]/50" />
                                        <span className="truncate">{supplier.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {suppliers.length === 0 && !isLoading && (
                        <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed border-[#1E293B] rounded-2xl bg-[#0B131F]">
                            No hay proveedores registrados.
                        </div>
                    )}
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmDialog.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#151E2B] border border-[#1E293B] rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 animate-scale-in">
                        <div className="flex items-center gap-4 mb-4 text-red-500">
                            <div className="bg-red-500/10 p-3 rounded-2xl">
                                <AlertTriangle size={24} />
                            </div>
                            <h4 className="text-xl font-bold text-white">Eliminar Proveedor</h4>
                        </div>
                        <p className="text-[#a0a0b0] mb-8">¿Estás seguro de que quieres eliminar este proveedor? Esta acción no se puede deshacer.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDialog({ isOpen: false, id: null })}
                                className="flex-1 py-3 bg-[#0B131F] hover:bg-[#1E293B] text-white font-bold rounded-xl transition-colors border border-[#1E293B]"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
