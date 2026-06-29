import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeToggle } from '../../contexts/ThemeToggleContext';
import { useToast } from '../../contexts/ToastContext';
import {
  updateProfile,
  getDashboard,
  archiveHabit,
  deleteAccount,
  getApiErrorMessage
} from '../../services/api';
import { Moon, Sun, Globe, Trash2, AlertTriangle } from 'lucide-react';
import {
  ProfileContainer,
  Title,
  FormContainer,
  SectionTitle,
  FormGroup,
  Label,
  Input,
  Select,
  SubmitButton,
  LogoutButton,
  SettingsRow,
  ToggleSwitch,
  DangerZone,
  DangerButton,
  StoreModalOverlay,
  StoreModalContent,
  ModalIconWrapper,
  ModalTitle,
  ModalText,
  ModalInput,
  ModalDangerButton,
  ModalCancelButton
} from './styles';

// @audit-ok [Perfil (1) — tela de dados do usuário: nome, fuso horário, tema, troca de senha, exclusão de hábito e exclusão de conta]

const Profile = () => {
  const { logout, user } = useAuth();
  const { isDark, toggleTheme } = useThemeToggle();
  const { addToast } = useToast();

  // @audit-ok [Perfil (2) — estado inicial do formulário a partir do user autenticado (name/fusoHorario)]
  const [formData, setFormData] = useState({
    nome: user?.name || '',
    senhaAtual: '',
    novaSenha: '',
    fusoHorario: user?.fusoHorario || 'America/Sao_Paulo'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // @audit-ok [Excluir Hábito (1) — lista de hábitos ativos para escolher qual arquivar]
  const [habits, setHabits] = useState([]);
  const [selectedHabitId, setSelectedHabitId] = useState('');
  const [showDeleteHabitModal, setShowDeleteHabitModal] = useState(false);
  const [isDeletingHabit, setIsDeletingHabit] = useState(false);

  // @audit-ok [Excluir Conta (1) — modal exige a senha para confirmar a exclusão irreversível]
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // @audit-ok [Perfil (2b) — sincroniza nome/fuso quando o user é hidratado após o login]
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        nome: user.name || prev.nome,
        fusoHorario: user.fusoHorario || prev.fusoHorario
      }));
    }
  }, [user]);

  // @audit-ok [Excluir Hábito (2) — carrega os hábitos ativos via GET /dashboard para popular o seletor]
  const loadHabits = async () => {
    try {
      const response = await getDashboard();
      const data = response.data?.habits || response.data || [];
      setHabits(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar hábitos no perfil', err);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  // @audit-ok [Perfil (3) — processa submissão do formulário de atualização]
  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // @audit-ok [Perfil (4) — monta payload (snake_case conforme PUT /profile) incluindo senhas apenas se novaSenha foi preenchida]
      await updateProfile({
        nome: formData.nome,
        fuso_horario: formData.fusoHorario,
        ...(formData.novaSenha && { senha_atual: formData.senhaAtual, nova_senha: formData.novaSenha })
      });
      // @audit-ok [Perfil (15) — confirma sucesso e limpa campos de senha]
      addToast('Perfil atualizado com sucesso!', 'success');
      // @audit-ok [Perfil (16) — limpa campos de senha após salvar]
      setFormData(prev => ({ ...prev, senhaAtual: '', novaSenha: '' }));
    } catch (err) {
      console.error("Erro ao atualizar perfil", err);
      addToast(getApiErrorMessage(err, 'Erro ao atualizar perfil. Verifique seus dados.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // @audit-ok [Excluir Hábito (3) — confirma e chama DELETE /habits/{id} (soft delete: arquiva e preserva o histórico)]
  const handleConfirmDeleteHabit = async () => {
    if (!selectedHabitId) return;
    setIsDeletingHabit(true);
    try {
      await archiveHabit(selectedHabitId);
      addToast('Hábito excluído com sucesso!', 'success');
      setShowDeleteHabitModal(false);
      setSelectedHabitId('');
      await loadHabits();
    } catch (err) {
      addToast(getApiErrorMessage(err, 'Erro ao excluir o hábito. Tente novamente.'), 'error');
    } finally {
      setIsDeletingHabit(false);
    }
  };

  // @audit-ok [Excluir Conta (2) — confirma com a senha e chama DELETE /profile; ao concluir, encerra a sessão]
  const handleConfirmDeleteAccount = async () => {
    if (!deleteAccountPassword) {
      addToast('Digite sua senha para confirmar.', 'error');
      return;
    }
    setIsDeletingAccount(true);
    try {
      await deleteAccount(deleteAccountPassword);
      addToast('Conta excluída. Sentiremos sua falta!', 'success');
      // @audit-ok [Excluir Conta (3) — limpa token/user e desautentica; o ProtectedRoute redireciona ao /login]
      logout();
    } catch (err) {
      addToast(getApiErrorMessage(err, 'Não foi possível excluir a conta. Verifique sua senha.'), 'error');
      setIsDeletingAccount(false);
    }
  };

  const selectedHabit = habits.find(h => h.id === selectedHabitId);

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
          <Select
            id="profile-fuso"
            value={formData.fusoHorario}
            onChange={e => setFormData({ ...formData, fusoHorario: e.target.value })}
          >
            <option value="America/Sao_Paulo">Brasília (BRT)</option>
            <option value="America/New_York">Nova York (EST)</option>
            <option value="Europe/London">Londres (GMT)</option>
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

      {/* @audit-ok [Excluir Hábito (4) — seção de gerenciamento: escolher um hábito ativo e excluí-lo] */}
      <div style={{ marginTop: '32px' }}></div>
      <SectionTitle>Gerenciar Hábitos</SectionTitle>
      <FormGroup>
        <Label htmlFor="profile-delete-habit">Excluir um hábito</Label>
        <Select
          id="profile-delete-habit"
          value={selectedHabitId}
          onChange={e => setSelectedHabitId(e.target.value)}
          disabled={habits.length === 0}
        >
          <option value="" disabled>
            {habits.length === 0 ? 'Nenhum hábito ativo' : 'Selecione um hábito...'}
          </option>
          {habits.map(h => (
            <option key={h.id} value={h.id}>{h.titulo}</option>
          ))}
        </Select>
      </FormGroup>
      <DangerButton
        type="button"
        onClick={() => setShowDeleteHabitModal(true)}
        disabled={!selectedHabitId}
        aria-label="Excluir hábito selecionado"
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <Trash2 size={18} aria-hidden="true" /> Excluir Hábito
        </span>
      </DangerButton>

      {/* @audit-ok [Logout — chama AuthContext.logout que limpa token e desmarca autenticação] */}
      <LogoutButton type="button" onClick={logout} aria-label="Sair da sua conta">
        Sair do Aplicativo
      </LogoutButton>

      {/* @audit-ok [Excluir Conta (4) — zona de perigo: exclusão definitiva da conta] */}
      <DangerZone>
        <SectionTitle>Zona de Perigo</SectionTitle>
        <ModalText style={{ marginBottom: 0 }}>
          Ao excluir sua conta, todos os seus hábitos, progresso e histórico são apagados
          permanentemente. Esta ação não pode ser desfeita.
        </ModalText>
        <DangerButton
          type="button"
          onClick={() => setShowDeleteAccountModal(true)}
          aria-label="Excluir minha conta"
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <AlertTriangle size={18} aria-hidden="true" /> Excluir Conta
          </span>
        </DangerButton>
      </DangerZone>

      {/* @audit-ok [Excluir Hábito (5) — modal de confirmação da exclusão do hábito] */}
      {showDeleteHabitModal && (
        <StoreModalOverlay role="dialog" aria-modal="true" aria-label="Confirmar exclusão de hábito">
          <StoreModalContent>
            <ModalIconWrapper style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger-color)' }}>
              <Trash2 size={28} aria-hidden="true" />
            </ModalIconWrapper>
            <ModalTitle>Excluir hábito?</ModalTitle>
            <ModalText>
              {selectedHabit ? `"${selectedHabit.titulo}" ` : 'Este hábito '}
              será removido da sua lista. Seu histórico é preservado, mas você não verá mais
              o hábito no dia a dia.
            </ModalText>
            <ModalDangerButton
              type="button"
              onClick={handleConfirmDeleteHabit}
              disabled={isDeletingHabit}
              aria-busy={isDeletingHabit}
            >
              {isDeletingHabit ? 'Excluindo...' : 'Sim, excluir hábito'}
            </ModalDangerButton>
            <ModalCancelButton
              type="button"
              onClick={() => setShowDeleteHabitModal(false)}
              disabled={isDeletingHabit}
            >
              Cancelar
            </ModalCancelButton>
          </StoreModalContent>
        </StoreModalOverlay>
      )}

      {/* @audit-ok [Excluir Conta (5) — modal de confirmação que exige a senha do usuário] */}
      {showDeleteAccountModal && (
        <StoreModalOverlay role="dialog" aria-modal="true" aria-label="Confirmar exclusão de conta">
          <StoreModalContent>
            <ModalIconWrapper style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger-color)' }}>
              <AlertTriangle size={28} aria-hidden="true" />
            </ModalIconWrapper>
            <ModalTitle>Excluir sua conta?</ModalTitle>
            <ModalText>
              Esta ação é <strong>permanente</strong> e apaga todos os seus dados. Digite sua
              senha para confirmar.
            </ModalText>
            <ModalInput
              type="password"
              placeholder="Sua senha"
              value={deleteAccountPassword}
              onChange={e => setDeleteAccountPassword(e.target.value)}
              aria-label="Senha para confirmar exclusão da conta"
              autoComplete="current-password"
            />
            <ModalDangerButton
              type="button"
              onClick={handleConfirmDeleteAccount}
              disabled={isDeletingAccount || !deleteAccountPassword}
              aria-busy={isDeletingAccount}
            >
              {isDeletingAccount ? 'Excluindo...' : 'Excluir minha conta'}
            </ModalDangerButton>
            <ModalCancelButton
              type="button"
              onClick={() => { setShowDeleteAccountModal(false); setDeleteAccountPassword(''); }}
              disabled={isDeletingAccount}
            >
              Cancelar
            </ModalCancelButton>
          </StoreModalContent>
        </StoreModalOverlay>
      )}
    </ProfileContainer>
  );
};

export default Profile;
