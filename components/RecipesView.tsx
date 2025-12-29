import React, { useState, useEffect, useMemo } from 'react';
import { Recipe, Ingredient, RecipeIngredient } from '../types';
import { FinanceService } from '../services/FinanceService';
import { Plus, Trash2, Save, ChefHat, DollarSign, Calculator, ChevronLeft, AlertTriangle, Loader2 } from 'lucide-react';

export function RecipesView() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewState, setViewState] = useState<'list' | 'form'>('list');

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [sellingPrice, setSellingPrice] = useState('');
    const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [recipesData, ingredientsData] = await Promise.all([
                FinanceService.getRecipes(),
                FinanceService.getIngredients()
            ]);
            setRecipes(recipesData);
            setIngredients(ingredientsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditingId(null);
        setName('');
        setCategory('Alimentos');
        setSellingPrice('');
        setRecipeIngredients([]);
        setViewState('form');
    };

    const handleEdit = (recipe: Recipe) => {
        setEditingId(recipe.id);
        setName(recipe.name);
        setCategory(recipe.category);
        setSellingPrice(recipe.sellingPrice.toString());
        setRecipeIngredients(recipe.ingredients);
        setViewState('form');
    };

    const handleDelete = (id: string) => {
        setConfirmDialog({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        if (confirmDialog.id) {
            setIsLoading(true);
            try {
                await FinanceService.deleteRecipe(confirmDialog.id);
                setConfirmDialog({ isOpen: false, id: null });
                await loadData();
            } catch (error) {
                console.error('Error deleting recipe:', error);
                setIsLoading(false);
            }
        }
    };

    // --- Logic for Ingredients in Form ---
    const addIngredientRow = () => {
        if (ingredients.length === 0) {
            alert("Primero debes registrar insumos en el Inventario.");
            return;
        }
        setRecipeIngredients([...recipeIngredients, { ingredientId: ingredients[0].id, amount: 0 }]);
    };

    const removeIngredientRow = (index: number) => {
        const newList = [...recipeIngredients];
        newList.splice(index, 1);
        setRecipeIngredients(newList);
    };

    const updateIngredientRow = (index: number, field: keyof RecipeIngredient, value: any) => {
        const newList = [...recipeIngredients];
        newList[index] = { ...newList[index], [field]: value };
        setRecipeIngredients(newList);
    };

    // --- Calculations ---
    const calculateTotalCost = (ings: RecipeIngredient[]) => {
        return ings.reduce((total, item) => {
            const ingredient = ingredients.find(i => i.id === item.ingredientId);
            if (!ingredient) return total;
            return total + (ingredient.cost * item.amount);
        }, 0);
    };

    const totalCost = useMemo(() => calculateTotalCost(recipeIngredients), [recipeIngredients, ingredients]);
    const price = parseFloat(sellingPrice) || 0;
    const margin = price > 0 ? ((price - totalCost) / price) * 100 : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (recipeIngredients.length === 0) {
            alert("Añade al menos un ingrediente");
            return;
        }

        setIsLoading(true);
        try {
            const recipeData = {
                name,
                category,
                sellingPrice: parseFloat(sellingPrice),
                ingredients: recipeIngredients
            };

            if (editingId) {
                await FinanceService.updateRecipe({ ...recipeData, id: editingId });
            } else {
                await FinanceService.addRecipe(recipeData);
            }

            await loadData();
            setViewState('list');
        } catch (error) {
            console.error('Error saving recipe:', error);
            setIsLoading(false);
        }
    };

    if (viewState === 'form') {
        return (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => setViewState('list')}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <ChevronLeft />
                    </button>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ChefHat className="text-[#19A8C7]" />
                        {editingId ? 'Editar Escandallo' : 'Nuevo Escandallo'}
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[#151E2B] p-6 rounded-3xl border border-[#1E293B] shadow-lg">
                            <h3 className="text-lg font-semibold text-white mb-4">Información Básica</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Nombre del Platillo</label>
                                    <input
                                        type="text"
                                        value={name} onChange={e => setName(e.target.value)}
                                        className="w-full bg-[#0B131F] border border-[#1E293B] rounded-xl p-3 text-white focus:ring-1 focus:ring-[#19A8C7] outline-none"
                                        placeholder="Ej. Tacos de Arrachera"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Categoría</label>
                                    <select
                                        value={category} onChange={e => setCategory(e.target.value)}
                                        className="w-full bg-[#0B131F] border border-[#1E293B] rounded-xl p-3 text-white focus:ring-1 focus:ring-[#19A8C7] outline-none"
                                    >
                                        <option value="Alimentos">Alimentos</option>
                                        <option value="Bebidas">Bebidas</option>
                                        <option value="Postres">Postres</option>
                                        <option value="Otros">Otros</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#151E2B] p-6 rounded-3xl border border-[#1E293B] shadow-lg">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-white">Ingredientes</h3>
                                <button
                                    type="button"
                                    onClick={addIngredientRow}
                                    className="text-sm bg-[#FF8A00]/10 text-[#FF8A00] px-3 py-1 rounded-lg hover:bg-[#FF8A00]/20 transition-colors font-medium flex items-center gap-1"
                                >
                                    <Plus size={14} /> Añadir Insumo
                                </button>
                            </div>

                            <div className="space-y-3">
                                {recipeIngredients.map((row, index) => {
                                    const selectedIng = ingredients.find(i => i.id === row.ingredientId);
                                    const rowCost = selectedIng ? selectedIng.cost * row.amount : 0;

                                    return (
                                        <div key={index} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-[#0B131F] p-3 rounded-xl border border-[#1E293B]">
                                            <div className="flex-1 w-full">
                                                <select
                                                    value={row.ingredientId}
                                                    onChange={(e) => updateIngredientRow(index, 'ingredientId', e.target.value)}
                                                    className="w-full bg-transparent text-white text-sm outline-none border-b border-[#1E293B] focus:border-[#19A8C7] py-1"
                                                >
                                                    {ingredients.map(ing => (
                                                        <option key={ing.id} value={ing.id}>{ing.name} (${ing.cost}/{ing.unit})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="w-full md:w-32 flex items-center gap-2">
                                                <input
                                                    type="number" step="0.001"
                                                    value={row.amount}
                                                    onChange={(e) => updateIngredientRow(index, 'amount', parseFloat(e.target.value))}
                                                    className="w-full bg-transparent text-white text-sm outline-none border-b border-[#1E293B] focus:border-[#19A8C7] py-1 text-right"
                                                    placeholder="Cant."
                                                />
                                                <span className="text-xs text-gray-500">{selectedIng?.unit}</span>
                                            </div>
                                            <div className="w-full md:w-24 text-right">
                                                <span className="text-gray-400 text-sm font-mono">${rowCost.toFixed(2)}</span>
                                            </div>
                                            <button onClick={() => removeIngredientRow(index)} className="text-red-400 p-1 hover:bg-white/5 rounded">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-[#151E2B] p-6 rounded-3xl border border-[#1E293B] shadow-lg sticky top-6 space-y-6">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Calculator size={20} className="text-[#10b981]" /> Costos y Precios
                            </h3>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Precio de Venta</label>
                                <div className="relative">
                                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="number"
                                        value={sellingPrice} onChange={e => setSellingPrice(e.target.value)}
                                        className="w-full bg-[#0B131F] border border-[#1E293B] rounded-xl pl-9 p-3 text-white focus:ring-1 focus:ring-[#10b981] outline-none text-lg font-bold"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-[#1E293B] pt-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Costo Total</span>
                                    <span className="text-white font-bold">${totalCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Margen (%)</span>
                                    <span className={`font-bold ${margin >= 30 ? 'text-[#10b981]' : margin > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {margin.toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="w-full bg-[#19A8C7] text-white font-bold py-3 rounded-xl hover:bg-[#107287] transition-all shadow-lg shadow-[#19A8C7]/20 flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Guardar Receta
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Recetas y Escandallos</h2>
                    <p className="text-gray-400 text-sm">Gestiona tus platillos y calcula costos exactos.</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="bg-[#19A8C7] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#107287] transition-all flex items-center gap-2 shadow-lg shadow-[#19A8C7]/20"
                >
                    <Plus size={20} /> Nueva Receta
                </button>
            </div>

            {isLoading && recipes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-[#19A8C7] animate-spin" />
                    <p className="text-[#a0a0b0]">Cargando recetas...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recipes.map(recipe => {
                        const calculatedCost = calculateTotalCost(recipe.ingredients);
                        const marginPercent = recipe.sellingPrice > 0
                            ? ((recipe.sellingPrice - calculatedCost) / recipe.sellingPrice) * 100
                            : 0;

                        return (
                            <div key={recipe.id} className="bg-[#151E2B] border border-[#1E293B] p-5 rounded-3xl hover:border-[#19A8C7]/50 transition-colors group relative">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="bg-[#0B131F] text-gray-400 text-xs px-2 py-1 rounded-md border border-[#1E293B] font-medium">
                                        {recipe.category}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(recipe.id)}
                                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-1">{recipe.name}</h3>
                                <p className="text-gray-500 text-xs mb-4">{recipe.ingredients.length} Ingredientes</p>

                                <div className="space-y-2 bg-[#0B131F] p-3 rounded-xl border border-[#1E293B]">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Precio Venta</span>
                                        <span className="text-[#10b981] font-bold">${recipe.sellingPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Costo Insumos</span>
                                        <span className="text-white font-bold">${calculatedCost.toFixed(2)}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[#1E293B] rounded-full overflow-hidden mt-1">
                                        <div
                                            className={`h-full rounded-full ${marginPercent >= 30 ? 'bg-[#10b981]' : 'bg-yellow-500'}`}
                                            style={{ width: `${Math.min(marginPercent, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-[10px] text-gray-500">Margen</span>
                                        <span className={`text-xs font-bold ${marginPercent >= 30 ? 'text-[#10b981]' : 'text-yellow-500'}`}>
                                            {marginPercent.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleEdit(recipe)}
                                    className="w-full mt-4 bg-white/5 text-white py-2 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
                                >
                                    Editar Detalles
                                </button>
                            </div>
                        );
                    })}
                    {recipes.length === 0 && !isLoading && (
                        <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed border-[#1E293B] rounded-2xl bg-[#0B131F]">
                            No hay recetas registradas.
                        </div>
                    )}
                </div>
            )}

            {confirmDialog.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#151E2B] border border-[#1E293B] rounded-3xl shadow-2xl w-full max-sm overflow-hidden p-6 animate-scale-in">
                        <div className="flex items-center gap-4 mb-4 text-red-500">
                            <div className="bg-red-500/10 p-3 rounded-2xl">
                                <AlertTriangle size={24} />
                            </div>
                            <h4 className="text-xl font-bold text-white">Eliminar Receta</h4>
                        </div>
                        <p className="text-gray-400 mb-8">¿Estás seguro de que quieres eliminar esta receta?</p>
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
