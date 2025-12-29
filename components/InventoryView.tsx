import React, { useState, useEffect } from 'react';
import { FinanceService } from '../services/FinanceService';
import { Ingredient } from '../types';
import { Plus, AlertTriangle, Loader2 } from 'lucide-react';

export function InventoryView() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadIngredients();
    }, []);

    const loadIngredients = async () => {
        setIsLoading(true);
        try {
            const data = await FinanceService.getIngredients();
            setIngredients(data);
        } catch (error) {
            console.error('Error loading ingredients:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Inventario de Insumos</h3>
                <button className="flex items-center gap-2 bg-[#19A8C7] hover:bg-[#1592ad] text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-[#19A8C7]/20">
                    <Plus size={20} />
                    <span>Nuevo Insumo</span>
                </button>
            </div>

            <div className="bg-[#151E2B] rounded-2xl border border-[#1E293B] overflow-hidden shadow-xl">
                {isLoading && ingredients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 text-[#19A8C7] animate-spin" />
                        <p className="text-[#a0a0b0]">Cargando inventario...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#1E293B] text-[#a0a0b0] text-[10px] uppercase tracking-wider bg-[#0B131F]">
                                    <th className="p-4 font-bold">Nombre</th>
                                    <th className="p-4 font-bold">Costo Unitario</th>
                                    <th className="p-4 font-bold">Stock Actual</th>
                                    <th className="p-4 font-bold">Estado</th>
                                    <th className="p-4 font-bold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1E293B]">
                                {ingredients.map(item => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors text-sm text-[#e0e0e0]">
                                        <td className="p-4 font-medium text-white">{item.name}</td>
                                        <td className="p-4 font-mono">${item.cost.toFixed(2)} / {item.unit}</td>
                                        <td className="p-4 font-mono text-[#a0a0b0]">{item.currentStock} {item.unit}</td>
                                        <td className="p-4">
                                            {item.currentStock <= item.minStock ? (
                                                <span className="inline-flex items-center gap-1 text-[#FF8A00] bg-[#FF8A00]/10 px-2.5 py-1 rounded-lg text-xs font-bold animate-pulse">
                                                    <AlertTriangle size={12} /> Bajo Stock
                                                </span>
                                            ) : (
                                                <span className="text-[#19A8C7] bg-[#19A8C7]/10 px-2.5 py-1 rounded-lg text-xs font-bold">
                                                    Optimizado
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="text-[#19A8C7] hover:text-white font-bold text-xs hover:underline transition-all">Editar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {ingredients.length === 0 && !isLoading && (
                    <div className="p-12 text-center text-gray-500 bg-[#0B131F]">No hay insumos registrados.</div>
                )}
            </div>
        </div>
    );
}
