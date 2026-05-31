import { useState, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { z } from 'zod'
import { PlusCircle, CheckCircle2, ArrowLeftRight, TrendingUp, TrendingDown } from 'lucide-react'
import { useCreateTransaction }   from '@/hooks/queries/useTransactions'
import { useAccounts }            from '@/hooks/queries/useAccounts'
import { useCategories }          from '@/hooks/queries/useCategories'
import { todayLocal, nowISO }     from '@/utils/dates'
import { Card }   from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input }  from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

// ── Zod schema ────────────────────────────────────────────────────────────────

const schema = z.object({
  date:        z.string().min(1, 'Selecciona una fecha'),
  type:        z.enum(['Ingreso', 'Egreso', 'Transferencia']),
  accountId:   z.string().min(1, 'Selecciona una cuenta'),
  toAccountId: z.string().optional(),
  category:    z.string().min(1, 'Selecciona una categoría'),
  subcategory: z.string().default(''),
  amount:      z.coerce.number({ invalid_type_error: 'Monto inválido' }).positive('Debe ser mayor a 0'),
  description: z.string().optional(),
  client:      z.string().optional(),
}).refine(
  d => d.type !== 'Transferencia' || (d.toAccountId && d.toAccountId.length > 0),
  { message: 'Selecciona una cuenta destino', path: ['toAccountId'] },
)

type FormValues = z.infer<typeof schema>

// Resolver inline — evita el problema de compatibilidad de @hookform/resolvers con zod v4
const zodResolver: Resolver<FormValues> = async (data) => {
  const result = schema.safeParse(data)
  if (result.success) return { values: result.data, errors: {} }
  const errors = Object.fromEntries(
    result.error.issues.map(issue => [
      issue.path.join('.') || '_root',
      { type: String(issue.code), message: issue.message },
    ]),
  )
  return { values: {}, errors }
}

// ── Componente ────────────────────────────────────────────────────────────────

