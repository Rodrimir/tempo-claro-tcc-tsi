import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Store as StoreIcon } from 'lucide-react';
import { getDashboard, buyShield as apiBuyShield } from '../../services/api';
import LocalHeader from '../../components/layout/LocalHeader';
import LoadingScreen from '../../components/common/LoadingScreen';
import { useToast } from '../../contexts/ToastContext';
import {
  StoreContainer,
  Title,
  Subtitle,
  BuyCard,
  IconWrapper,
  CardTitle,
  CardText,
  FormGroup,
  Label,
  Select,
  BuyButton,
  InventorySection,
  InventoryTitle,
  InventoryList,
  InventoryItem,
  ItemInfo,
  ItemTitle,
  ItemSubtitle,
  ItemCount,
  EmptyStateContainer,
  EmptyIconWrapper,
  EmptyTitle,
  EmptyText,
  InventoryEmptyText
} from './styles';

// @audit-ok [Loja Escudo (1) — tela de compra de escudos protetores com moedas locais]

const Store = () => {
  const { addToast } = useToast();
  const [selectedHabitId, setSelectedHabitId] = useState('');
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  // @audit-ok [Loja Escudo (2) — busca lista de hábitos via GET /dashboard]
  const loadHabits = async () => {
    try {
      const response = await getDashboard();
      const data = response.data.habits || response.data || [];
      if (Array.isArray(data)) {
        setHabits(data);
      }
    } catch (error) {
      console.error("Erro ao carregar hábitos na loja:", error);
      addToast('Erro ao carregar dados da loja.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  // @audit-ok [Loja Escudo (4) — filtra apenas hábitos ativos para o select de compra]
  const activeHabits = habits.filter(h => h.status !== 'ARCHIVED' && h.status !== 'COMPLETED');

  // @audit-ok [Loja Escudo (7) — processa compra de escudo para o hábito selecionado]
  const handleBuyShield = async () => {
    // @audit-ok [Loja Escudo (8) — valida seleção antes de chamar a API]
    if (!selectedHabitId) {
      addToast('Selecione um hábito.', 'error');
      return;
    }
    try {
      // @audit-ok [Loja Escudo (9) — envia POST /habits/{id}/shield]
      await apiBuyShield(selectedHabitId);
      // @audit-ok [Loja Escudo (19) — confirma compra e recarrega lista atualizada]
      addToast('Escudo comprado com sucesso para o hábito!', 'success');
      setSelectedHabitId('');
      loadHabits();
    } catch (error) {
      addToast('Erro ao comprar escudo. Moedas insuficientes?', 'error');
    }
  };

  if (loading) return <LoadingScreen message="Carregando Loja" />;

  // @audit-ok [E3.1 (item 2) — antes desta tarefa, 0 hábitos deixava o
  // <Select> sem nenhuma opção e "Seus Escudos Atuais" com a lista em branco,
  // sem explicação nenhuma. Vira uma tela dedicada, igual ao padrão já usado
  // em Home.jsx/Stats.jsx pra "nada aqui ainda".]
  if (habits.length === 0) {
    return (
      <StoreContainer>
        <Title>Loja do Hábito</Title>
        <EmptyStateContainer>
          <EmptyIconWrapper><StoreIcon size={32} /></EmptyIconWrapper>
          <EmptyTitle>Nada pra comprar ainda</EmptyTitle>
          <EmptyText>Crie um hábito para começar a ganhar moedas.</EmptyText>
        </EmptyStateContainer>
      </StoreContainer>
    );
  }

  // @audit-ok [E3.1 (item 4) — "inventário vazio" aqui não é a lista sem
  // linhas (os hábitos existem) — é ninguém ter nenhum escudo comprado ainda.
  // Mostrar 3 linhas "0 🛡️" sem contexto não é uma explicação.]
  const inventarioHabits = habits.filter(h => h.status !== 'ARCHIVED');
  const nenhumEscudoAinda = inventarioHabits.every(h => (h.bloqueios_acumulados || 0) === 0);

  return (
    <StoreContainer>
      {/* @audit-ok [E1.7 — D2: escudo automático às 23:59 ainda não existe
          (fica pra E4.3). O texto antigo prometia esse comportamento; até a
          E4.3 entrar, o único jeito de usar o escudo é escolher "Usar Escudo"
          no modal de desistência (GiveUpModal) — ver
          GamificacaoService.processarExecucao, ramo FAIL_BLOQUEIO.] */}
      <Title>Loja do Hábito</Title>
      <Subtitle>
        As moedas mostradas aqui pertencem só ao hábito selecionado — cada hábito
        tem seu próprio saldo, não existe uma carteira única da conta.
      </Subtitle>

      <BuyCard>
        <IconWrapper><ShieldAlert size={32} /></IconWrapper>
        <CardTitle>Comprar Bloqueio (Escudo)</CardTitle>
        <CardText>
          Custa 1500 moedas deste hábito. Use o escudo ao desistir de uma tarefa
          para não perder sua ofensiva. Limite de um escudo por dia por hábito.
        </CardText>

        <FormGroup>
          <Label htmlFor="store-habit-select">Para qual hábito deseja aplicar o escudo?</Label>
          {/* @audit-ok [Loja Escudo (5) — dropdown exibe hábitos ativos com saldo de moedas] */}
          <Select
            id="store-habit-select"
            value={selectedHabitId}
            onChange={e => setSelectedHabitId(e.target.value)}
          >
            <option value="" disabled>Selecione um hábito...</option>
            {activeHabits.map(h => (
              <option key={h.id} value={h.id}>{h.titulo} (Moedas: {h.moedas_locais})</option>
            ))}
          </Select>
        </FormGroup>

        {/* @audit-ok [E3.4 — warningColor (pensado pra texto/ícone sobre
            bg-surface) já dava 2,93:1 aqui mesmo antes desta tarefa, contra o
            preenchimento roxo do botão — piorou pra 1,25:1 depois de
            escurecer warningColor no tema claro para o papel de texto branco
            em outro lugar. Como emoji normalmente ignora `color` do CSS (glifo
            colorido próprio), o risco prático é baixo, mas simplifica pra
            branco (igual ao resto do texto do botão) pra não depender de mais
            nenhum token aqui.] */}
        <BuyButton onClick={handleBuyShield}>
          Comprar (1500 <span style={{ color: 'white' }}>🪙</span>)
        </BuyButton>
      </BuyCard>

      <InventorySection>
        <InventoryTitle>Seus Escudos Atuais</InventoryTitle>
        {nenhumEscudoAinda ? (
          <InventoryEmptyText>
            Você ainda não tem nenhum escudo. Compre um acima para proteger sua ofensiva.
          </InventoryEmptyText>
        ) : (
          <InventoryList>
            {inventarioHabits.map(h => (
              <InventoryItem key={h.id}>
                <ItemInfo>
                  <ItemTitle>{h.titulo}</ItemTitle>
                  <ItemSubtitle>Saldo: {h.moedas_locais || 0} moedas</ItemSubtitle>
                </ItemInfo>
                <ItemCount>{h.bloqueios_acumulados || 0} <ShieldCheck size={20} /></ItemCount>
              </InventoryItem>
            ))}
          </InventoryList>
        )}
      </InventorySection>
    </StoreContainer>
  );
};

export default Store;
