import { useState, useEffect, useRef } from 'react';
import { Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { useI18n } from '../../../contexts/LanguageContext';
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
const RE_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

function TimePickerField({ value, onChange, placeholder, error, limpavel = false, accessibilityLabel }) {
  const theme = useTheme();
  const { t } = useI18n();
  const [aberto, setAberto] = useState(false);
  const [hora, setHora] = useState('08');
  const [minuto, setMinuto] = useState('00');
  const scrollHoras = useRef(null);
  const scrollMinutos = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    const [h, m] = RE_HORA.test(value || '') ? value.split(':') : ['08', '00'];
    setHora(h);
    setMinuto(m);
    const timer = setTimeout(() => {
      scrollHoras.current?.scrollTo({ y: Math.max(0, (Number(h) - 2) * ALTURA_CELULA), animated: false });
      scrollMinutos.current?.scrollTo({ y: Math.max(0, (Number(m) - 2) * ALTURA_CELULA), animated: false });
    }, 50);
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
        <Overlay onPress={() => setAberto(false)}>
          <Sheet onStartShouldSetResponder={() => true}>
            <SheetTitle>{t('comum.escolhaHorario')}</SheetTitle>
            <Preview>
              {hora}:{minuto}
            </Preview>

            <ColumnsRow>
              <Column>
                <ColumnLabel>{t('comum.hora')}</ColumnLabel>
                <ColumnScroll ref={scrollHoras}>
                  {HORAS.map((h) => (
                    <CellButton key={h} $active={h === hora} onPress={() => setHora(h)}>
                      <CellText $active={h === hora}>{h}</CellText>
                    </CellButton>
                  ))}
                </ColumnScroll>
              </Column>
              <Column>
                <ColumnLabel>{t('comum.minuto')}</ColumnLabel>
                <ColumnScroll ref={scrollMinutos}>
                  {MINUTOS.map((m) => (
                    <CellButton key={m} $active={m === minuto} onPress={() => setMinuto(m)}>
                      <CellText $active={m === minuto}>{m}</CellText>
                    </CellButton>
                  ))}
                </ColumnScroll>
              </Column>
            </ColumnsRow>

            <Actions>
              <CancelButton onPress={() => setAberto(false)}>
                <CancelButtonText>{t('comum.cancelar')}</CancelButtonText>
              </CancelButton>
              <ConfirmButton onPress={confirmar}>
                <ConfirmButtonText>{t('comum.confirmar')}</ConfirmButtonText>
              </ConfirmButton>
            </Actions>

            {limpavel && value ? (
              <ClearButton onPress={limpar}>
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
