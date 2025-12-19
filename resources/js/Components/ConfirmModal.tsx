import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    loading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirmar Ação',
    message = 'Tem certeza que deseja continuar?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger',
    loading = false,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: 'bg-rose-100 text-rose-600',
            button: 'bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 shadow-rose-500/25',
        },
        warning: {
            icon: 'bg-amber-100 text-amber-600',
            button: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25',
        },
        info: {
            icon: 'bg-blue-100 text-blue-600',
            button: 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-blue-500/25',
        },
    };

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md transform animate-in fade-in zoom-in-95 duration-200">
                <div className="rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-gray-100">
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    {/* Icon and content */}
                    <div className="flex flex-col items-center text-center">
                        <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${styles.icon}`}>
                            <AlertTriangle className="h-8 w-8" />
                        </div>

                        <h3 className="text-xl font-bold text-gray-900">
                            {title}
                        </h3>

                        <p className="mt-2 text-gray-600">
                            {message}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={loading}
                            className={`flex-1 rounded-xl px-4 py-2.5 font-medium text-white shadow-lg transition disabled:opacity-50 ${styles.button}`}
                        >
                            {loading ? 'Aguarde...' : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
