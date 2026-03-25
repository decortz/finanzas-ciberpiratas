import { useSearchParams, useNavigate } from 'react-router-dom'
import MovementFormModal from '../components/movements/MovementFormModal.jsx'

export default function NewMovementPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const projectId = searchParams.get('project') || ''

  return (
    <MovementFormModal
      isOpen={true}
      onClose={() => navigate(-1)}
      defaultProjectId={projectId}
    />
  )
}
