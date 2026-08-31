import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Globe, Moon, Sun, Monitor } from 'lucide-react';

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
  SettingsModalOverlay,
  SettingsModalContent,
  SettingsRow,
  ThemeSegmentedControl,
  ThemeOptionButton,
  LanguageButton,
  SettingsCloseButton
} from './styles';

// @audit-ok [Login (1) / Cadastro (1) — tela de entrada com abas de Login e Criar Conta]

const Login = () => {
  const { isDark, tema, setTema } = useThemeToggle();
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

  // @audit-ok [Login (2) / Cadastro (2) — captura submissão do formulário e chama executeAuth]
  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await executeAuth(isLoginTab, formData);
    if (result.success) {
      // @audit-ok [Login (17) / Cadastro (18) — redireciona para home após autenticação]
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
        <TabButton $active={isLoginTab} onClick={() => setIsLoginTab(true)} type="button">
          Entrar
        </TabButton>
        <TabButton $active={!isLoginTab} onClick={() => setIsLoginTab(false)} type="button">
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
            <><Spinner aria-hidden="true" /><span>Processando...</span></>
          ) : (
            isLoginTab ? 'Entrar' : 'Criar Conta'
          )}
        </SubmitButton>
      </FormContainer>

      {showSettings && (
        <SettingsModalOverlay onClick={() => setShowSettings(false)}>
          <SettingsModalContent onClick={e => e.stopPropagation()}>
            <h3>Configurações</h3>
            <SettingsRow>
              <div className="label"><Globe size={20} /> Idioma</div>
              <LanguageButton>🇧🇷 PT</LanguageButton>
            </SettingsRow>
            <SettingsRow>
              <div className="label">
                {isDark ? <Moon size={20} aria-hidden="true" /> : <Sun size={20} aria-hidden="true" />}
                Tema
              </div>
              <ThemeSegmentedControl role="group" aria-label="Escolher tema">
                <ThemeOptionButton
                  type="button"
                  $active={tema === 'claro'}
                  aria-pressed={tema === 'claro'}
                  aria-label="Tema claro"
                  onClick={() => setTema('claro')}
                >
                  <Sun size={16} aria-hidden="true" />
                </ThemeOptionButton>
                <ThemeOptionButton
                  type="button"
                  $active={tema === 'escuro'}
                  aria-pressed={tema === 'escuro'}
                  aria-label="Tema escuro"
                  onClick={() => setTema('escuro')}
                >
                  <Moon size={16} aria-hidden="true" />
                </ThemeOptionButton>
                <ThemeOptionButton
                  type="button"
                  $active={tema === 'sistema'}
                  aria-pressed={tema === 'sistema'}
                  aria-label="Tema do sistema"
                  onClick={() => setTema('sistema')}
                >
                  <Monitor size={16} aria-hidden="true" />
                </ThemeOptionButton>
              </ThemeSegmentedControl>
            </SettingsRow>
            <SettingsCloseButton onClick={() => setShowSettings(false)}>Fechar</SettingsCloseButton>
          </SettingsModalContent>
        </SettingsModalOverlay>
      )}
    </LoginContainer>
  );
};

export default Login;
