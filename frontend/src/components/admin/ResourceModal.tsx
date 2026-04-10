import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resourceSchema } from '../../lib/validation';
import { Modal } from '../molecules/ui/modal';
import { Button } from '../atoms/ui/button';
import { Input } from '../atoms/ui/input';
import { Loader2, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ResourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    editingResource?: any;
    isPending?: boolean;
}

export const ResourceModal = ({ isOpen, onClose, onSave, editingResource, isPending }: ResourceModalProps) => {
    const [isAutoSlug, setIsAutoSlug] = useState(!editingResource);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isValid, isDirty }
    } = useForm({
        resolver: zodResolver(resourceSchema),
        defaultValues: {
            name: '',
            slug: '',
            description: ''
        },
        mode: 'onChange'
    });

    const watchedName = watch('name');

    // Auto-slugify logic
    useEffect(() => {
        if (isAutoSlug && watchedName && !editingResource) {
            const slug = watchedName
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // Remove accents
                .toUpperCase()
                .replace(/[^A-Z0-9]+/g, '_')   // Replace non-alphanumeric with _
                .replace(/^_+|_+$/g, '');       // Trim underscores
            
            setValue('slug', slug, { shouldValidate: true });
        }
    }, [watchedName, isAutoSlug, setValue, editingResource]);

    // Reset when opening/editing
    useEffect(() => {
        if (isOpen) {
            if (editingResource) {
                reset({
                    name: editingResource.name,
                    slug: editingResource.slug,
                    description: editingResource.description || ''
                });
                setIsAutoSlug(false);
            } else {
                reset({ name: '', slug: '', description: '' });
                setIsAutoSlug(true);
            }
        }
    }, [isOpen, editingResource, reset]);

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsAutoSlug(false);
        setValue('slug', e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''), { shouldValidate: true });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingResource ? `Modifier: ${editingResource.name}` : "Nouvelle Ressource Système"}
            isDirty={isDirty}
        >
            <form onSubmit={handleSubmit(onSave)} className="space-y-5 pt-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Label Public (Nom Humain)</label>
                    <Input 
                        placeholder="E.g. Gestion des Véhicules" 
                        {...register('name')} 
                        error={errors.name?.message} 
                        className="h-11 rounded-xl font-bold"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center pr-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Slug Technique (Identifiant Unique)</label>
                        {!editingResource && isAutoSlug && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-primary animate-pulse">
                                <Zap className="w-3 h-3" /> Auto-génération active
                            </span>
                        )}
                    </div>
                    <Input 
                        placeholder="E.g. VEHICULE" 
                        {...register('slug')} 
                        onChange={handleSlugChange}
                        error={errors.slug?.message} 
                        disabled={!!editingResource} // Immutable slug
                        className={cn(
                            "h-11 rounded-xl font-mono text-sm tracking-wider uppercase",
                            editingResource && "bg-slate-50 opacity-70 cursor-not-allowed"
                        )}
                    />
                    {editingResource && (
                        <p className="text-[9px] text-warning font-bold italic ml-1 mt-1 pr-4">
                            L'identifiant technique ne peut pas être modifié pour préserver l'intégrité des permissions existantes.
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Description contextuelle</label>
                    <Input 
                        placeholder="A quoi sert cet objet dans le système ?" 
                        {...register('description')} 
                        error={errors.description?.message} 
                        className="h-11 rounded-xl"
                    />
                </div>

                {!editingResource && (
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex gap-3 items-start">
                        <div className="bg-primary/20 p-1.5 rounded-lg">
                            <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-[10px] text-primary/80 font-bold leading-relaxed italic">
                            💡 En enregistrant, le système générera automatiquement une matrice complète de permissions (READ, CREATE, UPDATE, etc.) pour cette ressource.
                        </p>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                    <Button type="button" variant="outline" onClick={onClose} className="rounded-xl px-6">Annuler</Button>
                    <Button type="submit" disabled={!isValid || isPending} className="rounded-xl px-10 shadow-lg shadow-primary/20 font-black">
                        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingResource ? "Mettre à jour" : "Créer la Ressource"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
