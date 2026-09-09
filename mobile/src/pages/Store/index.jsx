import { useState, useCallback, useRef } from 'react';
import { Modal } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { getDashboard, buyShield as apiBuyShield } from '../../services/api';
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
  SelectField,
  SelectFieldText,
  BuyButton,
  BuyButtonText,
  InventorySection,
  InventoryTitle,
  InventoryList,
  InventoryItem,
  ItemInfo,
  ItemTitle,
  ItemSubtitle,
  ItemCount,
  ItemCountText,
  EmptyStateContainer,
  EmptyIconWrapper,
  EmptyTitle,
  EmptyText,
  InventoryEmptyText,
  PickerOverlay,
  PickerSheet,
  PickerOption,
  PickerOptionText,
} from './styles';

const Store = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { addToast } = useToast();
  const [selectedHabitId, setSelectedHabitId] = useState('');
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickerAberto, setPickerAberto] = useState(false);

  const loadHabits = useCallback(async (silencioso = false) => {
    try {
      const response = await getDashboard();
      const data = response.data.habits || response.data || [];
      if (Array.isArray(data)) {
        setHabits(data);
      }
    } catch (error) {
      addToast('Erro ao carregar dados da loja.', 'error');
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, [addToast]);

  const primeiraCarga = useRef(true);
  useFocusEffect(
    useCallback(() => {
      loadHabits(!primeiraCarga.current);
      primeiraCarga.current = false;
    }, [loadHabits])
  );

  const activeHabits = habits.filter((h) => h.status !== 'ARCHIVED' && h.status !== 'COMPLETED');
  const habitoSelecionado = activeHabits.find((h) => h.id === selectedHabitId);

  const handleBuyShield = async () => {
    if (!selectedHabitId) {
      addToast('Selecione um hábito.', 'error');
      return;
    }
    try {
      await apiBuyShield(selectedHabitId);
      addToast('Escudo comprado com sucesso para o hábito!', 'success');
      setSelectedHabitId('');
      loadHabits();
    } catch (error) {
      addToast('Erro ao comprar escudo. Moedas insuficientes?', 'error');
    }
  };

  if (loading) return <LoadingScreen message="Carregando Loja" />;

  if (habits.length === 0) {
    return (
      <StoreContainer $insetTop={insets.top}>
        <Title>Loja do Hábito</Title>
        <EmptyStateContainer>
          <EmptyIconWrapper>
            <MaterialCommunityIcons name="store" size={32} color={theme.textSecondary} />
          </EmptyIconWrapper>
          <EmptyTitle>Nada pra comprar ainda</EmptyTitle>
          <EmptyText>Crie um hábito para começar a ganhar moedas.</EmptyText>
        </EmptyStateContainer>
      </StoreContainer>
    );
  }

  const inventarioHabits = habits.filter((h) => h.status !== 'ARCHIVED');
  const nenhumEscudoAinda = inventarioHabits.every((h) => (h.bloqueios_acumulados || 0) === 0);

  return (
    <StoreContainer $insetTop={insets.top}>
      <Title>Loja do Hábito</Title>
      <Subtitle>
        As moedas mostradas aqui pertencem só ao hábito selecionado — cada hábito tem seu próprio saldo, não
        existe uma carteira única da conta.
      </Subtitle>

      <BuyCard>
        <IconWrapper>
          <MaterialCommunityIcons name="shield-alert" size={32} color={theme.primaryColor} />
        </IconWrapper>
        <CardTitle>Comprar Bloqueio (Escudo)</CardTitle>
        <CardText>
          Custa 1500 moedas deste hábito. Use o escudo ao desistir de uma tarefa para não perder sua
          ofensiva. Limite de um escudo por dia por hábito.
        </CardText>

        <FormGroup>
          <Label>Para qual hábito deseja aplicar o escudo?</Label>
          <SelectField onPress={() => setPickerAberto(true)}>
            <SelectFieldText $placeholder={!habitoSelecionado}>
              {habitoSelecionado
                ? `${habitoSelecionado.titulo} (Moedas: ${habitoSelecionado.moedas_locais})`
                : 'Selecione um hábito...'}
            </SelectFieldText>
          </SelectField>
        </FormGroup>

        <BuyButton onPress={handleBuyShield}>
          <BuyButtonText>Comprar (1500 🪙)</BuyButtonText>
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
            {inventarioHabits.map((h) => (
              <InventoryItem key={h.id}>
                <ItemInfo>
                  <ItemTitle>{h.titulo}</ItemTitle>
                  <ItemSubtitle>Saldo: {h.moedas_locais || 0} moedas</ItemSubtitle>
                </ItemInfo>
                <ItemCount>
                  <ItemCountText>{h.bloqueios_acumulados || 0}</ItemCountText>
                  <MaterialCommunityIcons name="shield-check" size={20} color={theme.primaryColor} />
                </ItemCount>
              </InventoryItem>
            ))}
          </InventoryList>
        )}
      </InventorySection>

      <Modal visible={pickerAberto} transparent animationType="fade" onRequestClose={() => setPickerAberto(false)}>
        <PickerOverlay onPress={() => setPickerAberto(false)}>
          <PickerSheet>
            {activeHabits.map((h) => (
              <PickerOption
                key={h.id}
                onPress={() => {
                  setSelectedHabitId(h.id);
                  setPickerAberto(false);
                }}
              >
                <PickerOptionText>
                  {h.titulo} (Moedas: {h.moedas_locais})
                </PickerOptionText>
              </PickerOption>
            ))}
          </PickerSheet>
        </PickerOverlay>
      </Modal>
    </StoreContainer>
  );
};

export default Store;