export function TransactionView() {
  const { data: accounts   = [] } = useAccounts()
  const { data: categories = [] } = useCategories()
  const createTx = useCreateTransaction()
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver,
    defaultValues: {
      date:        todayLocal(),
      type:        'Egreso',
      accountId:   '',
      toAccountId: '',
      category:    '',
      subcategory: '',
      amount:      0,
      description: '',
      client:      '',
    },
  })

  const txType      = watch('type')
  const categoryName = watch('category')

  // Cuentas disponibles según tipo (no mostrar cuenta crédito en origen para transferencias normales)
  const accountOptions = useMemo(
    () => accounts.map(a => ({ value: a.id, label: `${a.name} (${a.type})` })),
    [accounts],
  )

  // Cuenta destino para transferencias (todas menos la cuenta origen)
  const originId = watch('accountId')
  const toAccountOptions = useMemo(
    () => accounts
      .filter(a => a.id !== originId)
      .map(a => ({ value: a.id, label: `${a.name} (${a.type})` })),
    [accounts, originId],
  )

  // Subcategorías dinámicas según categoría seleccionada
  const subcatOptions = useMemo(() => {
    const cat = categories.find(c => c.name === categoryName)
    return (cat?.subcategories ?? []).map(s => ({ value: s, label: s }))
  }, [categories, categoryName])

  // Categorías filtradas por el tipo de transacción seleccionado.
  // Si la categoría no tiene tipo asignado la mostramos siempre.
  const categoryOptions = useMemo(() => {
    return categories
      .filter(c => !c.type || c.type === txType)
      .map(c => ({ value: c.name, label: c.name }))
  }, [categories, txType])

  const onSubmit = async (data: FormValues) => {
    await createTx.mutateAsync({
      date:          new Date(data.date + 'T12:00:00').toISOString(),
      type:          data.type,
      category:      data.category,
      subcategory:   data.subcategory,
      amount:        data.amount,
      accountId:     data.accountId,
      toAccountId:   data.type === 'Transferencia' ? data.toAccountId : undefined,
      description:   data.description || undefined,
      client:        data.client || undefined,
      hasAttachment: false,
    })
    setSaved(true)
  }

  const handleNuevo = () => {
    reset({
      date:        todayLocal(),
      type:        'Egreso',
      accountId:   '',
      toAccountId: '',
      category:    '',
      subcategory: '',
      amount:      0,
      description: '',
      client:      '',
    })
    setSaved(false)
  }

  // ── Éxito ──────────────────────────────────────────────────────────────────
  if (saved) {
    return (
      <div className="space-y-6 pb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Nueva Transacción</h2>
          <p className="text-[#9ca3af] text-sm mt-0.5">Registro manual de movimientos</p>
        </div>
        <Card className="p-10 flex flex-col items-center gap-5 text-center">
          <div className="p-4 bg-positive/10 rounded-2xl">
            <CheckCircle2 size={40} className="text-positive" />
          </div>
          <div>
            <p className="text-white text-xl font-extrabold">¡Transacción guardada!</p>
            <p className="text-[#9ca3af] text-sm mt-1">El movimiento fue registrado correctamente</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleNuevo}>
              <PlusCircle size={15} /> Agregar otra
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // ── Formulario ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white">Nueva Transacción</h2>
        <p className="text-[#9ca3af] text-sm mt-0.5">Registro manual de movimientos</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card className="p-6 space-y-6">

          {/* Tipo de transacción */}
          <div>
            <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-3 px-1">
              Tipo de movimiento
            </p>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div className="flex gap-2 flex-wrap">
                  {(['Ingreso', 'Egreso', 'Transferencia'] as const).map(t => {
                    const active = field.value === t
                    const styles: Record<string, string> = {
                      Ingreso:       active ? 'bg-positive/20 border-positive text-positive' : 'border-[#2A2F42] text-[#9ca3af] hover:border-positive/50',
                      Egreso:        active ? 'bg-orange-red/20 border-orange-red text-orange-red' : 'border-[#2A2F42] text-[#9ca3af] hover:border-orange-red/50',
                      Transferencia: active ? 'bg-teal/20 border-teal text-teal' : 'border-[#2A2F42] text-[#9ca3af] hover:border-teal/50',
                    }
                    const icons: Record<string, React.ReactNode> = {
                      Ingreso:       <TrendingUp    size={14} />,
                      Egreso:        <TrendingDown  size={14} />,
                      Transferencia: <ArrowLeftRight size={14} />,
                    }
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          field.onChange(t)
                          setValue('toAccountId', '')
                          setValue('category', '')
                          setValue('subcategory', '')
                        }}
                        className={`
                          flex items-center gap-2 px-4 py-2.5 rounded-xl border
                          text-sm font-semibold transition-all
                          ${styles[t]}
                        `}
                      >
                        {icons[t]} {t}
                      </button>
                    )
                  })}
                </div>
              )}
            />
          </div>

          {/* Fecha + Monto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Fecha"
              type="date"
              {...register('date')}
              error={errors.date?.message}
            />
            <Input
              label="Monto ($)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              {...register('amount')}
              error={errors.amount?.message}
            />
          </div>

          {/* Cuentas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="accountId"
              control={control}
              render={({ field }) => (
                <Select
                  label={txType === 'Transferencia' ? 'Cuenta origen' : 'Cuenta'}
                  placeholder="Selecciona cuenta…"
                  options={accountOptions}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.accountId?.message}
                />
              )}
            />
            {txType === 'Transferencia' && (
              <Controller
                name="toAccountId"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Cuenta destino"
                    placeholder="Selecciona cuenta destino…"
                    options={toAccountOptions}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={errors.toAccountId?.message}
                  />
                )}
              />
            )}
          </div>

          {/* Categoría + Subcategoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select
                  label="Categoría"
                  placeholder="Selecciona categoría…"
                  options={categoryOptions}
                  value={field.value}
                  onChange={e => {
                    field.onChange(e)
                    setValue('subcategory', '')
                  }}
                  error={errors.category?.message}
                />
              )}
            />
            {subcatOptions.length > 0 ? (
              <Controller
                name="subcategory"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Subcategoría"
                    placeholder="Selecciona…"
                    options={subcatOptions}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={errors.subcategory?.message}
                  />
                )}
              />
            ) : (
              <Input
                label="Subcategoría"
                placeholder="Ej: Almuerzo, Agua…"
                {...register('subcategory')}
                error={errors.subcategory?.message}
              />
            )}
          </div>

          {/* Descripción + Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Descripción (opcional)"
              placeholder="Nota adicional…"
              {...register('description')}
            />
            <Input
              label="Cliente (opcional)"
              placeholder="Ej: Juan Pérez"
              {...register('client')}
            />
          </div>

          {/* Resumen inline */}
          {watch('amount') > 0 && watch('accountId') && (
            <div className={`
              px-4 py-3 rounded-xl border text-sm font-semibold
              ${txType === 'Ingreso'
                ? 'bg-positive/5 border-positive/30 text-positive'
                : txType === 'Egreso'
                  ? 'bg-orange-red/5 border-orange-red/30 text-orange-red'
                  : 'bg-teal/5 border-teal/30 text-teal'
              }
            `}>
              {txType === 'Ingreso' && `+ $${Number(watch('amount')).toFixed(2)} en ${accounts.find(a => a.id === watch('accountId'))?.name ?? '—'}`}
              {txType === 'Egreso'  && `- $${Number(watch('amount')).toFixed(2)} de ${accounts.find(a => a.id === watch('accountId'))?.name ?? '—'}`}
              {txType === 'Transferencia' && watch('toAccountId') && (
                `$${Number(watch('amount')).toFixed(2)} de ${accounts.find(a => a.id === watch('accountId'))?.name ?? '—'} → ${accounts.find(a => a.id === watch('toAccountId'))?.name ?? '—'}`
              )}
            </div>
          )}

          {/* Botón */}
          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={isSubmitting || createTx.isPending}
            >
              <PlusCircle size={17} />
              Guardar transacción
            </Button>
            {createTx.isError && (
              <p className="text-negative text-xs text-center mt-2">
                Error al guardar. Intenta nuevamente.
              </p>
            )}
          </div>
        </Card>
      </form>
    </div>
  )
}
