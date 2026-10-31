package com.rodrigo.backend2java.usuario;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.rodrigo.backend2java.habito.HabitoRepository;
import com.rodrigo.backend2java.infra.exception.RecursoNaoEncontradoException;
import com.rodrigo.backend2java.verificacao.CodigoVerificacaoRepository;
import com.rodrigo.backend2java.usuario.model.ProfileUpdateDTO;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * CT070 (DEF-13): o conversor de JWT já barra o token de um usuário apagado, então o caso só
 * aparece numa corrida entre a autenticação e o serviço. Aqui ele é provocado direto no serviço.
 */
@ExtendWith(MockitoExtension.class)
class UsuarioServiceUsuarioAusenteTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private HabitoRepository habitoRepository;
    @Mock
    private CodigoVerificacaoRepository codigoVerificacaoRepository;

    private UsuarioService servico() {
        return new UsuarioService(usuarioRepository, passwordEncoder, habitoRepository, codigoVerificacaoRepository);
    }

    @Test
    void ct070_buscarPerfilDeUsuarioAusente_lancaRecursoNaoEncontrado() {
        when(usuarioRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThrows(RecursoNaoEncontradoException.class,
                () -> servico().buscarPerfil("ninguem@teste.com"));
    }

    @Test
    void ct070_atualizarPerfilDeUsuarioAusente_lancaRecursoNaoEncontrado() {
        when(usuarioRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThrows(RecursoNaoEncontradoException.class,
                () -> servico()
                        .atualizarPerfil("ninguem@teste.com", ProfileUpdateDTO.builder().nome("X").build()));
    }
}
