import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeToggle } from '../../contexts/ThemeToggleContext';
import { useToast } from '../../contexts/ToastContext';
import { updateProfile } from '../../services/api';
import { Shield, ShieldAlert, Moon, Sun, Globe } from 'lucide-react';
import {
  ProfileContainer,
  Title,
  BannerText,
  BannerAction,
  FormContainer,
  SectionTitle,
  FormGroup,
  Label,
  Input,
  Select,
  SubmitButton,
  LogoutButton,
  ModalText,
  ModalSelect,
  ModalBuyButton,
  ModalCancelButton,
  SettingsRow,
  ToggleSwitch
} from './styles';

// @audit-ok [Perfil (1) — tela de dados do usuário: nome, fuso horário, tema e troca de senha]

const Profile = () => {
  const { logout, user, updateLocalUser } = useAuth();
  const { isDark, toggleTheme } = useThemeToggle();
  const { addToast } = useToast();

  // @audit-ok [Perfil (2) — estado inicial do formulário a partir do usuário autenticado]
  // Antes o nome vinha fixo como 'Usuário'. Agora usa o dado que o backend devolve
  // em AuthResponseDTO.user no login, persistido pelo AuthContext.
  const [formData, setFormData] = useState({
    nome: user?.name || '',
    senhaAtual: '',
    novaSenha: '',
    fusoHorario: 'America/Sao_Paulo'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // O AuthContext resolve o usuário de forma assíncrona na verificação do token,
  // então o nome pode chegar depois desta tela montar.
  useEffect(() => {
    if (user?.name) {
      setFormData(prev => (prev.nome ? prev : { ...prev, nome: user.name }));
    }
  }, [user]);

  // @audit-ok [Perfil (3) — processa submissão do formulário de atualização]
  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // @audit-ok [Perfil (4) — monta payload incluindo senhas apenas se novaSenha foi preenchida]
      // As chaves são snake_case porque é isso que ProfileUpdateDTO declara. Antes
      // eram enviadas em camelCase (fusoHorario/senhaAtual/novaSenha): o Jackson
      // não as reconhecia, então fuso e senha nunca chegavam a ser atualizados —
      // e mesmo assim a tela exibia "Perfil atualizado com sucesso!".
      await updateProfile({
        nome: formData.nome,
        fuso_horario: formData.fusoHorario,
        ...(formData.novaSenha && {
          senha_atual: formData.senhaAtual,
          nova_senha: formData.novaSenha
        })
      });
      // @audit-ok [Perfil (15) — confirma sucesso e limpa campos de senha]
      updateLocalUser({ name: formData.nome });
      addToast('Perfil atualizado com sucesso!', 'success');
      // @audit-ok [Perfil (16) — limpa campos de senha após salvar]
      setFormData(prev => ({ ...prev, senhaAtual: '', novaSenha: '' }));
    } catch (err) {
      console.error("Erro ao atualizar perfil", err);
      addToast('Erro ao atualizar perfil. Verifique seus dados.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProfileContainer>
      <Title>Seu Perfil</Title>

      <FormContainer onSubmit={handleUpdate}>
        <SectionTitle>Preferências do App</SectionTitle>

        <SettingsRow>
          <div className="label">
            <Globe size={20} aria-hidden="true" /> Idioma
          </div>
          <div style={{ background: 'var(--primary-light)', padding: '4px 8px', borderRadius: '8px', border: '2px solid var(--primary-color)', color: 'var(--text-primary)', fontWeight: 600 }}>
            🇧🇷 PT
          </div>
        </SettingsRow>

        <SettingsRow $clickable onClick={toggleTheme} role="button" aria-label="Alternar Tema Escuro">
          <div className="label">
            {isDark ? <Moon size={20} aria-hidden="true" /> : <Sun size={20} aria-hidden="true" />}
            Tema Escuro
          </div>
          <ToggleSwitch $active={isDark}><div className="dot" /></ToggleSwitch>
        </SettingsRow>

        <div style={{ marginTop: '24px' }}></div>
        <SectionTitle>Seus Dados</SectionTitle>

        <FormGroup>
          <Label htmlFor="profile-nome">Nome</Label>
          <Input
            id="profile-nome"
            type="text"
            value={formData.nome}
            onChange={e => setFormData({ ...formData, nome: e.target.value })}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="profile-fuso">Fuso Horário</Label>
          {/* @audit-ok [Perfil — E0.5.4: o value de cada option já é o identificador
              IANA (contrato exigido pelo backend, ver ZonaUsuario.isValido). O rótulo
              amigável com abreviação (ex.: "BRT") existe só para exibição — nunca é
              enviado à API. Lista de fusos do Brasil completa (16 zonas oficiais do
              tzdata para o país), não só Brasília.] */}
          <Select
            id="profile-fuso"
            value={formData.fusoHorario}
            onChange={e => setFormData({ ...formData, fusoHorario: e.target.value })}
          >
            <optgroup label="Brasil">
              <option value="America/Noronha">Fernando de Noronha (FNT, UTC-2)</option>
              <option value="America/Belem">Belém (BRT, UTC-3)</option>
              <option value="America/Fortaleza">Fortaleza (BRT, UTC-3)</option>
              <option value="America/Recife">Recife (BRT, UTC-3)</option>
              <option value="America/Araguaina">Araguaína (BRT, UTC-3)</option>
              <option value="America/Maceio">Maceió (BRT, UTC-3)</option>
              <option value="America/Bahia">Salvador (BRT, UTC-3)</option>
              <option value="America/Sao_Paulo">Brasília (BRT, UTC-3)</option>
              <option value="America/Santarem">Santarém (AMT, UTC-4)</option>
              <option value="America/Campo_Grande">Campo Grande (AMT, UTC-4)</option>
              <option value="America/Cuiaba">Cuiabá (AMT, UTC-4)</option>
              <option value="America/Porto_Velho">Porto Velho (AMT, UTC-4)</option>
              <option value="America/Boa_Vista">Boa Vista (AMT, UTC-4)</option>
              <option value="America/Manaus">Manaus (AMT, UTC-4)</option>
              <option value="America/Eirunepe">Eirunepé (ACT, UTC-5)</option>
              <option value="America/Rio_Branco">Rio Branco (ACT, UTC-5)</option>
            </optgroup>
            <optgroup label="Outros">
              <option value="America/New_York">Nova York (EST)</option>
              <option value="Europe/London">Londres (GMT)</option>
            </optgroup>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="profile-senha-atual">Senha Atual</Label>
          <Input
            id="profile-senha-atual"
            type="password"
            value={formData.senhaAtual}
            onChange={e => setFormData({ ...formData, senhaAtual: e.target.value })}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="profile-nova-senha">Nova Senha</Label>
          <Input
            id="profile-nova-senha"
            type="password"
            value={formData.novaSenha}
            onChange={e => setFormData({ ...formData, novaSenha: e.target.value })}
          />
        </FormGroup>

        <SubmitButton type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </SubmitButton>
      </FormContainer>

      {/* @audit-ok [Logout — chama AuthContext.logout que limpa token e desmarca autenticação] */}
      <LogoutButton onClick={logout} aria-label="Sair da sua conta">
        Sair do Aplicativo
      </LogoutButton>
    </ProfileContainer>
  );
};

export default Profile;
