import { useEffect, useState } from 'react';
import { Modal, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { useI18n } from '@/contexts/LanguageContext';
import { useFloat, usePulse } from '@/hooks/useFloat';
import { isDiaProgramado, ocorrenciaAtiva } from '@/utils/ocorrencias';
import { STATUS_HABITO } from '@/model/Status';
import { unidadeDoHabito, getAvatarExpression, tempoRestante } from '@/pages/Home/domain';
import { TarefaResumo } from './TarefaResumo';
import { TarefaLinhaDe } from './TarefaLinhaDe';
import { AvatarImage } from './AvatarImage';
import {
  HabitSlide,
  SlideInner,
  HabitCard,
  CardSubtitle,
  GatilhoText,
  TarefaBloco,
  ExpandirButton,
  ExpandirTexto,
  BottomSheetOverlay,
  BottomSheet,
  BottomSheetTitulo,
  MenuOption,
  MenuOptionText,
  UrgentBadge,
  UrgentBadgeText,
  ShadowBlur,
  ContadorWrapper,
  ContadorTexto,
  MenuButton,
} from '@/pages/Home/styles';

const INTERVALO_RELOGIO_MS = 60000;

export function HabitCardSlide({ habit, width, menuAberto, onAbrirMenu, onFecharMenu, onEditar, onArquivar }) {
  const theme = useTheme();
  const { t } = useI18n();

  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), INTERVALO_RELOGIO_MS);
    return () => clearInterval(id);
  }, []);

  const restante = tempoRestante(habit, agora, t);
  const expression = getAvatarExpression(habit, agora);
  const completed = habit.status === STATUS_HABITO.COMPLETED;
  const urgent = expression === 'preocupado' || expression === 'desesperado';
  const folga = !completed && !isDiaProgramado(habit.frequencia_semanal, agora);
  const pulso = usePulse();
  const badgeFlutuando = useFloat(3000, 8);
  const [tarefasModalAberto, setTarefasModalAberto] = useState(false);
  const temMaisDeUma = (habit.ocorrencias?.length || 0) > 1;
  const ocorrenciaParaResumo = temMaisDeUma ? ocorrenciaAtiva(habit) : habit.ocorrencias?.[0];
  const unidade = unidadeDoHabito(habit, t);

  return (
    <HabitSlide $width={width}>
      <SlideInner>
        <HabitCard $completed={completed} $urgent={urgent} style={urgent && !completed ? pulso : undefined}>
          <MenuButton onPress={() => onAbrirMenu(habit.id)} accessibilityLabel={t('home.maisOpcoesPara', { titulo: habit.titulo })}>
            <Feather name="more-vertical" size={18} color={completed ? 'rgba(255,255,255,0.85)' : theme.textSecondary} />
          </MenuButton>
          <CardSubtitle $completed={completed} $urgent={urgent}>
            {completed
              ? t('home.concluidoHoje')
              : folga
                ? t('home.folgaProgramada')
                : urgent
                  ? t('home.atencao')
                  : t('home.suaTarefa')}
          </CardSubtitle>
          {habit.gatilho_ancora ? <GatilhoText $completed={completed}>⚓ {habit.gatilho_ancora}</GatilhoText> : null}
          {ocorrenciaParaResumo ? (
            <TarefaBloco>
              <TarefaResumo
                ocorrencia={ocorrenciaParaResumo}
                rotulo={temMaisDeUma ? t('home.proximaTarefa') : null}
                completed={completed}
                theme={theme}
                unidade={unidade}
              />
              {temMaisDeUma ? (
                <ExpandirButton onPress={() => setTarefasModalAberto(true)}>
                  <ExpandirTexto $completed={completed}>{t('home.verTodasTarefas')}</ExpandirTexto>
                  <Feather name="chevron-down" size={13} color={completed ? 'rgba(255,255,255,0.85)' : theme.primaryColor} />
                </ExpandirButton>
              ) : null}
            </TarefaBloco>
          ) : null}
        </HabitCard>
        {expression === 'preocupado' && (
          <UrgentBadge style={badgeFlutuando}>
            <UrgentBadgeText>{t('home.horaChegando')}</UrgentBadgeText>
          </UrgentBadge>
        )}
        {expression === 'desesperado' && (
          <UrgentBadge style={badgeFlutuando}>
            <UrgentBadgeText>{t('home.facaAgora')}</UrgentBadgeText>
          </UrgentBadge>
        )}
        <AvatarImage habit={habit} expression={expression} />
        {restante ? (
          <ContadorWrapper>
            <Feather
              name={restante.atrasado ? 'alert-circle' : restante.programada ? 'calendar' : 'clock'}
              size={14}
              color={restante.atrasado ? theme.dangerColor : theme.textSecondary}
            />
            <ContadorTexto $atrasado={restante.atrasado}>{restante.texto}</ContadorTexto>
          </ContadorWrapper>
        ) : null}
        <ShadowBlur />
      </SlideInner>

      <Modal visible={tarefasModalAberto} transparent animationType="fade" onRequestClose={() => setTarefasModalAberto(false)}>
        <BottomSheetOverlay onPress={() => setTarefasModalAberto(false)}>
          <BottomSheet onStartShouldSetResponder={() => true}>
            <BottomSheetTitulo>{t('home.tarefasDoDia')}</BottomSheetTitulo>
            <ScrollView>
              {habit.ocorrencias?.map((ocorrencia, i) => (
                <TarefaLinhaDe
                  key={i}
                  ocorrencia={ocorrencia}
                  rotulo={t('home.tarefaN', { n: i + 1 })}
                  theme={theme}
                  unidade={unidade}
                />
              ))}
            </ScrollView>
          </BottomSheet>
        </BottomSheetOverlay>
      </Modal>

      <Modal visible={menuAberto} transparent animationType="fade" onRequestClose={onFecharMenu}>
        <BottomSheetOverlay onPress={onFecharMenu}>
          <BottomSheet onStartShouldSetResponder={() => true}>
            <BottomSheetTitulo numberOfLines={1}>{habit.titulo}</BottomSheetTitulo>
            <MenuOption
              onPress={() => {
                onFecharMenu();
                onEditar(habit);
              }}
            >
              <Feather name="edit-3" size={18} color={theme.textPrimary} />
              <MenuOptionText>{t('comum.editar')}</MenuOptionText>
            </MenuOption>
            <MenuOption
              onPress={() => {
                onFecharMenu();
                onArquivar(habit);
              }}
            >
              <Feather name="archive" size={18} color={theme.dangerColor} />
              <MenuOptionText $danger>{t('comum.arquivar')}</MenuOptionText>
            </MenuOption>
          </BottomSheet>
        </BottomSheetOverlay>
      </Modal>
    </HabitSlide>
  );
}
