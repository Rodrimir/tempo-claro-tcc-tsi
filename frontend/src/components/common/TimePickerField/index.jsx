import { useState, useEffect, useRef } from 'react';
import { Modal, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { useI18n } from '@/contexts/LanguageContext';
import { RE_HORA } from '@/utils/validacao';
import {
  Field,
  FieldText,
  Overlay,
  Sheet,
  SheetTitle,
  Preview,
  ColumnsRow,
  Column,
  ColumnLabel,
  ColumnScroll,
  CellButton,
  CellText,
  Actions,
  CancelButton,
  CancelButtonText,
  ConfirmButton,
  ConfirmButtonText,
  ClearButton,
  ClearButtonText,
} from './styles';

const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTOS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

const ALTURA_CELULA = 46;
const ATRASO_SCROLL_MS = 50;
const HORA_PADRAO = '08';
const MINUTO_PADRAO = '00';

function TimePickerField({ value, onChange, placeholder, error, limpavel = false, accessibilityLabel }) {
  const theme = useTheme();
  const { t } = useI18n();
  const [aberto, setAberto] = useState(false);
  const { height: alturaDaTela, width: larguraDaTela } = useWindowDimensions();
  // As colunas encolhem em telas baixas, para o seletor inteiro caber sem cortar os botões.
  const alturaDasColunas = Math.max(140, Math.min(220, Math.round(alturaDaTela * 0.3)));
  const [hora, setHora] = useState(HORA_PADRAO);
  const [minuto, setMinuto] = useState(MINUTO_PADRAO);
  const scrollHoras = useRef(null);
  const scrollMinutos = useRef(null);

  const [aberturaAnterior, setAberturaAnterior] = useState({ aberto, value });

  if (aberto && (aberturaAnterior.aberto !== aberto || aberturaAnterior.value !== value)) {
    setAberturaAnterior({ aberto, value });
    const [h, m] = RE_HORA.test(value || '') ? value.split(':') : [HORA_PADRAO, MINUTO_PADRAO];
    setHora(h);
    setMinuto(m);
  } else if (!aberto && aberturaAnterior.aberto) {
    setAberturaAnterior({ aberto, value });
  }

  useEffect(() => {
    if (!aberto) return;
    const [h, m] = RE_HORA.test(value || '') ? value.split(':') : [HORA_PADRAO, MINUTO_PADRAO];
    const timer = setTimeout(() => {
      scrollHoras.current?.scrollTo({ y: Math.max(0, (Number(h) - 2) * ALTURA_CELULA), animated: false });
      scrollMinutos.current?.scrollTo({ y: Math.max(0, (Number(m) - 2) * ALTURA_CELULA), animated: false });
    }, ATRASO_SCROLL_MS);
    return () => clearTimeout(timer);
  }, [aberto, value]);

  const confirmar = () => {
    onChange(`${hora}:${minuto}`);
    setAberto(false);
  };

  const limpar = () => {
    onChange('');
    setAberto(false);
  };

  const vazio = !value;

  return (
    <>
      <Field
        onPress={() => setAberto(true)}
        $error={error}
        accessibilityLabel={accessibilityLabel || placeholder}
        accessibilityRole="button"
      >
        <FieldText $placeholder={vazio}>{vazio ? placeholder || '--:--' : value}</FieldText>
        <Feather name="clock" size={18} color={theme.textSecondary} />
      </Field>

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <Overlay accessibilityRole="button" accessibilityLabel={t('comum.fechar')} onPress={() => setAberto(false)}>
          <Sheet onStartShouldSetResponder={() => true} style={{ padding: larguraDaTela < 360 ? 16 : 24 }}>
            <SheetTitle>{t('comum.escolhaHorario')}</SheetTitle>
            <Preview>
              {hora}:{minuto}
            </Preview>

            <ColumnsRow style={{ height: alturaDasColunas }}>
              <Column>
                <ColumnLabel>{t('comum.hora')}</ColumnLabel>
                <ColumnScroll ref={scrollHoras}>
                  {HORAS.map((h) => (
                    <CellButton
                      accessibilityRole="radio"
                      accessibilityLabel={`${t('comum.hora')} ${h}`}
                      accessibilityState={{ selected: h === hora }}
                      key={h}
                      $active={h === hora}
                      onPress={() => setHora(h)}
                    >
                      <CellText $active={h === hora}>{h}</CellText>
                    </CellButton>
                  ))}
                </ColumnScroll>
              </Column>
              <Column>
                <ColumnLabel>{t('comum.minuto')}</ColumnLabel>
                <ColumnScroll ref={scrollMinutos}>
                  {MINUTOS.map((m) => (
                    <CellButton
                      accessibilityRole="radio"
                      accessibilityLabel={`${t('comum.minuto')} ${m}`}
                      accessibilityState={{ selected: m === minuto }}
                      key={m}
                      $active={m === minuto}
                      onPress={() => setMinuto(m)}
                    >
                      <CellText $active={m === minuto}>{m}</CellText>
                    </CellButton>
                  ))}
                </ColumnScroll>
              </Column>
            </ColumnsRow>

            <Actions>
              <CancelButton accessibilityRole="button" onPress={() => setAberto(false)}>
                <CancelButtonText>{t('comum.cancelar')}</CancelButtonText>
              </CancelButton>
              <ConfirmButton accessibilityRole="button" onPress={confirmar}>
                <ConfirmButtonText>{t('comum.confirmar')}</ConfirmButtonText>
              </ConfirmButton>
            </Actions>

            {limpavel && value ? (
              <ClearButton accessibilityRole="button" onPress={limpar}>
                <ClearButtonText>{t('comum.limparHorario')}</ClearButtonText>
              </ClearButton>
            ) : null}
          </Sheet>
        </Overlay>
      </Modal>
    </>
  );
}

export default TimePickerField;
