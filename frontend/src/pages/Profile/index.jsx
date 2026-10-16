import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { SlideInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/LanguageContext';
import { useThemeToggle } from '@/contexts/ThemeToggleContext';
import { useToast } from '@/contexts/ToastContext';
import { useSfx } from '@/contexts/SoundContext';
import { updateProfile, getMe } from '@/services/api';
import { FUSOS, rotuloDoFuso } from '@/model/Fusos';
import { cancelarTodas, solicitarPermissao } from '@/services/notificacoes';
import Dialogo, { BotaoDoDialogo, TextoDoBotao, TextoDoDialogo } from '@/components/common/Dialogo';
import { NOME_MAX_LENGTH } from '@/model/Habito';
import { getApiErrorMessage } from '@/utils/erros';
import { confirmacaoDeExclusaoValida } from '@/utils/exclusao';
import { criarAtualizadorOtimista } from './atualizacaoOtimista';
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
  MenuValorDinamico,
  Separador,
  SegmentedControl,
  LanguageChip,
  LanguageChipText,
  ThemeOptionButton,
  PickerGroupLabel,
  PickerOption,
  PickerOptionText,
  DialogInput,
} from './styles';

const Profile = () => {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { logout, excluirMinhaConta, user, updateLocalUser } = useAuth();
  const { isDark, tema, setTema } = useThemeToggle();
  const { mudo, setMudo, tocar } = useSfx();
  const { addToast } = useToast();
  const { idioma, setIdioma, idiomas, t } = useI18n();

  const [nome, setNome] = useState(user?.name || '');
  const [fusoHorario, setFusoHorario] = useState('America/Sao_Paulo');
  const [fusoAberto, setFusoAberto] = useState(false);
  const [nomeAberto, setNomeAberto] = useState(false);
  const [rascunhoNome, setRascunhoNome] = useState('');
  const [sairAberto, setSairAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [fusoPendente, setFusoPendente] = useState(user?.fuso_pendente || null);
  const [fusoVigenteEm, setFusoVigenteEm] = useState(user?.fuso_vigente_em || null);
  const [lembretes, setLembretes] = useState(user?.notificacoes_ativas !== false);
  const [excluirAberto, setExcluirAberto] = useState(false);
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  const aplicarPerfil = (perfil) => {
    if (perfil.nome) setNome(perfil.nome);
    setFusoHorario(perfil.fuso_horario || 'America/Sao_Paulo');
    setFusoPendente(perfil.fuso_pendente || null);
    setFusoVigenteEm(perfil.fuso_vigente_em || null);
    if (typeof perfil.notificacoes_ativas === 'boolean') setLembretes(perfil.notificacoes_ativas);
  };

  useEffect(() => {
    getMe()
      .then((res) => {
        aplicarPerfil(res.data);
        if (res.data.tema) setTema(res.data.tema);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fechar = () => router.replace('/home');

  const fusoLabel = rotuloDoFuso(fusoHorario, idioma);
  const palavraDeExclusao = t('perfil.palavraExcluir');
  const exclusaoConfirmada = confirmacaoDeExclusaoValida(confirmacaoExclusao, palavraDeExclusao);
  const horaDaTrocaDeFuso = fusoVigenteEm
    ? new Intl.DateTimeFormat(idioma, { timeZone: fusoHorario, hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }).format(new Date(fusoVigenteEm))
    : null;

  const atualizarComRollback = criarAtualizadorOtimista(addToast);

  const trocarIdioma = (codigo) => {
    if (codigo === idioma) return;
    atualizarComRollback({
      valorAtual: idioma,
      valorNovo: codigo,
      setter: setIdioma,
      chamadaApi: () => updateProfile({ preferencia_idioma: codigo }),
      aoSucesso: () => updateLocalUser({ preferencia_idioma: codigo }),
      mensagemErroPadrao: t('perfil.erroIdioma'),
    });
  };

  const trocarTema = (novo) => {
    atualizarComRollback({
      valorAtual: tema,
      valorNovo: novo,
      setter: setTema,
      chamadaApi: () => updateProfile({ tema: novo }),
      aoSucesso: () => updateLocalUser({ tema: novo }),
      mensagemErroPadrao: t('perfil.erroSalvar'),
    });
  };

  // A troca de fuso só vale à meia-noite seguinte do fuso atual: o dia em andamento termina no
  // fuso em que começou. O perfil volta do servidor com a troca pendente e o horário em que vale.
  const salvarFuso = async (valor) => {
    setFusoAberto(false);
    try {
      await updateProfile({ fuso_horario: valor });
      const { data } = await getMe();
      aplicarPerfil(data);
      updateLocalUser({
        fuso_horario: data.fuso_horario,
        fuso_pendente: data.fuso_pendente || null,
        fuso_vigente_em: data.fuso_vigente_em || null,
      });
      addToast(t(data.fuso_pendente ? 'perfil.fusoAgendado' : 'perfil.salvoOk'), 'success');
    } catch (err) {
      addToast(getApiErrorMessage(err, t('perfil.erroSalvar')), 'error');
    }
  };

  const trocarSom = (ligado) => {
    setMudo(!ligado);
    updateProfile({ som_ativo: ligado })
      .then(() => updateLocalUser({ som_ativo: ligado }))
      .catch(() => {});
  };

  const trocarLembretes = async (ligar) => {
    if (ligar === lembretes) return;
    if (ligar) {
      const concedida = await solicitarPermissao(idioma).catch(() => false);
      if (!concedida) {
        addToast(t('perfil.lembretesSemPermissao'), 'error');
        return;
      }
    } else {
      await cancelarTodas().catch(() => {});
    }
    atualizarComRollback({
      valorAtual: lembretes,
      valorNovo: ligar,
      setter: setLembretes,
      chamadaApi: () => updateProfile({ notificacoes_ativas: ligar }),
      aoSucesso: () => updateLocalUser({ notificacoes_ativas: ligar }),
      mensagemErroPadrao: t('perfil.erroSalvar'),
    });
  };

  const confirmarExclusao = async () => {
    if (!exclusaoConfirmada || excluindo) return;
    setExcluindo(true);
    try {
      await excluirMinhaConta(confirmacaoExclusao.trim());
      setExcluirAberto(false);
      addToast(t('perfil.contaExcluida'), 'success');
      router.replace('/login');
    } catch (err) {
      addToast(getApiErrorMessage(err, t('perfil.erroExcluirConta')), 'error');
      setExcluindo(false);
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
      addToast(getApiErrorMessage(err, t('perfil.erroSalvar')), 'error');
    } finally {
      setSalvando(false);
    }
  };

  const inicial = (nome || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <View style={{ flex: 1 }}>
      <Scrim accessibilityRole="button" onPress={fechar} accessibilityLabel={t('comum.fechar')} />

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
            <FecharButton accessibilityRole="button" onPress={fechar} accessibilityLabel={t('comum.fechar')}>
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
                  accessibilityRole="radio"
                  accessibilityState={{ selected: idioma === codigo }}
                  key={codigo}
                  $active={idioma === codigo}
                  accessibilityLabel={info.nome}
                  onPress={() => {
                    tocar('alternar');
                    trocarIdioma(codigo);
                  }}
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
                accessibilityRole="radio"
                accessibilityState={{ selected: tema === 'claro' }}
                $active={tema === 'claro'}
                accessibilityLabel={t('perfil.temaClaroLabel')}
                onPress={() => {
                  tocar('alternar');
                  trocarTema('claro');
                }}
              >
                <Feather name="sun" size={16} color={tema === 'claro' ? theme.primaryColor : theme.textSecondary} />
              </ThemeOptionButton>
              <ThemeOptionButton
                accessibilityRole="radio"
                accessibilityState={{ selected: tema === 'escuro' }}
                $active={tema === 'escuro'}
                accessibilityLabel={t('perfil.temaEscuroLabel')}
                onPress={() => {
                  tocar('alternar');
                  trocarTema('escuro');
                }}
              >
                <Feather name="moon" size={16} color={tema === 'escuro' ? theme.primaryColor : theme.textSecondary} />
              </ThemeOptionButton>
              <ThemeOptionButton
                accessibilityRole="radio"
                accessibilityState={{ selected: tema === 'dinamico' }}
                $active={tema === 'dinamico'}
                accessibilityLabel={t('perfil.temaDinamicoLabel')}
                onPress={() => {
                  tocar('alternar');
                  trocarTema('dinamico');
                }}
              >
                <Feather name="clock" size={16} color={tema === 'dinamico' ? theme.primaryColor : theme.textSecondary} />
              </ThemeOptionButton>
            </SegmentedControl>
          </MenuRow>
          {tema === 'dinamico' ? <MenuValorDinamico>{t('perfil.temaDinamicoExplicacao')}</MenuValorDinamico> : null}

          <Separador />

          <MenuRow>
            <MenuIcone>
              <Feather name={mudo ? 'volume-x' : 'volume-2'} size={18} color={theme.primaryColor} />
            </MenuIcone>
            <MenuTexto>
              <MenuLabel>{t('perfil.som')}</MenuLabel>
            </MenuTexto>
            <SegmentedControl>
              <ThemeOptionButton
                accessibilityRole="radio"
                accessibilityState={{ selected: !mudo }}
                $active={!mudo}
                accessibilityLabel={t('perfil.somLigadoLabel')}
                onPress={() => {
                  trocarSom(true);
                  tocar('alternar');
                }}
              >
                <Feather name="volume-2" size={16} color={!mudo ? theme.primaryColor : theme.textSecondary} />
              </ThemeOptionButton>
              <ThemeOptionButton
                accessibilityRole="radio"
                accessibilityState={{ selected: mudo }}
                $active={mudo}
                accessibilityLabel={t('perfil.somMudoLabel')}
                onPress={() => trocarSom(false)}
              >
                <Feather name="volume-x" size={16} color={mudo ? theme.primaryColor : theme.textSecondary} />
              </ThemeOptionButton>
            </SegmentedControl>
          </MenuRow>

          <Separador />

          <MenuRow>
            <MenuIcone>
              <Feather name={lembretes ? 'bell' : 'bell-off'} size={18} color={theme.primaryColor} />
            </MenuIcone>
            <MenuTexto>
              <MenuLabel>{t('perfil.lembretes')}</MenuLabel>
            </MenuTexto>
            <SegmentedControl>
              <ThemeOptionButton
                accessibilityRole="radio"
                accessibilityState={{ selected: lembretes }}
                $active={lembretes}
                accessibilityLabel={t('perfil.lembretesLigadosLabel')}
                onPress={() => {
                  tocar('alternar');
                  trocarLembretes(true);
                }}
              >
                <Feather name="bell" size={16} color={lembretes ? theme.primaryColor : theme.textSecondary} />
              </ThemeOptionButton>
              <ThemeOptionButton
                accessibilityRole="radio"
                accessibilityState={{ selected: !lembretes }}
                $active={!lembretes}
                accessibilityLabel={t('perfil.lembretesDesligadosLabel')}
                onPress={() => {
                  tocar('alternar');
                  trocarLembretes(false);
                }}
              >
                <Feather name="bell-off" size={16} color={!lembretes ? theme.primaryColor : theme.textSecondary} />
              </ThemeOptionButton>
            </SegmentedControl>
          </MenuRow>

          <SectionTitle>{t('perfil.seusDados')}</SectionTitle>

          <MenuRow
            accessibilityRole="button"
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

          <MenuRow accessibilityRole="button" onPress={() => setFusoAberto(true)}>
            <MenuIcone>
              <Feather name="clock" size={18} color={theme.primaryColor} />
            </MenuIcone>
            <MenuTexto>
              <MenuLabel>{t('perfil.fuso')}</MenuLabel>
              <MenuValor numberOfLines={1}>{fusoLabel}</MenuValor>
              {fusoPendente ? (
                <MenuValor numberOfLines={2}>
                  {t('perfil.fusoPendente', { fuso: rotuloDoFuso(fusoPendente, idioma), quando: horaDaTrocaDeFuso })}
                </MenuValor>
              ) : null}
            </MenuTexto>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </MenuRow>

          <Separador />

          <MenuRow accessibilityRole="button" onPress={() => router.push('/change-password')}>
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

          <MenuRow accessibilityRole="button" $danger onPress={() => setSairAberto(true)}>
            <MenuIcone $danger>
              <Feather name="log-out" size={18} color={theme.dangerColor} />
            </MenuIcone>
            <MenuTexto>
              <MenuLabel $danger>{t('perfil.sair')}</MenuLabel>
            </MenuTexto>
          </MenuRow>

          <Separador />

          <MenuRow
            accessibilityRole="button"
            $danger
            onPress={() => {
              setConfirmacaoExclusao('');
              setExcluirAberto(true);
            }}
          >
            <MenuIcone $danger>
              <Feather name="trash-2" size={18} color={theme.dangerColor} />
            </MenuIcone>
            <MenuTexto>
              <MenuLabel $danger>{t('perfil.excluirConta')}</MenuLabel>
              <MenuValor>{t('perfil.excluirContaSub')}</MenuValor>
            </MenuTexto>
          </MenuRow>
        </PanelScroll>
      </Panel>

      <Dialogo
        visible={fusoAberto}
        variante="folha"
        onClose={() => setFusoAberto(false)}
        titulo={t('perfil.fuso')}
        accessibilityLabel={t('comum.fechar')}
      >
        <TextoDoDialogo>{t('perfil.fusoExplicacao')}</TextoDoDialogo>
        {['brasil', 'americaDoNorte'].map((grupo) => (
          <View key={grupo}>
            <PickerGroupLabel>{t(`perfil.grupoFuso.${grupo}`)}</PickerGroupLabel>
            {FUSOS.filter((f) => f.grupo === grupo).map((f) => {
              const escolhido = f.value === (fusoPendente || fusoHorario);
              return (
                <PickerOption
                  accessibilityRole="radio"
                  accessibilityState={{ selected: escolhido }}
                  key={f.value}
                  onPress={() => salvarFuso(f.value)}
                >
                  <PickerOptionText $active={escolhido}>{rotuloDoFuso(f.value, idioma)}</PickerOptionText>
                  {escolhido ? <Feather name="check" size={18} color={theme.primaryColor} /> : null}
                </PickerOption>
              );
            })}
          </View>
        ))}
      </Dialogo>

      <Dialogo
        visible={nomeAberto}
        onClose={() => setNomeAberto(false)}
        titulo={t('perfil.nome')}
        accessibilityLabel={t('comum.fechar')}
        acoes={
          <>
            <BotaoDoDialogo accessibilityRole="button" onPress={() => setNomeAberto(false)}>
              <TextoDoBotao>{t('comum.cancelar')}</TextoDoBotao>
            </BotaoDoDialogo>
            <BotaoDoDialogo
              $tipo="primario"
              accessibilityRole="button"
              accessibilityState={{ disabled: salvando || !rascunhoNome.trim() }}
              onPress={salvarNome}
              disabled={salvando || !rascunhoNome.trim()}
            >
              <TextoDoBotao $tipo="primario">{salvando ? t('perfil.salvando') : t('comum.salvar')}</TextoDoBotao>
            </BotaoDoDialogo>
          </>
        }
      >
        <DialogInput
          value={rascunhoNome}
          onChangeText={setRascunhoNome}
          autoFocus
          maxLength={NOME_MAX_LENGTH}
          placeholder={t('perfil.nome')}
          accessibilityLabel={t('perfil.nome')}
          style={{ marginBottom: 0 }}
        />
      </Dialogo>

      <Dialogo
        visible={sairAberto}
        onClose={() => setSairAberto(false)}
        titulo={t('perfil.sair')}
        accessibilityLabel={t('comum.fechar')}
        acoes={
          <>
            <BotaoDoDialogo accessibilityRole="button" onPress={() => setSairAberto(false)}>
              <TextoDoBotao>{t('comum.cancelar')}</TextoDoBotao>
            </BotaoDoDialogo>
            <BotaoDoDialogo $tipo="perigo" accessibilityRole="button" onPress={logout}>
              <TextoDoBotao $tipo="perigo">{t('perfil.sairConfirmar')}</TextoDoBotao>
            </BotaoDoDialogo>
          </>
        }
      >
        <TextoDoDialogo>{t('perfil.sairConfirmacao')}</TextoDoDialogo>
      </Dialogo>

      <Dialogo
        visible={excluirAberto}
        onClose={excluindo ? undefined : () => setExcluirAberto(false)}
        titulo={t('perfil.excluirContaTitulo')}
        accessibilityLabel={t('comum.fechar')}
        acoes={
          <>
            <BotaoDoDialogo
              accessibilityRole="button"
              disabled={excluindo}
              onPress={() => setExcluirAberto(false)}
            >
              <TextoDoBotao>{t('comum.cancelar')}</TextoDoBotao>
            </BotaoDoDialogo>
            <BotaoDoDialogo
              $tipo="perigo"
              accessibilityRole="button"
              accessibilityState={{ disabled: !exclusaoConfirmada || excluindo, busy: excluindo }}
              disabled={!exclusaoConfirmada || excluindo}
              onPress={confirmarExclusao}
            >
              <TextoDoBotao $tipo="perigo">{excluindo ? t('perfil.excluindoConta') : t('perfil.excluirContaConfirmar')}</TextoDoBotao>
            </BotaoDoDialogo>
          </>
        }
      >
        <TextoDoDialogo>{t('perfil.excluirContaTexto')}</TextoDoDialogo>
        <TextoDoDialogo style={{ marginTop: 12 }}>{t('perfil.excluirContaDigite', { palavra: palavraDeExclusao })}</TextoDoDialogo>
        <DialogInput
          value={confirmacaoExclusao}
          onChangeText={setConfirmacaoExclusao}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={palavraDeExclusao}
          accessibilityLabel={t('perfil.excluirContaDigite', { palavra: palavraDeExclusao })}
          style={{ marginTop: 12, marginBottom: 0 }}
        />
      </Dialogo>
    </View>
  );
};

export default Profile;
