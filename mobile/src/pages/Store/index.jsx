import { useState, useCallback, useRef } from 'react';
import { Modal, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { getDashboard, buyShield as apiBuyShield } from '../../services/api';
import LoadingScreen from '../../components/common/LoadingScreen';
import Drawer from '../../components/common/Drawer';
import { useToast } from '../../contexts/ToastContext';
import { useI18n } from '../../contexts/LanguageContext';
import { useThemeToggle } from '../../contexts/ThemeToggleContext';
import { useSfx } from '../../contexts/SoundContext';
import {
  StoreRoot,
  Fundo,
  Veu,
  Conteudo,
  TopBar,
  Pilula,
  PilulaValor,
  PilulaRotulo,
  EspacoArte,
  PainelCompra,
  PainelCabecalho,
  IconWrapper,
  CardTitle,
  CardText,
  FormGroup,
  Label,
  SelectField,
  SelectFieldText,
  SaldoLinha,
  SaldoRotulo,
  SaldoValor,
  BuyButton,
  BuyButtonText,
  EmptyStateContainer,
  EmptyIconWrapper,
  EmptyTitle,
  EmptyText,
  PickerOverlay,
  PickerSheet,
  PickerTitulo,
  PickerOption,
  PickerOptionText,
  PickerOptionMoedas,
  DrawerResumo,
  DrawerResumoValor,
  DrawerResumoRotulo,
  InventoryList,
  InventoryItem,
  ItemTitle,
  ItemLinha,
  ItemLinhaRotulo,
  ItemLinhaTexto,
  ItemLinhaValor,
  InventoryEmptyText,
} from './styles';

const FUNDO_LOJA_DIA = require('../../../assets/loja/loja.png');
const FUNDO_LOJA_NOITE = require('../../../assets/loja/lojanoite.png');

const Store = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { addToast } = useToast();
  const { t } = useI18n();
  const { isDark } = useThemeToggle();
  const { tocar } = useSfx();
  const fundoLoja = isDark ? FUNDO_LOJA_NOITE : FUNDO_LOJA_DIA;
  const [selectedHabitId, setSelectedHabitId] = useState('');
  const [habits, setHabits] = useState([]);
  const [custoEscudo, setCustoEscudo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pickerAberto, setPickerAberto] = useState(false);
  const [inventarioAberto, setInventarioAberto] = useState(false);
  const [comprando, setComprando] = useState(false);

  const loadHabits = useCallback(async (silencioso = false) => {
    try {
      const response = await getDashboard();
      const data = response.data.habits || response.data || [];
      if (Array.isArray(data)) {
        setHabits(data);
      }
      // O preço vem do servidor (mesmo padrão de limite_habitos_ativos): a Loja
      // nunca repete o número numa constante própria, que ficaria desatualizada
      // em silêncio na próxima mudança de preço.
      if (response.data.custo_escudo != null) {
        setCustoEscudo(response.data.custo_escudo);
      }
    } catch (error) {
      addToast(t('loja.erroCarregar'), 'error');
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
  const inventarioHabits = habits.filter((h) => h.status !== 'ARCHIVED');
  const totalEscudos = inventarioHabits.reduce((soma, h) => soma + (h.bloqueios_acumulados || 0), 0);
  const nenhumEscudoAinda = totalEscudos === 0;

  // A moeda é por hábito. Sem hábito escolhido, o topo mostra o total da carteira
  // toda; com um escolhido, mostra o saldo daquele hábito — que é o que a compra
  // vai debitar.
  const moedasExibidas = habitoSelecionado
    ? habitoSelecionado.moedas_locais || 0
    : inventarioHabits.reduce((soma, h) => soma + (h.moedas_locais || 0), 0);

  const handleBuyShield = async () => {
    if (!selectedHabitId) {
      addToast(t('loja.selecione'), 'error');
      return;
    }
    setComprando(true);
    try {
      await apiBuyShield(selectedHabitId);
      tocar('coin');
      addToast(t('loja.compraOkHabito'), 'success');
      loadHabits(true);
    } catch (error) {
      // O 422 traz a regra que barrou ("Saldo insuficiente"); o texto genérico
      // só entra quando a falha é de rede.
      addToast(error.response?.data?.message || t('loja.erroComprar'), 'error');
    } finally {
      setComprando(false);
    }
  };

  if (loading) return <LoadingScreen message={t('loja.carregando')} />;

  const inventario = (
    <Drawer
      visible={inventarioAberto}
      onClose={() => {
        tocar('close');
        setInventarioAberto(false);
      }}
      titulo={t('loja.meusEscudos')}
    >
      <DrawerResumo>
        <DrawerResumoValor>{totalEscudos}</DrawerResumoValor>
        <DrawerResumoRotulo>{t('loja.escudosNoTotal')}</DrawerResumoRotulo>
      </DrawerResumo>

      {nenhumEscudoAinda && inventarioHabits.length === 0 ? (
        <InventoryEmptyText>{t('loja.semHabito')}</InventoryEmptyText>
      ) : (
        <InventoryList>
          {inventarioHabits.map((h) => (
            <InventoryItem key={h.id}>
              <ItemTitle>{h.titulo}</ItemTitle>
              <ItemLinha>
                <ItemLinhaRotulo>
                  <Feather name="shield" size={16} color={theme.primaryColor} />
                  <ItemLinhaTexto>{t('comum.escudos')}</ItemLinhaTexto>
                </ItemLinhaRotulo>
                <ItemLinhaValor $cor={theme.primaryColor}>{h.bloqueios_acumulados || 0}</ItemLinhaValor>
              </ItemLinha>
              <ItemLinha>
                <ItemLinhaRotulo>
                  <FontAwesome5 name="coins" size={14} color={theme.warningColor} />
                  <ItemLinhaTexto>{t('comum.moedas')}</ItemLinhaTexto>
                </ItemLinhaRotulo>
                <ItemLinhaValor $cor={theme.warningColor}>{h.moedas_locais || 0}</ItemLinhaValor>
              </ItemLinha>
            </InventoryItem>
          ))}
        </InventoryList>
      )}
    </Drawer>
  );

  return (
    <StoreRoot>
      <Fundo source={fundoLoja}>
        <Veu>
          <Conteudo $insetTop={insets.top}>
            <TopBar>
              <Pilula accessibilityLabel={t('comum.moedasLocais')}>
                <FontAwesome5 name="coins" size={16} color={theme.warningColor} />
                <PilulaValor>{moedasExibidas}</PilulaValor>
                <PilulaRotulo>{t('comum.moedas')}</PilulaRotulo>
              </Pilula>

              <Pilula
                onPress={() => {
                  tocar('open');
                  setInventarioAberto(true);
                }}
                accessibilityLabel={t('loja.meusEscudos')}
              >
                <Feather name="shield" size={16} color={theme.primaryColor} />
                <PilulaValor>{totalEscudos}</PilulaValor>
                <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.75)" />
              </Pilula>
            </TopBar>

            {/* Empurra o painel para a base e deixa a ilustração respirar no meio. */}
            <EspacoArte />

            {habits.length === 0 ? (
              <EmptyStateContainer>
                <EmptyIconWrapper>
                  <MaterialCommunityIcons name="store" size={32} color="white" />
                </EmptyIconWrapper>
                <EmptyTitle>{t('loja.nadaComprar')}</EmptyTitle>
                <EmptyText>{t('loja.semHabito')}</EmptyText>
              </EmptyStateContainer>
            ) : (
              <PainelCompra>
                <PainelCabecalho>
                  <IconWrapper>
                    <MaterialCommunityIcons name="shield-plus" size={24} color={theme.primaryColor} />
                  </IconWrapper>
                  <CardTitle>{t('loja.comprarBloqueio')}</CardTitle>
                </PainelCabecalho>
                <CardText>{t('loja.escudoTexto', { custo: custoEscudo })}</CardText>

                <FormGroup>
                  <Label>{t('loja.paraQualHabito')}</Label>
                  <SelectField
                    onPress={() => {
                      tocar('open');
                      setPickerAberto(true);
                    }}
                    $aberto={pickerAberto}
                  >
                    <SelectFieldText $placeholder={!habitoSelecionado}>
                      {habitoSelecionado ? habitoSelecionado.titulo : t('loja.selecionePlaceholder')}
                    </SelectFieldText>
                    <Feather name="chevron-down" size={18} color={theme.textSecondary} />
                  </SelectField>
                </FormGroup>

                {habitoSelecionado ? (
                  <SaldoLinha>
                    <SaldoRotulo>{t('loja.saldoDoHabito')}</SaldoRotulo>
                    <SaldoValor>
                      {habitoSelecionado.moedas_locais || 0} {t('comum.moedas').toLowerCase()}
                    </SaldoValor>
                  </SaldoLinha>
                ) : null}

                <BuyButton onPress={handleBuyShield} disabled={comprando} $disabled={comprando}>
                  <Feather name="shopping-bag" size={18} color={comprando ? theme.textSecondary : 'white'} />
                  <BuyButtonText $disabled={comprando}>
                    {comprando ? t('loja.comprando') : t('loja.comprar', { custo: custoEscudo })}
                  </BuyButtonText>
                </BuyButton>
              </PainelCompra>
            )}
          </Conteudo>
        </Veu>
      </Fundo>

      {inventario}

      <Modal
        visible={pickerAberto}
        transparent
        animationType="fade"
        onRequestClose={() => {
          tocar('close');
          setPickerAberto(false);
        }}
      >
        <PickerOverlay
          onPress={() => {
            tocar('close');
            setPickerAberto(false);
          }}
        >
          <PickerSheet onStartShouldSetResponder={() => true}>
            <PickerTitulo>{t('loja.paraQualHabito')}</PickerTitulo>
            <ScrollView>
              {activeHabits.map((h) => (
                <PickerOption
                  key={h.id}
                  onPress={() => {
                    setSelectedHabitId(h.id);
                    setPickerAberto(false);
                  }}
                >
                  <PickerOptionText $active={h.id === selectedHabitId}>{h.titulo}</PickerOptionText>
                  <PickerOptionMoedas>
                    {h.moedas_locais || 0} {t('comum.moedas').toLowerCase()}
                  </PickerOptionMoedas>
                </PickerOption>
              ))}
            </ScrollView>
          </PickerSheet>
        </PickerOverlay>
      </Modal>
    </StoreRoot>
  );
};

export default Store;
