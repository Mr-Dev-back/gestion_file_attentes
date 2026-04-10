import React, { useState } from 'react';
import type { FormFieldConfig, FormFieldValue, Ticket, TicketFormData } from '../../../types/ticket';
import { Input } from '../../atoms/ui/input';
import { Button } from '../../atoms/ui/button';
import { Scale } from 'lucide-react';

interface Props {
    config: FormFieldConfig[];
    onSubmit: (data: TicketFormData) => void;
    isLoading?: boolean;
    initialData?: Partial<Ticket> | TicketFormData;
}

export const DynamicForm: React.FC<Props> = ({ config, onSubmit, isLoading, initialData = {} }) => {
    const [formData, setFormData] = useState<TicketFormData>(initialData as TicketFormData);
    const [isSimulatingScale, setIsSimulatingScale] = useState<string | null>(null);

    const handleChange = (name: string, value: FormFieldValue) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const getInputValue = (value: FormFieldValue | undefined) => {
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        return value ?? '';
    };

    const handleSimulateScale = (fieldName: string) => {
        setIsSimulatingScale(fieldName);
        // Simuler un appel API au pont-bascule
        setTimeout(() => {
            const randomWeight = Math.floor(Math.random() * (40000 - 15000) + 15000);
            handleChange(fieldName, randomWeight);
            setIsSimulatingScale(null);
        }, 1500);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {config.map((field) => (
                    <div key={field.name} className={field.type === 'checkbox' ? 'flex items-center gap-2' : 'flex flex-col gap-1.5'}>
                        {field.type !== 'checkbox' && (
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                {field.label} {field.required && <span className="text-danger">*</span>}
                            </label>
                        )}

                        {field.type === 'text' && (
                            <Input
                                type="text"
                                placeholder={field.placeholder}
                                value={getInputValue(formData[field.name])}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                required={field.required}
                                className="h-11 bg-white border-slate-200 shadow-sm focus:ring-primary/20"
                            />
                        )}

                        {field.type === 'number' && (
                            <Input
                                type="number"
                                placeholder={field.placeholder}
                                value={getInputValue(formData[field.name])}
                                onChange={(e) => handleChange(field.name, parseFloat(e.target.value))}
                                required={field.required}
                                className="h-11 bg-white border-slate-200 shadow-sm"
                            />
                        )}

                        {field.type === 'select' && (
                            <select
                                value={getInputValue(formData[field.name])}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                required={field.required}
                                className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="">Choisir une option...</option>
                                {field.options?.map((opt) => (
                                    <option key={String(opt.value)} value={String(opt.value)}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        )}

                        {field.type === 'checkbox' && (
                            <>
                                <input
                                    type="checkbox"
                                    id={field.name}
                                    checked={!!formData[field.name]}
                                    onChange={(e) => handleChange(field.name, e.target.checked)}
                                    className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor={field.name} className="text-sm font-semibold text-slate-700">
                                    {field.label}
                                </label>
                            </>
                        )}

                        {(field.type === 'weight_in' || field.type === 'weight_out') && (
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={getInputValue(formData[field.name])}
                                        onChange={(e) => handleChange(field.name, parseFloat(e.target.value))}
                                        required={field.required}
                                        className="h-11 bg-slate-50 border-slate-200 pr-12 font-mono text-lg font-bold text-primary"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">KG</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleSimulateScale(field.name)}
                                    isLoading={isSimulatingScale === field.name}
                                    className="h-11 px-3 border-slate-200 hover:bg-slate-50 text-slate-600"
                                    title="Appeler le pont-bascule"
                                >
                                    <Scale className="h-5 w-5" />
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button 
                    type="submit" 
                    className="h-12 px-8 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
                    isLoading={isLoading}
                >
                    Valider l'étape
                </Button>
            </div>
        </form>
    );
};
