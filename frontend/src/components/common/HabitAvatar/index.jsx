import React, { useState } from 'react';
import { buildAvatarUrl } from '../../../utils/avatar';
import gotinhaNormal from '../../../assets/gotinha/normal.png';
import gotinhaFeliz from '../../../assets/gotinha/feliz.png';

// @audit-ok [Avatar F05 — usa o asset do backend (avatarUrl + expressão) com fallback local/emoji]

const EMOJIS = {
  normal: '🌱',
  preocupado: '😰',
  desesperado: '😱',
  concluido: '✨',
  sucesso: '🌟',
  falha: '☠️'
};

// @audit-info [Avatar F05 — imagens locais da gotinha (Água) enquanto o catálogo completo não é servido pelo backend]
const LOCAL_AGUA = {
  normal: gotinhaNormal,
  concluido: gotinhaFeliz,
  sucesso: gotinhaFeliz
};

const wrapperStyle = { position: 'relative', width: '160px', height: '160px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const imgStyle = { width: '100%', height: '100%', objectFit: 'contain' };

// @audit-info [Avatar F05 — o pai deve passar key por habito+expressão para resetar o estado de erro ao trocar]
const HabitAvatar = ({ habit, expression }) => {
  const [failed, setFailed] = useState(false);
  const remoteUrl = buildAvatarUrl(habit?.avatarUrl, expression);

  // @audit-ok [Avatar F05 — asset oficial do backend (prioritário)]
  if (remoteUrl && !failed) {
    return (
      <div style={wrapperStyle}>
        <img src={remoteUrl} alt={`Avatar ${expression}`} style={imgStyle} onError={() => setFailed(true)} />
      </div>
    );
  }

  // @audit-ok [Avatar F05 — fallback: imagens locais da gotinha (Água) ou emoji por expressão]
  const localAgua = habit?.categoriaCodigo === 'AGUA' ? LOCAL_AGUA[expression] : null;
  if (localAgua) {
    return <div style={wrapperStyle}><img src={localAgua} alt={`Gotinha ${expression}`} style={imgStyle} /></div>;
  }

  return (
    <div style={wrapperStyle}>
      <span style={{ fontSize: '100px', display: 'block' }}>{EMOJIS[expression] || '🌱'}</span>
    </div>
  );
};

export default HabitAvatar;
