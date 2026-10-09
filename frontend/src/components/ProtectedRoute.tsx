import { Link, Navigate, useLocation } from 'react-router-dom'
import { getCurrentUser, getRoleHome, type UserRole } from '../utils/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  roles?: UserRole[]
}

function AccessDenied({ role }: { role?: UserRole }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-center text-white">
      <div className="max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-300">Access denied</p>
        <h1 className="mt-4 text-3xl font-bold">This area is not available for your role</h1>
        <p className="mt-3 text-slate-400">{role ? 'Use your authorized dashboard to continue.' : 'You do not have permission to view this page.'}</p>
        {role && <Link className="mt-6 inline-flex rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white hover:bg-violet-400" to={getRoleHome(role)}>Go to my dashboard</Link>}
      </div>
    </main>
  )
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const location = useLocation()
  const user = getCurrentUser()

  if (!user) {
    const returnTo = `${location.pathname}${location.search}`
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <AccessDenied role={user.role} />
  }

  return children
}
