import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeToggle } from '../../contexts/ThemeToggleContext';
import { useToast } from '../../contexts/ToastContext';
import { updateProfile, getMe } from '../../services/api';
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

// @audit-ok [E1.4 — mesmo mínimo validado no backend (UsuarioService), para a
// mensagem de erro aparecer sem precisar de round-trip à API.]
const TAMANHO_MINIMO_SENHA = 8;

const Profile = () => {
  const { logout, user, updateLocalUser } = useAuth();
  const { isDark, toggleTheme } = useThemeToggle();
  const { addToast } = useToast();

  // @audit-ok [Perfil (2) — estado inicial do formulário a partir do usuário autenticado]
  // nome/fusoHorario aqui são só o placeholder até GET /me responder (abaixo) —
  // nunca a fonte de verdade. fusoHorario começava fixo em 'America/Sao_Paulo'
  // e NUNCA era atualizado com o valor real: por isso o seletor sempre mostrava
  // Brasília, e salvar qualquer outra coisa (ex.: só o nome) reenviava esse
  // default e sobrescrevia o fuso de verdade que o usuário já tinha salvo.
  const [formData, setFormData] = useState({
    nome: user?.name || '',
    senhaAtual: '',
    novaSenha: '',
    confirmarNovaSenha: '',
    fusoHorario: 'America/Sao_Paulo'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // @audit-ok [E1.5 (item 3) — carrega os dados reais de GET /me ao montar, não
  // o que ficou em cache desde o login (AuthResponseDTO só tem nome/email/fuso
  // do momento do login — pode estar desatualizado numa sessão longa). É esta
  // chamada que corrige o fuso_horario exibido/reenviado no formulário.]
  useEffect(() => {
    getMe()
      .then(res => {
        setFormData(prev => ({
          ...prev,
          nome: res.data.nome ?? prev.nome,
          fusoHorario: res.data.fuso_horario || 'America/Sao_Paulo'
        }));
      })
      .catch(() => {
        // GET /me falhou — mantém nome do AuthContext e o fuso padrão como
        // estavam; handleUpdate segue funcionando normalmente.
      });
  }, []);

  // @audit-ok [Perfil (3) — processa submissão do formulário de atualização]
  const handleUpdate = async (e) => {
    e.preventDefault();

    // @audit-ok [E1.4 — falso sucesso: antes, preencher só "Senha Atual" (com
    // "Nova Senha" vazia) enviava um payload SEM nenhuma das duas senhas —
    // "formData.novaSenha &&" no spread abaixo nem olhava senhaAtual — e o
    // usuário recebia "Perfil atualizado com sucesso!" achando que trocou a
    // senha. Bloqueia os dois preenchimentos parciais antes de chamar a API.]
    if (formData.senhaAtual && !formData.novaSenha) {
      addToast('Preencha a nova senha para concluir a alteração.', 'error');
      return;
    }
    if (formData.novaSenha && !formData.senhaAtual) {
      addToast('Informe a senha atual para alterar a senha.', 'error');
      return;
    }
    // @audit-ok [E1.4 (item 3/4) — só valida confirmação/comprimento quando o
    // usuário está de fato tentando trocar a senha (novaSenha preenchida)]
    if (formData.novaSenha) {
      if (formData.novaSenha.length < TAMANHO_MINIMO_SENHA) {
        addToast(`A nova senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`, 'error');
        return;
      }
      if (formData.novaSenha !== formData.confirmarNovaSenha) {
        addToast('A confirmação não corresponde à nova senha.', 'error');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const trocandoSenha = Boolean(formData.novaSenha);
      // @audit-ok [Perfil (4) — monta payload incluindo senhas apenas se novaSenha foi preenchida]
      // As chaves são snake_case porque é isso que ProfileUpdateDTO declara. Antes
      // eram enviadas em camelCase (fusoHorario/senhaAtual/novaSenha): o Jackson
      // não as reconhecia, então fuso e senha nunca chegavam a ser atualizados —
      // e mesmo assim a tela exibia "Perfil atualizado com sucesso!".
      await updateProfile({
        nome: formData.nome,
        fuso_horario: formData.fusoHorario,
        ...(trocandoSenha && {
          senha_atual: formData.senhaAtual,
          nova_senha: formData.novaSenha
        })
      });
      // @audit-ok [Perfil (15) — confirma sucesso e limpa campos de senha]
      updateLocalUser({ name: formData.nome });
      // @audit-ok [E1.4 (item 5) — distingue a mensagem: "Senha alterada" só
      // quando de fato havia troca de senha no payload enviado]
      addToast(trocandoSenha ? 'Senha alterada com sucesso!' : 'Perfil atualizado com sucesso!', 'success');
      // @audit-ok [Perfil (16) — limpa campos de senha após salvar]
      setFormData(prev => ({ ...prev, senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' }));
    } catch (err) {
      console.error("Erro ao atualizar perfil", err);
      // @audit-ok [E1.4 — usa a mensagem real do backend (ex.: "Senha atual
      // incorreta") em vez de um texto genérico que esconde o motivo real]
      const mensagem = err.response?.data?.message || 'Erro ao atualizar perfil. Verifique seus dados.';
      addToast(mensagem, 'error');
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

        {/* @audit-ok [E1.4 (item 3) — confirmação da nova senha] */}
        <FormGroup>
          <Label htmlFor="profile-confirmar-nova-senha">Confirmar Nova Senha</Label>
          <Input
            id="profile-confirmar-nova-senha"
            type="password"
            value={formData.confirmarNovaSenha}
            onChange={e => setFormData({ ...formData, confirmarNovaSenha: e.target.value })}
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
