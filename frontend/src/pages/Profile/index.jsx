import React, { useState } from 'react';
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

const Profile = () => {
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useThemeToggle();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    nome: 'Usuário',
    senhaAtual: '',
    novaSenha: '',
    fusoHorario: 'America/Sao_Paulo'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await updateProfile({
        nome: formData.nome,
        fusoHorario: formData.fusoHorario,
        ...(formData.novaSenha && { senhaAtual: formData.senhaAtual, novaSenha: formData.novaSenha })
      });
      addToast('Perfil atualizado com sucesso!', 'success');
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
          <ToggleSwitch $active={isDark}>
            <div className="dot" />
          </ToggleSwitch>
        </SettingsRow>

        <div style={{ marginTop: '24px' }}></div>
        <SectionTitle>Seus Dados</SectionTitle>
        
        <FormGroup>
          <Label htmlFor="profile-nome">Nome</Label>
          <Input 
            id="profile-nome"
            type="text" 
            value={formData.nome} 
            onChange={e => setFormData({...formData, nome: e.target.value})} 
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="profile-fuso">Fuso Horário</Label>
          <Select 
            id="profile-fuso"
            value={formData.fusoHorario} 
            onChange={e => setFormData({...formData, fusoHorario: e.target.value})}
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
            onChange={e => setFormData({...formData, senhaAtual: e.target.value})} 
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="profile-nova-senha">Nova Senha</Label>
          <Input 
            id="profile-nova-senha"
            type="password" 
            value={formData.novaSenha} 
            onChange={e => setFormData({...formData, novaSenha: e.target.value})} 
          />
        </FormGroup>
        
        <SubmitButton type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </SubmitButton>
      </FormContainer>
      
      <LogoutButton onClick={logout} aria-label="Sair da sua conta">
        Sair do Aplicativo
      </LogoutButton>
    </ProfileContainer>
  );
};

export default Profile;
