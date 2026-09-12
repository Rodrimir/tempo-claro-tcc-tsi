import { useState, useEffect } from 'react';
import { Modal, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SlideInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/LanguageContext';
import { useThemeToggle } from '../../contexts/ThemeToggleContext';
import { useToast } from '../../contexts/ToastContext';
import { updateProfile, getMe } from '../../services/api';
import { FUSOS } from './timezones';
import {
  Scrim,
  Panel,
  PanelScroll,
  IdentidadeBloco,
  Avatar,
  AvatarLetra,
  IdentidadeTexto,
  Nome,
  Email,
  FecharButton,
  SectionTitle,
  MenuRow,
  MenuIcone,
  MenuTexto,
  MenuLabel,
  MenuValor,
  Separador,
  SegmentedControl,
  LanguageChip,
  LanguageChipText,
  ThemeOptionButton,
  PickerOverlay,
  PickerSheet,
  PickerTitulo,
  PickerGroupLabel,
  PickerOption,
  PickerOptionText,
  CenterOverlay,
  DialogCard,
  DialogTitle,
  DialogText,
  DialogInput,
  DialogActions,
  DialogCancel,
  DialogCancelText,
  DialogConfirm,
  DialogConfirmText,
} from './styles';

/**
 * Perfil como gaveta lateral.
 *
 * Cada ajuste tem o seu próprio caminho, escolhido pelo peso da decisão: idioma e
 * tema resolvem na própria gaveta (um toque, reversível na hora), fuso e nome
 * abrem popup, e trocar senha abre um fluxo de tela cheia — é a única mudança que
 * precisa de confirmação de identidade antes de acontecer.
 */
const Profile = () => {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { logout, user, updateLocalUser } = useAuth();
  const { isDark, tema, setTema } = useThemeToggle();
  const { addToast } = useToast();
  const { idioma, setIdioma, idiomas, t } = useI18n();

  const [nome, setNome] = useState(user?.name || '');
  const [fusoHorario, setFusoHorario] = useState('America/Sao_Paulo');
  const [fusoAberto, setFusoAberto] = useState(false);
  const [nomeAberto, setNomeAberto] = useState(false);
  const [rascunhoNome, setRascunhoNome] = useState('');
  const [sairAberto, setSairAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    getMe()
      .then((res) => {
        if (res.data.nome) setNome(res.data.nome);
        setFusoHorario(res.data.fuso_horario || 'America/Sao_Paulo');
        if (res.data.tema) setTema(res.data.tema);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fechar = () => router.replace('/home');

  const fusoLabel = FUSOS.find((f) => f.value === fusoHorario)?.label || fusoHorario;

  // Trocar o idioma salva no servidor na hora: usu_preferencia_idioma é o que faz
  // a API devolver as frases motivacionais e o questionário de calibração no
  // idioma certo (RNF13).
  const trocarIdioma = async (codigo) => {
    if (codigo === idioma) return;
    const anterior = idioma;
    setIdioma(codigo);
    try {
      await updateProfile({ preferencia_idioma: codigo });
      updateLocalUser({ preferencia_idioma: codigo });
    } catch (err) {
      setIdioma(anterior);
      addToast(err.response?.data?.message || t('perfil.erroIdioma'), 'error');
    }
  };

  const trocarTema = async (novo) => {
    const anterior = tema;
    setTema(novo);
    try {
      await updateProfile({ tema: novo });
    } catch (err) {
      setTema(anterior);
      addToast(err.response?.data?.message || t('perfil.erroSalvar'), 'error');
    }
  };

  const salvarFuso = async (valor) => {
    const anterior = fusoHorario;
    setFusoHorario(valor);
    setFusoAberto(false);
    try {
      await updateProfile({ fuso_horario: valor });
      addToast(t('perfil.salvoOk'), 'success');
    } catch (err) {
      setFusoHorario(anterior);
      addToast(err.response?.data?.message || t('perfil.erroSalvar'), 'error');
    }
  };

  const salvarNome = async () => {
    const limpo = rascunhoNome.trim();
    if (!limpo) return;
    setSalvando(true);
    try {
      await updateProfile({ nome: limpo });
      updateLocalUser({ name: limpo });
      setNome(limpo);
      setNomeAberto(false);
      addToast(t('perfil.salvoOk'), 'success');
    } catch (err) {
      addToast(err.response?.data?.message || t('perfil.erroSalvar'), 'error');
    } finally {
      setSalvando(false);
    }
  };

  const inicial = (nome || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <View style={{ flex: 1 }}>
      <Scrim onPress={fechar} accessibilityLabel={t('comum.fechar')} />

      <Panel entering={SlideInRight.duration(220)}>
        <PanelScroll $insetTop={insets.top}>
          <IdentidadeBloco>
            <Avatar>
              <AvatarLetra>{inicial}</AvatarLetra>
            </Avatar>
            <IdentidadeTexto>
              <Nome numberOfLines={1}>{nome || t('perfil.titulo')}</Nome>
              <Email numberOfLines={1}>{user?.email}</Email>
            </IdentidadeTexto>
            <FecharButton onPress={fechar} accessibilityLabel={t('comum.fechar')}>
              <Feather name="x" size={20} color={theme.textPrimary} />
            </FecharButton>
          </IdentidadeBloco>

          <SectionTitle>{t('perfil.preferencias')}</SectionTitle>

          <MenuRow>
            <MenuIcone>
              <Feather name="globe" size={18} color={theme.primaryColor} />
            </MenuIcone>
            <MenuTexto>
              <MenuLabel>{t('perfil.idioma')}</MenuLabel>
            </MenuTexto>
            <SegmentedControl>
              {Object.entries(idiomas).map(([codigo, info]) => (
                <LanguageChip
                  key={codigo}
                  $active={idioma === codigo}
                  accessibilityLabel={info.nome}
                  onPress={() => trocarIdioma(codigo)}
                >
                  <LanguageChipText $active={idioma === codigo}>{info.bandeira}</LanguageChipText>
                  <LanguageChipText $active={idioma === codigo}>{info.curto}</LanguageChipText>
                </LanguageChip>
              ))}
            </SegmentedControl>
          </MenuRow>

          <Separador />

          <MenuRow>
            <MenuIcone>
              <Feather name={isDark ? 'moon' : 'sun'} size={18} color={theme.primaryColor} />
            </MenuIcone>
            <MenuTexto>
              <MenuLabel>{t('perfil.tema')}</MenuLabel>
            </MenuTexto>
            <SegmentedControl>
              <ThemeOptionButton
                $active={tema === 'claro'}
                accessibilityLabel={t('perfil.temaClaroLabel')}
                onPress={() => trocarTema('claro')}
              >
                <Feather name="sun" size={16} color={tema === 'claro' ? theme.primaryColor : theme.textSecondary} />
              </ThemeOptionButton>
              <ThemeOptionButton
                $active={tema === 'escuro'}
                accessibilityLabel={t('perfil.temaEscuroLabel')}
                onPress={() => trocarTema('escuro')}
              >
                <Feather name="moon" size={16} color={tema === 'escuro' ? theme.primaryColor : theme.textSecondary} />
              </ThemeOptionButton>
            </SegmentedControl>
          </MenuRow>

          <SectionTitle>{t('perfil.seusDados')}</SectionTitle>

          <MenuRow
            onPress={() => {
              setRascunhoNome(nome);
              setNomeAberto(true);
            }}
          >
            <MenuIcone>
              <Feather name="user" size={18} color={theme.primaryColor} />
            </MenuIcone>
            <MenuTexto>
              <MenuLabel>{t('perfil.nome')}</MenuLabel>
              <MenuValor numberOfLines={1}>{nome || '—'}</MenuValor>
            </MenuTexto>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </MenuRow>

          <Separador />

          <MenuRow onPress={() => setFusoAberto(true)}>
            <MenuIcone>
              <Feather name="clock" size={18} color={theme.primaryColor} />
            </MenuIcone>
            <MenuTexto>
              <MenuLabel>{t('perfil.fuso')}</MenuLabel>
              <MenuValor numberOfLines={1}>{fusoLabel}</MenuValor>
            </MenuTexto>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </MenuRow>

          <Separador />

          <MenuRow onPress={() => router.push('/change-password')}>
            <MenuIcone>
              <Feather name="lock" size={18} color={theme.primaryColor} />
            </MenuIcone>
            <MenuTexto>
              <MenuLabel>{t('perfil.trocarSenha')}</MenuLabel>
              <MenuValor>{t('perfil.trocarSenhaSub')}</MenuValor>
            </MenuTexto>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </MenuRow>

          <SectionTitle>{t('perfil.conta')}</SectionTitle>

          <MenuRow $danger onPress={() => setSairAberto(true)}>
            <MenuIcone $danger>
              <Feather name="log-out" size={18} color={theme.dangerColor} />
            </MenuIcone>
            <MenuTexto>
              <MenuLabel $danger>{t('perfil.sair')}</MenuLabel>
            </MenuTexto>
          </MenuRow>
        </PanelScroll>
      </Panel>

      <Modal visible={fusoAberto} transparent animationType="fade" onRequestClose={() => setFusoAberto(false)}>
        <PickerOverlay onPress={() => setFusoAberto(false)}>
          <PickerSheet onStartShouldSetResponder={() => true}>
            <PickerTitulo>{t('perfil.fuso')}</PickerTitulo>
            <ScrollView>
              {['brasil', 'outros'].map((grupo) => (
                <View key={grupo}>
                  <PickerGroupLabel>{t(`perfil.grupoFuso.${grupo}`)}</PickerGroupLabel>
                  {FUSOS.filter((f) => f.group === grupo).map((f) => (
                    <PickerOption key={f.value} onPress={() => salvarFuso(f.value)}>
                      <PickerOptionText $active={f.value === fusoHorario}>{f.label}</PickerOptionText>
                      {f.value === fusoHorario ? (
                        <Feather name="check" size={18} color={theme.primaryColor} />
                      ) : null}
                    </PickerOption>
                  ))}
                </View>
              ))}
            </ScrollView>
          </PickerSheet>
        </PickerOverlay>
      </Modal>

      <Modal visible={nomeAberto} transparent animationType="fade" onRequestClose={() => setNomeAberto(false)}>
        <CenterOverlay>
          <DialogCard>
            <DialogTitle>{t('perfil.nome')}</DialogTitle>
            <DialogInput
              value={rascunhoNome}
              onChangeText={setRascunhoNome}
              autoFocus
              maxLength={60}
              placeholder={t('perfil.nome')}
            />
            <DialogActions>
              <DialogCancel onPress={() => setNomeAberto(false)}>
                <DialogCancelText>{t('comum.cancelar')}</DialogCancelText>
              </DialogCancel>
              <DialogConfirm onPress={salvarNome} disabled={salvando || !rascunhoNome.trim()}>
                <DialogConfirmText>{salvando ? t('perfil.salvando') : t('comum.salvar')}</DialogConfirmText>
              </DialogConfirm>
            </DialogActions>
          </DialogCard>
        </CenterOverlay>
      </Modal>

      <Modal visible={sairAberto} transparent animationType="fade" onRequestClose={() => setSairAberto(false)}>
        <CenterOverlay>
          <DialogCard>
            <DialogTitle>{t('perfil.sair')}</DialogTitle>
            <DialogText>{t('perfil.sairConfirmacao')}</DialogText>
            <DialogActions>
              <DialogCancel onPress={() => setSairAberto(false)}>
                <DialogCancelText>{t('comum.cancelar')}</DialogCancelText>
              </DialogCancel>
              <DialogConfirm $danger onPress={logout}>
                <DialogConfirmText>{t('perfil.sairConfirmar')}</DialogConfirmText>
              </DialogConfirm>
            </DialogActions>
          </DialogCard>
        </CenterOverlay>
      </Modal>
    </View>
  );
};

export default Profile;
