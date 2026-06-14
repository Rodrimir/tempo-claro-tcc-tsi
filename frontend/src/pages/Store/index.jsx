// @audit-ok: FRONTEND-index.jsx-01
import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
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
  ItemCount
} from './styles';

const Store = () => {
  const { addToast } = useToast();
  const [selectedHabitId, setSelectedHabitId] = useState('');
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  
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

  const activeHabits = habits.filter(h => h.status !== 'ARCHIVED' && h.status !== 'COMPLETED');

  const handleBuyShield = async () => {
    if (!selectedHabitId) {
      addToast('Selecione um hábito.', 'error');
      return;
    }
    
    try {
      await apiBuyShield(selectedHabitId);
      addToast('Escudo comprado com sucesso para o hábito!', 'success');
      setSelectedHabitId('');
      loadHabits(); // @audit-info:  Recarrega para atualizar os saldos
    } catch (error) {
      addToast('Erro ao comprar escudo. Moedas insuficientes?', 'error');
    }
  };

  if (loading) return <LoadingScreen message="Carregando Loja" />;

  return (
    <StoreContainer>
      <Title>Loja Local</Title>
      <Subtitle>
        Gaste suas moedas ganhas com disciplina para comprar proteção contra imprevistos.
      </Subtitle>

      <BuyCard>
        <IconWrapper>
          <ShieldAlert size={32} />
        </IconWrapper>
        <CardTitle>Comprar Bloqueio (Escudo)</CardTitle>
        <CardText>
          Custa 1500 moedas locais. Ele será gasto automaticamente às 23:59h caso você falhe na tarefa, salvando sua ofensiva!
        </CardText>

        <FormGroup>
          <Label htmlFor="store-habit-select">
            Para qual hábito deseja aplicar o escudo?
          </Label>
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

        <BuyButton onClick={handleBuyShield}>
          Comprar (1500 <span style={{ color: 'var(--warning-color)' }}>🪙</span>)
        </BuyButton>
      </BuyCard>

      <InventorySection>
        <InventoryTitle>Seus Escudos Atuais</InventoryTitle>
        <InventoryList>
          {habits.filter(h => h.status !== 'ARCHIVED').map(h => (
            <InventoryItem key={h.id}>
              <ItemInfo>
                <ItemTitle>{h.titulo}</ItemTitle>
                <ItemSubtitle>Saldo: {h.moedas_locais || 0} moedas</ItemSubtitle>
              </ItemInfo>
              <ItemCount>
                {h.bloqueios_acumulados || 0} <ShieldCheck size={20} />
              </ItemCount>
            </InventoryItem>
          ))}
        </InventoryList>
      </InventorySection>
    </StoreContainer>
  );
};

export default Store;
