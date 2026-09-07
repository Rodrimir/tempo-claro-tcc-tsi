import { useState, useEffect } from 'react';
import { Modal, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Feather } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeToggle } from '../../contexts/ThemeToggleContext';
import { useToast } from '../../contexts/ToastContext';
import { updateProfile, getMe } from '../../services/api';
import { profileSchema } from './validation';
import { FUSOS } from './timezones';
import {
  ProfileContainer,
  Title,
  FormContainer,
  SectionTitle,
  FormGroup,
  Label,
  Input,
  ErrorText,
  SelectField,
  SelectFieldText,
  SubmitButton,
  SubmitButtonText,
  LogoutButton,
  LogoutButtonText,
  SettingsRow,
  SettingsRowLabel,
  SettingsRowLabelText,
  LanguageChip,
  LanguageChipText,
  ThemeSegmentedControl,
  ThemeOptionButton,
  PickerOverlay,
  PickerSheet,
  PickerGroupLabel,
  PickerOption,
  PickerOptionText,
} from './styles';

const Profile = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { logout, user, updateLocalUser } = useAuth();
  const { isDark, tema, setTema } = useThemeToggle();
  const { addToast } = useToast();
  const [pickerAberto, setPickerAberto] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      nome: user?.name || '',
      senhaAtual: '',
      novaSenha: '',
      confirmarNovaSenha: '',
      fusoHorario: 'America/Sao_Paulo',
    },
  });

  const fusoAtual = watch('fusoHorario');
  const fusoLabel = FUSOS.find((f) => f.value === fusoAtual)?.label || fusoAtual;

  useEffect(() => {
    getMe()
      .then((res) => {
        if (res.data.nome) setValue('nome', res.data.nome);
        setValue('fusoHorario', res.data.fuso_horario || 'America/Sao_Paulo');
        if (res.data.tema) setTema(res.data.tema);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data) => {
    try {
      const trocandoSenha = Boolean(data.novaSenha);
      await updateProfile({
        nome: data.nome,
        fuso_horario: data.fusoHorario,
        tema,
        ...(trocandoSenha && {
          senha_atual: data.senhaAtual,
          nova_senha: data.novaSenha,
        }),
      });
      updateLocalUser({ name: data.nome });
      addToast(trocandoSenha ? 'Senha alterada com sucesso!' : 'Perfil atualizado com sucesso!', 'success');
      reset({ ...data, senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' });
    } catch (err) {
      const mensagem = err.response?.data?.message || 'Erro ao atualizar perfil. Verifique seus dados.';
      addToast(mensagem, 'error');
    }
  };

  return (
    <ProfileContainer $insetTop={insets.top}>
      <Title>Seu Perfil</Title>

      <FormContainer>
        <SectionTitle>Preferências do App</SectionTitle>

        <SettingsRow>
          <SettingsRowLabel>
            <Feather name="globe" size={20} color={theme.textPrimary} />
            <SettingsRowLabelText>Idioma</SettingsRowLabelText>
          </SettingsRowLabel>
          <LanguageChip>
            <LanguageChipText>🇧🇷 PT</LanguageChipText>
          </LanguageChip>
        </SettingsRow>

        <SettingsRow $last>
          <SettingsRowLabel>
            <Feather name={isDark ? 'moon' : 'sun'} size={20} color={theme.textPrimary} />
            <SettingsRowLabelText>Tema</SettingsRowLabelText>
          </SettingsRowLabel>
          <ThemeSegmentedControl>
            <ThemeOptionButton $active={tema === 'claro'} accessibilityLabel="Tema claro" onPress={() => setTema('claro')}>
              <Feather name="sun" size={16} color={tema === 'claro' ? theme.primaryColor : theme.textSecondary} />
            </ThemeOptionButton>
            <ThemeOptionButton $active={tema === 'escuro'} accessibilityLabel="Tema escuro" onPress={() => setTema('escuro')}>
              <Feather name="moon" size={16} color={tema === 'escuro' ? theme.primaryColor : theme.textSecondary} />
            </ThemeOptionButton>
            <ThemeOptionButton $active={tema === 'sistema'} accessibilityLabel="Tema do sistema" onPress={() => setTema('sistema')}>
              <Feather name="monitor" size={16} color={tema === 'sistema' ? theme.primaryColor : theme.textSecondary} />
            </ThemeOptionButton>
          </ThemeSegmentedControl>
        </SettingsRow>

        <SectionTitle style={{ marginTop: 24 }}>Seus Dados</SectionTitle>

        <FormGroup>
          <Label>Nome</Label>
          <Controller
            control={control}
            name="nome"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input value={value} onChangeText={onChange} onBlur={onBlur} />
            )}
          />
        </FormGroup>

        <FormGroup>
          <Label>Fuso Horário</Label>
          <SelectField onPress={() => setPickerAberto(true)}>
            <SelectFieldText>{fusoLabel}</SelectFieldText>
          </SelectField>
        </FormGroup>

        <FormGroup>
          <Label>Senha Atual</Label>
          <Controller
            control={control}
            name="senhaAtual"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input secureTextEntry value={value} onChangeText={onChange} onBlur={onBlur} />
            )}
          />
          {errors.senhaAtual && <ErrorText>{errors.senhaAtual.message}</ErrorText>}
        </FormGroup>

        <FormGroup>
          <Label>Nova Senha</Label>
          <Controller
            control={control}
            name="novaSenha"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input secureTextEntry value={value} onChangeText={onChange} onBlur={onBlur} />
            )}
          />
          {errors.novaSenha && <ErrorText>{errors.novaSenha.message}</ErrorText>}
        </FormGroup>

        <FormGroup>
          <Label>Confirmar Nova Senha</Label>
          <Controller
            control={control}
            name="confirmarNovaSenha"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input secureTextEntry value={value} onChangeText={onChange} onBlur={onBlur} />
            )}
          />
          {errors.confirmarNovaSenha && <ErrorText>{errors.confirmarNovaSenha.message}</ErrorText>}
        </FormGroup>

        <SubmitButton disabled={isSubmitting} onPress={handleSubmit(onSubmit)}>
          <SubmitButtonText>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</SubmitButtonText>
        </SubmitButton>
      </FormContainer>

      <LogoutButton onPress={logout} accessibilityLabel="Sair da sua conta">
        <LogoutButtonText>Sair do Aplicativo</LogoutButtonText>
      </LogoutButton>

      <Modal visible={pickerAberto} transparent animationType="fade" onRequestClose={() => setPickerAberto(false)}>
        <PickerOverlay onPress={() => setPickerAberto(false)}>
          <PickerSheet>
            <ScrollView>
              {['Brasil', 'Outros'].map((grupo) => (
                <View key={grupo}>
                  <PickerGroupLabel>{grupo}</PickerGroupLabel>
                  {FUSOS.filter((f) => f.group === grupo).map((f) => (
                    <PickerOption
                      key={f.value}
                      onPress={() => {
                        setValue('fusoHorario', f.value);
                        setPickerAberto(false);
                      }}
                    >
                      <PickerOptionText>{f.label}</PickerOptionText>
                    </PickerOption>
                  ))}
                </View>
              ))}
            </ScrollView>
          </PickerSheet>
        </PickerOverlay>
      </Modal>
    </ProfileContainer>
  );
};

export default Profile;
