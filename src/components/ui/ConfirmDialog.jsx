import Modal from './Modal.jsx'
import Button from './Button.jsx'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Eliminar', confirmVariant = 'danger' }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)', lineHeight: 1.6 }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant={confirmVariant} onClick={() => { onConfirm(); onClose() }}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}
