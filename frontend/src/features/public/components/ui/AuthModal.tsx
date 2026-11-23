import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export default function AuthModal({ defaultTab = 'login' }: { defaultTab?: 'login' | 'signup'; onClose: () => void }) {
  const navigate = useNavigate();
  useEffect(() => { navigate(defaultTab === 'signup' ? '/signup' : '/login'); }, [defaultTab, navigate]);
  return null;
}
