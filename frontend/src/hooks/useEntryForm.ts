import { useState, useEffect } from 'react';
import type { AxiosError } from 'axios';
import { useTicketStore } from '../stores/useTicketStore';
import { useCategories, type Category } from './useCategories';
import { api } from '../services/api';
import { toast } from '../components/molecules/ui/toast';
import type { Ticket } from '../types/ticket';

export function useEntryForm() {
    const { categories: availableCategories, isLoading: isLoadingCats } = useCategories();
    const { addTicket, tickets, fetchTickets } = useTicketStore();

    const [isLoading, setIsLoading] = useState(false);
    const [isValidatingOrder, setIsValidatingOrder] = useState(false);
    const [successTicket, setSuccessTicket] = useState<Ticket | null>(null);
    const [customerName, setCustomerName] = useState('');
    const [salesPerson, setSalesPerson] = useState('');

    const [formData, setFormData] = useState({
        licensePlate: '',
        driverName: '',
        driverPhone: '',
        orderNumber: '',
        categoryId: '',
        priority: 0,
    });

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(() => fetchTickets(), 30000);
        return () => clearInterval(interval);
    }, [fetchTickets]);

    const handleReset = () => {
        setFormData({
            licensePlate: '',
            driverName: '',
            driverPhone: '',
            orderNumber: '',
            categoryId: '',
            priority: 0,
        });
        setCustomerName('');
        setSalesPerson('');
        setSuccessTicket(null);
    };

    const handleValidateOrder = async () => {
        if (!formData.orderNumber) return;
        setIsValidatingOrder(true);
        try {
            const { data } = await api.get(`/tickets/validate-order/${formData.orderNumber}`);
            if (data.exists) {
                if (data.isPaid) {
                    toast('Cette commande est déjà soldée. Impossible de la traiter à nouveau.', 'warning');
                    setCustomerName('');
                    setSalesPerson('');
                    setFormData(prev => ({ ...prev, categoryId: '' }));
                    return;
                }

                setCustomerName(data.customerName);
                if (data.commercialName) setSalesPerson(data.commercialName);

                if (data.suggestedCategories && Array.isArray(data.suggestedCategories)) {
                    const suggestedUpper = data.suggestedCategories.map((s: string) => s.toUpperCase().trim());

                    const matchedCategory = availableCategories.find((c: Category) => {
                        const prefixMatch = c.prefix && suggestedUpper.includes(c.prefix.toUpperCase().trim());
                        const nameMatch = c.name && suggestedUpper.includes(c.name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim());
                        return prefixMatch || nameMatch;
                    });

                    if (matchedCategory) {
                        setFormData(prev => ({
                            ...prev,
                            categoryId: matchedCategory.categoryId
                        }));
                        toast(`Catégorie détectée : ${matchedCategory.name}`, 'success');
                    } else {
                        toast('Catégorie de commande non reconnue, veuillez la sélectionner manuellement', 'warning');
                    }
                }

                toast(`Commande valide : ${data.customerName}`, 'success');
            } else {
                toast('Commande introuvable dans Sage X3', 'warning');
            }
        } catch {
            toast('Lien Sage X3 indisponible', 'error');
        } finally {
            setIsValidatingOrder(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.licensePlate || !formData.driverName || !formData.categoryId) {
            toast('Veuillez remplir les champs obligatoires (Immatriculation, Chauffeur, Catégorie)', 'warning');
            return;
        }

        setIsLoading(true);
        try {
            const ticket = await addTicket({
                ...formData,
                companyName: customerName || 'PASSAGER',
            });

            toast('Ticket généré !', 'success');
            setSuccessTicket(ticket);
        } catch (error) {
            const apiError = error as AxiosError<{ error?: string }>;
            toast(apiError.response?.data?.error || 'Erreur lors de l\'enregistrement', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        formData,
        setFormData,
        customerName,
        setCustomerName,
        salesPerson,
        setSalesPerson,
        successTicket,
        isLoading,
        isValidatingOrder,
        availableCategories,
        isLoadingCats,
        tickets,
        handleReset,
        handleValidateOrder,
        handleSubmit
    };
}
