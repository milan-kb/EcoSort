import { Info, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../app/context';
export function AccountLinks() {
  const { logout } = useApp(),
    navigate = useNavigate();
  return (
    <div className="account-links">
      <Link className="btn btn-secondary" to="/about">
        <Info size={17} />
        About EcoSort
      </Link>
      <button
        className="btn btn-secondary"
        type="button"
        onClick={async () => {
          await logout();
          navigate('/');
        }}
      >
        <LogOut size={17} />
        Sign out
      </button>
    </div>
  );
}
