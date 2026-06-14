// @audit-ok: FRONTEND-index.jsx-01
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HeartCrack, Clock, ShieldAlert } from 'lucide-react';
import './styles.scss';

// @audit-info :  pré-processadores Sass
const Fail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const type = location.state?.type || 'FAIL_VOLUNTARY'; 
  const feedbackMsg = location.state?.feedback?.texto_feedback;
  
  let icon, title, subtitle, bgColor, iconColor;
  
  if (type === 'BLOCK_ACTIVE') {
    icon = <ShieldAlert size={80} />;
    title = 'Protegido!';
    subtitle = feedbackMsg || 'Acúmulos protegidos! Sua ofensiva foi salva pelo Escudo.';
    bgColor = 'var(--warning-color)';
    iconColor = 'white';
  } else if (type === 'FAIL_TIMEOUT') {
    icon = <Clock size={80} />;
    title = 'Tempo Esgotado';
    subtitle = feedbackMsg || 'Você demorou muito para retomar. A ofensiva foi perdida.';
    bgColor = 'var(--danger-color)';
    iconColor = 'white';
  } else {
    icon = <HeartCrack size={80} />;
    title = 'Ofensiva Perdida';
    subtitle = feedbackMsg || 'Está tudo bem. O importante é recomeçar amanhã.';
    bgColor = 'var(--danger-color)';
    iconColor = 'white';
  }

  return (
    <div className="FailContainer" style={{ backgroundColor: bgColor }}>
      <div className="ContentWrapper">
        <div className="IconWrapper" style={{ color: iconColor }}>
          {icon}
        </div>
        
        <h1 className="Title">{title}</h1>
        <p className="Subtitle">{subtitle}</p>
        
        <div className="CoinsCard">
          <span>🪙 Moedas Ganhas:</span>
          <span>{location.state?.feedback?.moedas_ganhas || 0}</span>
        </div>
        
        <button 
          className="ActionButton" 
          style={{ color: bgColor }} 
          onClick={() => navigate('/home')}
        >
          CONTINUAR
        </button>
      </div>
    </div>
  );
};

export default Fail;
