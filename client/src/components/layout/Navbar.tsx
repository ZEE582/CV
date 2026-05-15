import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AuthModal from '../ui/AuthModal'

export default function Navbar() {
  const { isLoggedIn, logout } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [modalTab, setModalTab]   = useState<'login' | 'signup'>('login')
  const [scrolled, setScrolled]   = useState(false)

  function openLogin()  { setModalTab('login');  setShowModal(true) }
  function openSignup() { setModalTab('signup'); setShowModal(true) }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 sm:px-12 py-4
          bg-white/60 backdrop-blur-xl backdrop-saturate-150
          transition-all duration-300
          ${scrolled
            ? 'border-b border-indigo-100/70 shadow-[0_4px_24px_-8px_rgba(79,70,229,0.12)]'
            : 'border-b border-transparent'}`}
      >

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {[
                { to: '/companies', label: 'الشركات' },
                { to: '/support',   label: 'الدعم'   },
              ].map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `relative text-sm px-5 py-2 rounded-lg border overflow-hidden transition-colors duration-300 ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                        : 'border-indigo-200 text-indigo-600 bg-white/40 before:absolute before:inset-0 before:bg-indigo-600 before:-translate-x-full before:transition-transform before:duration-300 hover:before:translate-x-0 hover:text-white hover:border-indigo-600'
                    }`
                  }
                >
                  <span className="relative font-[Bitcount_Grid_Single,system-ui]">{label}</span>
                </NavLink>
              ))}
              <button
                onClick={logout}
                className="relative text-sm px-5 py-2 rounded-lg border border-red-200 text-red-500 bg-white/40 overflow-hidden
                  before:absolute before:inset-0 before:bg-red-500 before:-translate-x-full before:transition-transform before:duration-300
                  hover:before:translate-x-0 hover:text-white hover:border-red-500 transition-colors duration-300"
              >
                <span className="relative font-[Bitcount_Grid_Single,system-ui]">logout</span>
              </button>
            </>
          ) : (
            ['login', 'sign up'].map((label) => (
              <button
                key={label}
                onClick={label === 'login' ? openLogin : openSignup}
                className="relative text-sm px-5 py-2 rounded-lg border border-indigo-200 text-indigo-600 bg-white/40 overflow-hidden
                  before:absolute before:inset-0 before:bg-indigo-600 before:-translate-x-full before:transition-transform before:duration-300
                  hover:before:translate-x-0 hover:text-white hover:border-indigo-600 transition-colors duration-300"
              >
                <span className="relative font-[Bitcount_Grid_Single,system-ui]">{label}</span>
              </button>
            ))
          )}
        </div>

        <div className="font-extrabold text-xl sm:text-3xl text-gray-900 leading-none">
          تتطور
          <span className="text-gray-400 pr-4 sm:pr-6">ttwar</span>
        </div>
      </nav>

      {showModal && (
        <AuthModal defaultTab={modalTab} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
