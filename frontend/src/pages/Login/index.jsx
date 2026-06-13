import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Globe, Moon, Sun } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { useThemeToggle } from '../../contexts/ThemeToggleContext';
import { useToast } from '../../contexts/ToastContext';
import { useLogin } from './useLogin';

import luaFlutuando from '../../assets/lua_flutuando.png';
import solFlutuando from '../../assets/sol_flutuando.webp';

import {
  LoginContainer,
  MenuBtn,
  HeaderWrapper,
  LogoWrapper,
  Title,
  Subtitle,
  TabContainer,
  TabButton,
  FormContainer,
  FormGroup,
  Label,
  Input,
  SubmitButton,
  Spinner,
  Divider,
  GoogleButton,
  SettingsModalOverlay,
  SettingsModalContent,
  SettingsRow,
  ToggleSwitch,
  LanguageButton,
  SettingsCloseButton
} from './styles';

const Login = () => {
  const { isDark, toggleTheme } = useThemeToggle();
  const { login, register } = useAuth();
  const { isSubmitting, executeAuth } = useLogin(login, register);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [formData, setFormData] = useState({
    nome: '', 
    email: '', 
    senha: '', 
    confirmarSenha: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await executeAuth(isLoginTab, formData);
    
    if (result.success) {
      navigate('/home');
    } else {
      addToast(result.error, 'error');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <LoginContainer>
      <MenuBtn onClick={() => setShowSettings(true)} aria-label="Abrir configurações">
        <Menu size={28} />
      </MenuBtn>

      <HeaderWrapper>
        <LogoWrapper>
          <img src={isDark ? luaFlutuando : solFlutuando} alt="Avatar do usuário" />
        </LogoWrapper>
        <Title>Tempo Claro</Title>
        <Subtitle>Foco que flui como a natureza.</Subtitle>
      </HeaderWrapper>

      <TabContainer>
        <TabButton 
          $active={isLoginTab}
          onClick={() => setIsLoginTab(true)}
          type="button"
        >
          Entrar
        </TabButton>
        <TabButton 
          $active={!isLoginTab}
          onClick={() => setIsLoginTab(false)}
          type="button"
        >
          Criar Conta
        </TabButton>
      </TabContainer>

      <FormContainer onSubmit={handleSubmit}>
        {!isLoginTab && (
          <FormGroup>
            <Label htmlFor="login-nome">Seu Nome</Label>
            <Input 
              id="login-nome"
              type="text" 
              name="nome" 
              placeholder="Como quer ser chamado?" 
              value={formData.nome} 
              onChange={handleChange} 
              required={!isLoginTab}
            />
          </FormGroup>
        )}
        
        <FormGroup>
          <Label htmlFor="login-email">E-mail</Label>
          <Input 
            id="login-email"
            type="email" 
            name="email" 
            placeholder="seu@email.com" 
            value={formData.email} 
            onChange={handleChange} 
            required 
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="login-senha">Senha</Label>
          <Input 
            id="login-senha"
            type="password" 
            name="senha" 
            placeholder="••••••••" 
            value={formData.senha} 
            onChange={handleChange} 
            required 
          />
        </FormGroup>
        
        {!isLoginTab && (
          <FormGroup>
            <Label htmlFor="login-confirmar-senha">Confirme a Senha</Label>
            <Input 
              id="login-confirmar-senha"
              type="password" 
              name="confirmarSenha" 
              placeholder="••••••••" 
              value={formData.confirmarSenha} 
              onChange={handleChange} 
              required={!isLoginTab}
            />
          </FormGroup>
        )}
        
        <SubmitButton type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner aria-hidden="true" />
              <span>Processando...</span>
            </>
          ) : (
            isLoginTab ? 'Entrar' : 'Criar Conta'
          )}
        </SubmitButton>
      </FormContainer>

      <Divider>ou</Divider>
      
      <GoogleButton type="button" onClick={() => {}}>
        <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Entrar com o Google
      </GoogleButton>

      {showSettings && (
        <SettingsModalOverlay onClick={() => setShowSettings(false)}>
          <SettingsModalContent onClick={e => e.stopPropagation()}>
            <h3>Configurações</h3>
            <SettingsRow>
              <div className="label">
                <Globe size={20} /> Idioma
              </div>
              <LanguageButton>🇧🇷 PT</LanguageButton>
            </SettingsRow>
            
            <SettingsRow $clickable onClick={toggleTheme}>
              <div className="label">
                {isDark ? <Moon size={20} /> : <Sun size={20} />} 
                Tema Escuro
              </div>
              <ToggleSwitch $active={isDark}>
                <div className="dot" />
              </ToggleSwitch>
            </SettingsRow>
            
            <SettingsCloseButton onClick={() => setShowSettings(false)}>
              Fechar
            </SettingsCloseButton>
          </SettingsModalContent>
        </SettingsModalOverlay>
      )}
    </LoginContainer>
  );
};

export default Login;
