import { Modal, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { Overlay, Sheet, Titulo, Option, OptionText } from './styles';

/**
 * PLANO_REESTRUTURACAO.md, A.2 — substitui as 3 cópias de
 * PickerOverlay+PickerSheet+PickerOption (Store, Stats, Profile) e o padrão
 * ad-hoc que a Home usava pros popups de tarefas/opções do hábito. Quem abre
 * decide o conteúdo (children); quando não passa children, usa `opcoes` para
 * a lista mais comum (rótulo + valor selecionado).
 */
export function BottomSheet({ visible, onClose, titulo, children, opcoes, valorAtual, onEscolher }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Overlay onPress={onClose}>
        <Sheet onStartShouldSetResponder={() => true}>
          {titulo ? <Titulo>{titulo}</Titulo> : null}
          {children ? (
            children
          ) : (
            <ScrollView>
              {(opcoes || []).map((opcao) => (
                <PickerOptionRow
                  key={opcao.value}
                  opcao={opcao}
                  ativo={opcao.value === valorAtual}
                  onPress={() => onEscolher?.(opcao.value)}
                />
              ))}
            </ScrollView>
          )}
        </Sheet>
      </Overlay>
    </Modal>
  );
}

function PickerOptionRow({ opcao, ativo, onPress }) {
  const theme = useTheme();
  return (
    <Option onPress={onPress}>
      <OptionText $active={ativo}>{opcao.label}</OptionText>
      {ativo ? <Feather name="check" size={18} color={theme.primaryColor} /> : null}
    </Option>
  );
}

export default BottomSheet;
