import styled from 'styled-components';

// @audit-ok [E3.4 — tela cheia (mesma família do Success/Fail): primaryColor
// era pastel de propósito no tema escuro; com texto branco por cima em toda
// a tela, precisa do primary-strong.]
export const PreTaskContainer = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 100vh;
  justify-content: center;
  background: var(--primary-strong);
  color: white;
`;

export const BackButtonWrapper = styled.div`
  position: absolute;
  top: 24px;
  left: 24px;
`;

export const BackButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 320px;
  margin: 0 auto;
`;

// @audit-ok [E4.1 (item 4) — antes a tela só mostrava a frase motivacional,
// sem dizer o que ia ser executado. Nome do hábito em destaque, no topo.]
export const HabitName = styled.h1`
  font-size: 28px;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 8px;
`;

// @audit-ok [E4.1 (item 3) — "Torne-o Evidente" (Clear): acima da frase
// motivacional, só quando o hábito tem gatilho_ancora preenchido.]
export const GatilhoText = styled.p`
  font-size: 15px;
  font-style: italic;
  opacity: 0.85;
  margin-bottom: 24px;
`;

export const QuoteText = styled.h2`
  font-size: 24px;
  font-weight: 700;
  line-height: 1.4;
  margin-bottom: 16px;
`;

export const ActionWrapper = styled.div`
  padding-bottom: 24px;
  width: 100%;
`;

// @audit-ok [E4.1 — achado ao mexer neste arquivo: primaryColor era pastel
// de propósito no tema escuro (papel de texto/ícone sobre fundo escuro); como
// texto sobre fundo BRANCO aqui, dava só 2,98:1 — mesma classe de bug da
// E3.4 (contraste é simétrico: falha nos dois sentidos, fundo-com-texto-branco
// e texto-sobre-branco), só que a varredura de então buscava só o primeiro
// sentido e não pegou este.]
export const ReadyButton = styled.button`
  background: white;
  color: var(--primary-strong);
  font-size: 18px;
  font-weight: 700;
  padding: 20px;
  width: 100%;
  border-radius: 9999px;
  border: none;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  cursor: pointer;
`;
