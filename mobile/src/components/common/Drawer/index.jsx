import { Modal } from 'react-native';
import { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { useI18n } from '../../../contexts/LanguageContext';
import { Backdrop, Panel, PanelHeader, PanelTitle, CloseButton, PanelBody } from './styles';

/**
 * Gaveta lateral. O conteúdo entra como children — quem abre decide o que vai
 * dentro (menu do perfil, inventário da loja), a gaveta só cuida do painel, do
 * fundo escurecido e do fechar.
 */
export function Drawer({ visible, onClose, titulo, children }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Backdrop onPress={onClose} accessibilityLabel={t('comum.fechar')} />
      <Panel entering={SlideInRight.duration(220)} exiting={SlideOutRight.duration(180)} style={{ paddingTop: insets.top }}>
        <PanelHeader>
          <PanelTitle>{titulo}</PanelTitle>
          <CloseButton onPress={onClose} accessibilityLabel={t('comum.fechar')}>
            <Feather name="x" size={20} color={theme.textPrimary} />
          </CloseButton>
        </PanelHeader>
        <PanelBody>{children}</PanelBody>
      </Panel>
    </Modal>
  );
}

export default Drawer;
