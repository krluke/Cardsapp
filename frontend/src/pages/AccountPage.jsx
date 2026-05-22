import { UserProfile } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import './AccountPage.css'

export default function AccountPage() {
  const navigate = useNavigate()

  return (
    <div className="account-page">
      <header className="account-header">
        <button className="back-btn" onClick={() => navigate('/home')}>
          <ArrowLeft size={20} /> Back
        </button>
      </header>
      <main className="account-main">
        <UserProfile />
      </main>
    </div>
  )
}
