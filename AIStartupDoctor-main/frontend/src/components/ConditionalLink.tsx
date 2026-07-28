import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOnboarding } from '../hooks/useOnboarding';

interface ConditionalLinkProps {
  to: string;
  requireOnboarding?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const ConditionalLink: React.FC<ConditionalLinkProps> = ({
  to,
  requireOnboarding = false,
  children,
  className,
  onClick
}) => {
  const { isOnboarded, loading } = useOnboarding();
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }

    if (requireOnboarding && !loading && !isOnboarded) {
      e.preventDefault();
      navigate('/onboarding');
    }
  };

  return (
    <Link to={to} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
};

export default ConditionalLink;